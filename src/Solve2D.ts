import { V2, V2O } from '.'
import { clamp } from './math/MathUtils'
import { Range } from './Range'
import {
  defaultCCDOptions,
  defaultFABRIKOptions,
  SolveCCDOptions,
  SolveFABRIKOptions,
  SolveOptions,
} from './SolveOptions'

export interface Link {
  /**
   * The rotation at the base of the link
   */
  rotation: number

  /**
   * undefined: No constraint
   *
   * Range: minimum angle, maximum angle (radians), positive is anticlockwise from previous Link's direction vector
   *
   * ExactRotation: Either a global, or local rotation which the Link is locked to
   */
  constraints?: Constraints
  position: V2
}

type Constraints = number | Range | ExactRotation

interface ExactRotation {
  value: number
  /**
   * 'local': Relative to previous links direction vector
   *
   * 'global': Relative to the baseJoints world transform
   */
  type: 'global' | 'local'
}

export interface SolveResult {
  /**
   * Copy of the structure of input links
   * With the possibility of their rotation being changed
   */
  links: Link[]
  /**
   * Returns the error distance after the solve step
   */
  getErrorDistance: () => number
  /**
   * true if the solve terminates early due to the end effector being close to the target.
   * undefined if solve has adjusted the rotations in links
   *
   * undefined is used here as we don't rerun error checking after the angle adjustment, thus it cannot be known true or false.
   * This is done to improve performance
   */
  isWithinAcceptedError: true | undefined
}

/**
 * Changes joint angle to minimize distance of end effector to target
 *
 * If given no options, runs in FABRIK mode
 */
export function solve(
  links: Link[],
  baseJoint: JointTransform,
  target: V2,
  options: SolveOptions = { method: 'FABRIK' },
): SolveResult {
  switch (options.method) {
    case 'FABRIK':
      return solveFABRIK(links, baseJoint, target, {
        method: 'FABRIK',
        acceptedError: options.acceptedError ?? defaultFABRIKOptions.acceptedError,
        deltaAngle: options.deltaAngle ?? defaultFABRIKOptions.deltaAngle,
        learningRate: options.learningRate ?? defaultFABRIKOptions.learningRate,
      })

    case 'CCD':
      return solveCCD(links, baseJoint, target, {
        method: 'CCD',
        acceptedError: options.acceptedError ?? defaultCCDOptions.acceptedError,
        learningRate: options.learningRate ?? defaultCCDOptions.learningRate,
      })
  }
}

function solveFABRIK(
  links: Link[],
  baseJoint: JointTransform,
  target: V2,
  { learningRate, deltaAngle, acceptedError }: Required<SolveFABRIKOptions>,
): SolveResult {
  const { transforms: joints, effectorPosition } = getJointTransforms(links, baseJoint)
  const error = V2O.euclideanDistance(target, effectorPosition)
  if (error < acceptedError)
    return { links: links.map(copyLink), isWithinAcceptedError: true, getErrorDistance: () => error }

  if (joints.length !== links.length + 1) {
    throw new Error(
      `Joint transforms should have the same length as links + 1. Got ${joints.length}, expected ${links.length}`,
    )
  }

  const withAngleStep = links.map(({ rotation = 0, position, constraints }, index) => {
    const linkWithAngleDelta = {
      position,
      rotation: rotation + deltaAngle,
    }

    // Get remaining links from this links joint
    const projectedLinks: Link[] = [linkWithAngleDelta, ...links.slice(index + 1)]

    // Get gradient from small change in joint angle
    const joint = joints[index]!
    const projectedError = getErrorDistance(projectedLinks, joint, target)
    const gradient = (projectedError - error) / deltaAngle

    // Get resultant angle step which minimizes error
    const angleStep = -gradient * (typeof learningRate === 'function' ? learningRate(projectedError) : learningRate)

    return { rotation: rotation + angleStep, position, constraints }
  })

  const adjustedJoints = getJointTransforms(withAngleStep, baseJoint).transforms
  const withConstraints = applyConstraints(withAngleStep, adjustedJoints)

  return {
    links: withConstraints,
    getErrorDistance: () => getErrorDistance(withConstraints, baseJoint, target),
    isWithinAcceptedError: undefined,
  }
}

function solveCCD(
  links: Link[],
  baseJoint: JointTransform,
  target: V2,
  { acceptedError, learningRate }: Required<SolveCCDOptions>,
): SolveResult {
  // 1. From base to tip, point projection from joint to effector at target
  let adjustedLinks: Link[] = [...links.map(copyLink)]

  for (let index = adjustedLinks.length - 1; index >= 0; index--) {
    const joints = getJointTransforms(adjustedLinks, baseJoint)
    const effectorPosition = joints.effectorPosition
    const error = V2O.euclideanDistance(target, effectorPosition)

    if (error < acceptedError) break

    const link = adjustedLinks[index]!
    const { rotation, position, constraints } = link
    const joint = joints.transforms[index]!

    const directionToTarget = V2O.angle(V2O.subtract(target, joint.position))
    const directionToEffector = V2O.angle(V2O.subtract(effectorPosition, joint.position))
    const angleBetween = directionToEffector - directionToTarget

    const angleStep = -angleBetween * (typeof learningRate === 'function' ? learningRate(error) : learningRate)
    const withAngleStep = { rotation: rotation + angleStep, position, constraints }
    adjustedLinks[index] = withAngleStep

    const adjustedJoints = getJointTransforms(adjustedLinks, baseJoint)
    const withConstraint = applyConstraint(withAngleStep, adjustedJoints.transforms[index + 1]!)
    adjustedLinks[index] = withConstraint
  }

  const adjustedJoints = getJointTransforms(adjustedLinks, baseJoint).transforms
  const withConstraints = applyConstraints(adjustedLinks, adjustedJoints)

  return {
    links: withConstraints,
    getErrorDistance: () => getErrorDistance(withConstraints, baseJoint, target),
    isWithinAcceptedError: undefined,
  }
}
function applyConstraint({ rotation, position, constraints }: Link, joint: JointTransform): Link {
  if (constraints === undefined) return { position, rotation }

  if (typeof constraints === 'number') {
    const halfConstraint = constraints / 2
    const clampedRotation = clamp(rotation, -halfConstraint, halfConstraint)
    return { position, rotation: clampedRotation, constraints: constraints }
  }

  if (isExactRotation(constraints)) {
    if (constraints.type === 'global') {
      const targetRotation = constraints.value
      const currentRotation = joint.rotation
      const deltaRotation = targetRotation - currentRotation

      return { position, rotation: rotation + deltaRotation, constraints: constraints }
    } else {
      return { position, rotation: constraints.value, constraints: constraints }
    }
  } else {
    const clampedRotation = clamp(rotation, constraints.min, constraints.max)
    return { position, rotation: clampedRotation, constraints }
  }
}

function applyConstraints(
  links: { rotation: number; position: V2; constraints?: Constraints }[],
  joints: JointTransform[],
) {
  return links.map((link, index) => applyConstraint(link, joints[index + 1]!))
}

export interface JointTransform {
  position: V2
  rotation: number
}

/**
 * Distance from end effector to the target
 */
export function getErrorDistance(links: Link[], base: JointTransform, target: V2): number {
  const effectorPosition = getEndEffectorPosition(links, base)
  return V2O.euclideanDistance(target, effectorPosition)
}

/**
 * Absolute position of the end effector (last links tip)
 */
export function getEndEffectorPosition(links: Link[], joint: JointTransform): V2 {
  return getJointTransforms(links, joint).effectorPosition
}

/**
 * Returns the absolute position and rotation of each link
 */
export function getJointTransforms(
  links: Link[],
  joint: JointTransform,
): {
  transforms: JointTransform[]
  effectorPosition: V2
  effectorRotation: number
} {
  const transforms = [joint]

  for (let index = 0; index < links.length; index++) {
    const currentLink = links[index]!
    const parentTransform = transforms[index]!

    const absoluteRotation = (currentLink.rotation ?? 0) + parentTransform.rotation
    const relativePosition = V2O.rotate(currentLink.position, absoluteRotation)
    const absolutePosition = V2O.add(relativePosition, parentTransform.position)
    transforms.push({ position: absolutePosition, rotation: absoluteRotation })
  }

  const effectorPosition = transforms[transforms.length - 1]!.position
  const effectorRotation = transforms[transforms.length - 1]!.rotation

  return { transforms, effectorPosition, effectorRotation }
}

export function buildLink(position: V2, rotation = 0, constraint?: number | Range | ExactRotation): Link {
  return {
    position,
    rotation,
    constraints: constraint,
  }
}

function copyLink({ rotation, position, constraints: constraint }: Link): Link {
  return { rotation, position: [...position], constraints: constraint === undefined ? undefined : constraint }
}

function isExactRotation(rotation: number | Range | ExactRotation): rotation is ExactRotation {
  return (rotation as ExactRotation).value !== undefined
}
