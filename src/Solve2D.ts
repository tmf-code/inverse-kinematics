import { clamp } from './math/MathUtils'
import { V2, V2O } from '.'
import { SolveOptions } from './SolveOptions'

export interface Link {
  /**
   * The rotation at the base of the link
   */
  readonly rotation: number
  /**
   * The the angle which this link can rotate around it's joint
   * A value of Math.PI/2 would represent +-45 degrees from the preceding links rotation.
   */
  readonly constraint?: number
  readonly length: number
}

export interface SolveResult {
  /**
   * Copy of the structure of input links
   * With the possibility of their rotation being changed
   */
  readonly links: Link[]
  /**
   * Returns the error distance after the solve step
   */
  readonly getErrorDistance: () => number
  /**
   * true if the solve terminates early due to the end effector being close to the target.
   * undefined if solve has adjusted the rotations in links
   *
   * undefined is used here as we don't rerun error checking after the angle adjustment, thus it cannot be known true or false.
   * This is done to improve performance
   */
  readonly isWithinAcceptedError: true | undefined
}

/**
 * Changes joint angle to minimize distance of end effector to target
 * Mutates each link.angle
 */
export function solve(links: readonly Link[], basePosition: V2, target: V2, options?: SolveOptions): SolveResult {
  // Setup defaults
  const deltaAngle = options?.deltaAngle ?? 0.00001
  const learningRate = options?.learningRate ?? 0.0001

  const acceptedError = options?.acceptedError ?? 0

  // Precalculate joint positions
  const { transforms: joints, effectorPosition } = getJointTransforms(links, {
    position: basePosition,
    rotation: 0,
  })

  const error = V2O.euclideanDistance(target, effectorPosition)

  if (error < acceptedError) return { links: [...links], isWithinAcceptedError: true, getErrorDistance: () => error }

  if (joints.length !== links.length + 1) {
    throw new Error(
      `Joint transforms should have the same length as links + 1. Got ${joints.length}, expected ${links.length}`,
    )
  }

  /**
   * 1. Find angle steps that minimize error
   * 2. Apply angle steps
   */
  const result: Link[] = links
    .map((link, index) => {
      const linkWithAngleDelta = {
        length: link.length,
        rotation: link.rotation + deltaAngle,
      }

      // Get remaining links from this links joint
      const projectedLinks: Link[] = [linkWithAngleDelta, ...links.slice(index + 1)]

      // Get gradient from small change in joint angle
      const joint = joints[index]!
      const projectedError = getErrorDistance(projectedLinks, joint, target)
      const gradient = (projectedError - error) / deltaAngle

      // Get resultant angle step which minimizes error
      const angleStep = -gradient * (typeof learningRate === 'function' ? learningRate(projectedError) : learningRate)

      return { link, angleStep }
    })
    .map(({ link: { length, rotation, constraint }, angleStep }) => {
      const steppedRotation = rotation + angleStep
      if (constraint === undefined) return { length, rotation: steppedRotation }

      const halfContraint = constraint / 2
      const clampedRotation = clamp(steppedRotation, -halfContraint, halfContraint)
      return { length, rotation: clampedRotation, constraint }
    })

  return {
    links: result,
    getErrorDistance: () =>
      getErrorDistance(
        result,
        {
          position: basePosition,
          rotation: 0,
        },
        target,
      ),
    isWithinAcceptedError: undefined,
  }
}

export interface JointTransform {
  readonly position: V2
  readonly rotation: number
}

/**
 * Distance from end effector to the target
 */
export function getErrorDistance(links: readonly Link[], base: JointTransform, target: V2): number {
  const effectorPosition = getEndEffectorPosition(links, base)
  return V2O.euclideanDistance(target, effectorPosition)
}

/**
 * Absolute position of the end effector (last links tip)
 */
export function getEndEffectorPosition(links: readonly Link[], joint: JointTransform): V2 {
  return getJointTransforms(links, joint).effectorPosition
}

/**
 * Returns the absolute position and rotation of each link
 */
export function getJointTransforms(
  links: readonly Link[],
  joint: JointTransform,
): {
  readonly transforms: JointTransform[]
  readonly effectorPosition: V2
} {
  const transforms = [joint]

  for (let index = 0; index < links.length; index++) {
    const currentLink = links[index]!
    const parentTransform = transforms[index]!

    const absoluteRotation = currentLink.rotation + parentTransform.rotation
    const relativePosition = V2O.fromPolar(currentLink.length, absoluteRotation)
    const absolutePosition = V2O.add(relativePosition, parentTransform.position)
    transforms.push({ position: absolutePosition, rotation: absoluteRotation })
  }

  const effectorPosition = transforms[transforms.length - 1]!.position

  return { transforms, effectorPosition }
}
