import { clamp } from './math/MathUtils'
import { V2, V2O } from '.'

export interface Link {
  /**
   * The rotation at the base of the link
   */
  rotation: number
  readonly constraint?: number
  readonly length: number
}

export interface SolveOptions {
  /**
   * @default 0.00001
   */
  deltaAngle?: number
  /**
   * @default 0.0001
   */
  learningRate?: number
  /**
   * @default 0
   */
  acceptedError?: number
}

/**
 * Changes joint angle to minimize distance of end effector to target
 * Mutates each link.angle
 */
export function solve(links: Link[], basePosition: V2, target: V2, options?: SolveOptions) {
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
      const angleStep = -gradient * adaptLearningRate(learningRate, projectedError)

      return { link, angleStep }
    })
    .forEach(({ link, angleStep }) => {
      link.rotation += angleStep
      if (link.constraint === undefined) return
      const halfContraint = link.constraint / 2
      link.rotation = clamp(link.rotation, -halfContraint, halfContraint)
    })
}

function adaptLearningRate(baseLearningRate: number, distance: number): number {
  return distance > 100 ? baseLearningRate : baseLearningRate * ((distance + 25) / 125)
}

export interface JointTransform {
  position: V2
  rotation: number
}

export function getErrorDistance(links: Link[], base: JointTransform, target: V2): number {
  const effectorPosition = getEndEffectorPosition(links, base)
  return V2O.euclideanDistance(target, effectorPosition)
}

export function getEndEffectorPosition(links: Link[], joint: JointTransform): V2 {
  return getJointTransforms(links, joint).effectorPosition
}

export function getJointTransforms(
  links: Link[],
  joint: JointTransform,
): {
  transforms: JointTransform[]
  effectorPosition: V2
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
