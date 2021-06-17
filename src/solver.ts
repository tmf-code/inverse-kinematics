import { clamp } from './math'
import { V2, V2O } from './v2'

export interface Bone {
  /**
   * The joint that the bone rotates around
   */

  rotation: number
  readonly constraint?: number

  readonly length: number
}

export interface SolveOptions {
  deltaAngle?: number
  learningRate?: number
  acceptedError?: number
}

/**
 * Changes joint angle to minimize distance of end effector to target
 * Mutates each bone.joint.angle in bones
 */
export function solve(bones: Bone[], basePosition: V2, target: V2, options?: SolveOptions) {
  // Setup defaults
  const deltaAngle = options?.deltaAngle ?? 0.00001
  const learningRate = options?.learningRate ?? 0.0001

  const acceptedError = options?.acceptedError ?? 10

  // Precalculate joint positions
  const { transforms: joints, effectorPosition } = forwardPass(bones, {
    position: basePosition,
    rotation: 0,
  })

  const error = V2O.euclideanDistanceV2(target, effectorPosition)
  if (error < acceptedError) return

  if (joints.length !== bones.length + 1) {
    throw new Error(
      `Joint transforms should have the same length as bones + 1. Got ${joints.length}, expected ${bones.length}`,
    )
  }

  /**
   * 1. Find angle steps that minimize error
   * 2. Apply angle steps
   */
  bones
    .map((bone, index) => {
      const boneWithDeltaAngle = {
        length: bone.length,
        rotation: bone.rotation + deltaAngle,
      }

      // Get bone chain from this bones joint
      const projectedBones: Bone[] = [boneWithDeltaAngle, ...bones.slice(index + 1)]

      // Get gradient from small change in joint angle
      const joint = joints[index]!
      const { effectorPosition } = forwardPass(projectedBones, joint)
      const projectedError = V2O.euclideanDistanceV2(target, effectorPosition)
      const gradient = (projectedError - error) / deltaAngle

      // Get resultant angle step which minimizes error
      const angleStep = -gradient * adaptLearningRate(learningRate, projectedError)

      return { bone, angleStep }
    })
    .forEach(({ bone, angleStep }) => {
      bone.rotation += angleStep
      if (bone.constraint === undefined) return
      const halfContraint = bone.constraint / 2
      bone.rotation = clamp(bone.rotation, -halfContraint, halfContraint)
    })
}

function adaptLearningRate(baseLearningRate: number, distance: number): number {
  return distance > 100 ? baseLearningRate : baseLearningRate * ((distance + 25) / 125)
}

export interface Transform {
  position: V2
  rotation: number
}

interface ForwardPass {
  transforms: Transform[]
  effectorPosition: V2
}

export function forwardPass(bones: Bone[], joint: Transform): ForwardPass {
  const transforms = [joint]

  for (let index = 0; index < bones.length; index++) {
    const currentBone = bones[index]!
    const parentTransform = transforms[index]!

    const absoluteRotation = currentBone.rotation + parentTransform.rotation
    const relativePosition = V2O.fromPolar(currentBone.length, absoluteRotation)
    const absolutePosition = V2O.add(relativePosition, parentTransform.position)
    transforms.push({ position: absolutePosition, rotation: absoluteRotation })
  }

  const effectorPosition = transforms[transforms.length - 1]!.position

  return { transforms, effectorPosition }
}
