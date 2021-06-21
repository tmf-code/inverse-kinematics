import { QuaternionO, SolveOptions, V3O } from '.'
import { Quaternion } from './math/Quaternion'
import { V3 } from './math/V3'
import { Range } from './Range'

export interface Link {
  /**
   * The rotation at the base of the link
   */
  readonly rotation?: Quaternion
  /**
   * The the angle which this link can rotate around it's joint
   * A value of Math.PI/2 would represent +-45 degrees from the preceding links rotation.
   */
  readonly constraints?: Constraints
  readonly length: number
}

export interface Constraints {
  readonly pitch?: number | Range
  readonly yaw?: number | Range
  readonly roll?: number | Range
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
export function solve(links: readonly Link[], basePosition: V3, target: V3, options?: SolveOptions): SolveResult {
  // Setup defaults
  const deltaAngle = options?.deltaAngle ?? 0.00001
  const learningRate = options?.learningRate ?? 0.0001

  const acceptedError = options?.acceptedError ?? 0

  // Precalculate joint positions
  const { transforms: joints, effectorPosition } = getJointTransforms(links, {
    position: basePosition,
    rotation: QuaternionO.zeroRotation(),
  })

  const error = V3O.euclideanDistance(target, effectorPosition)

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
  const result: Link[] = links
    .map(({ length, rotation = QuaternionO.zeroRotation(), constraints }, linkIndex) => {
      // For each, calculate partial derivative, sum to give full numerical derivative
      const angleStep: V3 = V3O.fromArray(
        [0, 0, 0].map((_, v3Index) => {
          const eulerAngle = [0, 0, 0]
          eulerAngle[v3Index] = deltaAngle
          const linkWithAngleDelta = {
            length: length,
            rotation: QuaternionO.multiply(rotation, QuaternionO.fromEulerAngles(V3O.fromArray(eulerAngle))),
          }

          // Get remaining links from this links joint
          const projectedLinks: Link[] = [linkWithAngleDelta, ...links.slice(linkIndex + 1)]

          // Get gradient from small change in joint angle
          const joint = joints[linkIndex]!
          const projectedError = getErrorDistance(projectedLinks, joint, target)
          const gradient = (projectedError - error) / deltaAngle

          // Get resultant angle step which minimizes error
          const angleStep =
            -gradient * (typeof learningRate === 'function' ? learningRate(projectedError) : learningRate)

          return angleStep
        }),
      )

      return { link: { length, rotation, constraints }, angleStep: QuaternionO.fromEulerAngles(angleStep) }
    })
    .map(({ link: { length, rotation, constraints }, angleStep }) => {
      const steppedRotation = QuaternionO.multiply(rotation, angleStep)
      if (constraints === undefined) return { length, rotation: steppedRotation }

      const { pitch, yaw, roll } = constraints

      let pitchMin: number
      let pitchMax: number
      if (typeof pitch === 'number') {
        pitchMin = -pitch / 2
        pitchMax = pitch / 2
      } else {
        pitchMin = pitch?.min ?? Infinity
        pitchMax = pitch?.max ?? Infinity
      }

      let yawMin: number
      let yawMax: number
      if (typeof yaw === 'number') {
        yawMin = -yaw / 2
        yawMax = yaw / 2
      } else {
        yawMin = yaw?.min ?? Infinity
        yawMax = yaw?.max ?? Infinity
      }

      let rollMin: number
      let rollMax: number
      if (typeof roll === 'number') {
        rollMin = -roll / 2
        rollMax = roll / 2
      } else {
        rollMin = roll?.min ?? Infinity
        rollMax = roll?.max ?? Infinity
      }

      const lowerBound: V3 = [pitchMin, yawMin, rollMin]
      const upperBound: V3 = [pitchMax, yawMax, rollMax]
      const clampedRotation = QuaternionO.clamp(steppedRotation, lowerBound, upperBound)
      return { length, rotation: clampedRotation, constraints: copyConstraints(constraints) }
    })

  return {
    links: result,
    getErrorDistance: () =>
      getErrorDistance(
        result,
        {
          position: basePosition,
          rotation: QuaternionO.zeroRotation(),
        },
        target,
      ),
    isWithinAcceptedError: undefined,
  }
}

export interface JointTransform {
  readonly position: V3
  readonly rotation: Quaternion
}

/**
 * Distance from end effector to the target
 */
export function getErrorDistance(links: readonly Link[], base: JointTransform, target: V3): number {
  const effectorPosition = getEndEffectorPosition(links, base)
  return V3O.euclideanDistance(target, effectorPosition)
}

/**
 * Absolute position of the end effector (last links tip)
 */
export function getEndEffectorPosition(links: readonly Link[], joint: JointTransform): V3 {
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
  readonly effectorPosition: V3
} {
  const transforms = [{ ...joint }]

  for (let index = 0; index < links.length; index++) {
    const currentLink = links[index]!
    const parentTransform = transforms[index]!

    const absoluteRotation = QuaternionO.multiply(
      parentTransform.rotation,
      currentLink.rotation ?? QuaternionO.zeroRotation(),
    )
    const relativePosition = V3O.fromPolar(currentLink.length, absoluteRotation)
    const absolutePosition = V3O.add(relativePosition, parentTransform.position)
    transforms.push({ position: absolutePosition, rotation: absoluteRotation })
  }

  const effectorPosition = transforms[transforms.length - 1]!.position

  return { transforms, effectorPosition }
}

function copyLink({ rotation, length, constraints }: Link): Link {
  return { rotation, length, constraints: constraints === undefined ? undefined : copyConstraints(constraints) }
}

type Writeable<T> = { -readonly [P in keyof T]: T[P] }

function copyConstraints({ pitch, yaw, roll }: Constraints): Constraints {
  const result: Writeable<Constraints> = {}

  if (typeof pitch === 'number') {
    result.pitch = pitch
  } else if (typeof pitch !== undefined) {
    result.pitch = { ...pitch! }
  }

  if (typeof yaw === 'number') {
    result.yaw = yaw
  } else if (typeof yaw !== undefined) {
    result.yaw = { ...yaw! }
  }

  if (typeof roll === 'number') {
    result.roll = roll
  } else if (typeof roll !== undefined) {
    result.roll = { ...roll! }
  }

  return result
}
