import { QuaternionO, V3O } from '.'
import { Quaternion } from './math/Quaternion'
import { V3 } from './math/V3'

export interface Link {
  /**
   * The rotation at the base of the link
   */
  rotation: Quaternion
  /**
   * The the angle which this link can rotate around it's joint
   * A value of Math.PI/2 would represent +-45 degrees from the preceding links rotation.
   */
  readonly constraints?: Constraints
  readonly length: number
}

export interface Constraints {
  pitch?: number
  yaw?: number
  roll?: number
}

export interface SolveOptions {
  /**
   * Angle gap taken to calculate the gradient of the error function
   * Usually the default here will do.
   * @default 0.00001
   */
  deltaAngle?: number
  /**
   * Sets the 'speed' at which the algorithm converges on the target.
   * Larger values will cause oscillations, or vibrations about the target
   * Lower values may move too slowly. You should tune this manually
   *
   * Can either be a constant, or a function that returns a learning rate
   * @default 0.0001
   */
  learningRate?: number | ((errorDistance: number) => number)
  /**
   * Useful if there is oscillations or vibration around the target
   * @default 0
   */
  acceptedError?: number
}

/**
 * Changes joint angle to minimize distance of end effector to target
 * Mutates each link.angle
 */
export function solve(links: Link[], basePosition: V3, target: V3, options?: SolveOptions) {
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

  if (error < acceptedError) return

  if (joints.length !== links.length + 1) {
    throw new Error(
      `Joint transforms should have the same length as links + 1. Got ${joints.length}, expected ${links.length}`,
    )
  }

  /**
   * 1. Find angle steps that minimize error
   * 2. Apply angle steps
   */
  links
    .map((link, linkIndex) => {
      // For each, calculate partial derivative, sum to give full numerical derivative
      const angleStep: V3 = V3O.fromArray(
        [0, 0, 0].map((_, v3Index) => {
          const eulerAngle = [0, 0, 0]
          eulerAngle[v3Index] = deltaAngle
          const linkWithAngleDelta = {
            length: link.length,
            rotation: QuaternionO.multiply(link.rotation, QuaternionO.fromEulerAngles(V3O.fromArray(eulerAngle))),
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

      return { link, angleStep: QuaternionO.fromEulerAngles(angleStep) }
    })
    .forEach(({ link, angleStep }) => {
      link.rotation = QuaternionO.multiply(link.rotation, angleStep)
      if (link.constraints === undefined) return
      const bounds: V3 = V3O.scale(
        [link.constraints.pitch ?? Infinity, link.constraints.yaw ?? Infinity, link.constraints.roll ?? Infinity],
        1 / 2,
      )
      link.rotation = QuaternionO.clamp(link.rotation, bounds)
    })
}

export interface JointTransform {
  position: V3
  rotation: Quaternion
}

/**
 * Distance from end effector to the target
 */
export function getErrorDistance(links: Link[], base: JointTransform, target: V3): number {
  const effectorPosition = getEndEffectorPosition(links, base)
  return V3O.euclideanDistance(target, effectorPosition)
}

/**
 * Absolute position of the end effector (last links tip)
 */
export function getEndEffectorPosition(links: Link[], joint: JointTransform): V3 {
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
  effectorPosition: V3
} {
  const transforms = [joint]

  for (let index = 0; index < links.length; index++) {
    const currentLink = links[index]!
    const parentTransform = transforms[index]!

    const absoluteRotation = QuaternionO.multiply(parentTransform.rotation, currentLink.rotation)
    const relativePosition = V3O.fromPolar(currentLink.length, absoluteRotation)
    const absolutePosition = V3O.add(relativePosition, parentTransform.position)
    transforms.push({ position: absolutePosition, rotation: absoluteRotation })
  }

  const effectorPosition = transforms[transforms.length - 1]!.position

  return { transforms, effectorPosition }
}
