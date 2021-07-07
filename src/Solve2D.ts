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
   * The the angle which this link can rotate around it's joint
   * A value of Math.PI/2 would represent +-45 degrees from the preceding links rotation.
   */
  constraint?: number | Range | ExactRotation
  length: number
}

interface ExactRotation {
  value: number
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
  const withAngleStep = links.map(({ rotation = 0, length, constraint }, index) => {
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

    return { rotation: rotation + angleStep, length, constraint }
  })

  const adjustedJoints = getJointTransforms(withAngleStep, baseJoint).transforms

  const withConstraints = withAngleStep.map(({ length, rotation, constraint }, index) => {
    if (constraint === undefined) return { length, rotation }

    if (typeof constraint === 'number') {
      const halfConstraint = constraint / 2
      const clampedRotation = clamp(rotation, -halfConstraint, halfConstraint)
      return { length, rotation: clampedRotation, constraint }
    }

    if (isExactRotation(constraint)) {
      if (constraint.type === 'global') {
        const targetRotation = constraint.value
        const currentRotation = adjustedJoints[index + 1]!.rotation
        const deltaRotation = targetRotation - currentRotation

        return { length, rotation: rotation + deltaRotation, constraint }
      } else {
        return { length, rotation: constraint.value, constraint }
      }
    } else {
      const clampedRotation = clamp(rotation, constraint.min, constraint.max)
      return { length, rotation: clampedRotation, constraint }
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
    constraint,
  }
}

function copyLink({ rotation, length, constraint: constraint }: Link): Link {
  return { rotation, length, constraint: constraint === undefined ? undefined : constraint }
}

function isExactRotation(rotation: number | Range | ExactRotation): rotation is ExactRotation {
  return (rotation as ExactRotation).value !== undefined
}
