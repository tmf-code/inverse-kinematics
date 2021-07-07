import { clamp } from './math/MathUtils'
import { V2, V2O } from '.'
import { SolveOptions } from './SolveOptions'
import { Range } from './Range'

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
  length: number
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
 */
export function solve(links: Link[], baseJoint: JointTransform, target: V2, options?: SolveOptions): SolveResult {
  // Setup defaults
  const deltaAngle = options?.deltaAngle ?? 0.00001
  const learningRate = options?.learningRate ?? 0.0001

  const acceptedError = options?.acceptedError ?? 0

  // Precalculate joint positions
  const { transforms: joints, effectorPosition } = getJointTransforms(links, baseJoint)

  const error = V2O.euclideanDistance(target, effectorPosition)

  if (error < acceptedError)
    return { links: links.map(copyLink), isWithinAcceptedError: true, getErrorDistance: () => error }

  if (joints.length !== links.length + 1) {
    throw new Error(
      `Joint transforms should have the same length as links + 1. Got ${joints.length}, expected ${links.length}`,
    )
  }

  /**
   * 1. Find angle steps that minimize error
   * 2. Apply angle steps
   */
  const withAngleStep = links.map(({ rotation = 0, length, constraints }, index) => {
    const linkWithAngleDelta = {
      length,
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

    return { rotation: rotation + angleStep, length, constraints }
  })

  const adjustedJoints = getJointTransforms(withAngleStep, baseJoint).transforms

  const withConstraints = withAngleStep.map(({ length, rotation, constraints }, index) => {
    if (constraints === undefined) return { length, rotation }

    if (typeof constraints === 'number') {
      const halfConstraint = constraints / 2
      const clampedRotation = clamp(rotation, -halfConstraint, halfConstraint)
      return { length, rotation: clampedRotation, constraints: constraints }
    }

    if (isExactRotation(constraints)) {
      if (constraints.type === 'global') {
        const targetRotation = constraints.value
        const currentRotation = adjustedJoints[index + 1]!.rotation
        const deltaRotation = targetRotation - currentRotation

        return { length, rotation: rotation + deltaRotation, constraints: constraints }
      } else {
        return { length, rotation: constraints.value, constraints: constraints }
      }
    } else {
      const clampedRotation = clamp(rotation, constraints.min, constraints.max)
      return { length, rotation: clampedRotation, constraints }
    }
  })

  return {
    links: withConstraints,
    getErrorDistance: () => getErrorDistance(withConstraints, baseJoint, target),
    isWithinAcceptedError: undefined,
  }
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
    const relativePosition = V2O.fromPolar(currentLink.length, absoluteRotation)
    const absolutePosition = V2O.add(relativePosition, parentTransform.position)
    transforms.push({ position: absolutePosition, rotation: absoluteRotation })
  }

  const effectorPosition = transforms[transforms.length - 1]!.position
  const effectorRotation = transforms[transforms.length - 1]!.rotation

  return { transforms, effectorPosition, effectorRotation }
}

export function buildLink(length: number, rotation = 0, constraint?: number | Range | ExactRotation): Link {
  return {
    length,
    rotation,
    constraints: constraint,
  }
}

function copyLink({ rotation, length, constraints: constraint }: Link): Link {
  return { rotation, length, constraints: constraint === undefined ? undefined : constraint }
}

function isExactRotation(rotation: number | Range | ExactRotation): rotation is ExactRotation {
  return (rotation as ExactRotation).value !== undefined
}
