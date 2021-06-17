import { clamp } from './math'
import { V2, V2O } from './v2'

export interface IBone {
  /**
   * The joint that the bone rotates around
   */
  readonly joint: IJoint
  readonly length: number
}

interface IJoint {
  angle: number
  readonly constraint?: number
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
export function solve(bones: IBone[], basePosition: V2, target: V2, options?: SolveOptions) {
  // Setup defaults
  const deltaAngle = options?.deltaAngle ?? 0.00001
  const learningRate = options?.learningRate ?? 0.0001

  const acceptedError = options?.acceptedError ?? 10

  // Precalculate pivot positions
  const { transforms: pivotTransforms, effectorPosition } = forwardPass(bones, {
    position: basePosition,
    rotation: 0,
  })

  const error = V2O.euclideanDistanceV2(target, effectorPosition)
  if (error < acceptedError) return

  if (pivotTransforms.length !== bones.length + 1) {
    throw new Error(
      `Pivot transforms should have the same length as bones + 1. Got ${pivotTransforms.length}, expected ${bones.length}`,
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
        joint: {
          angle: bone.joint.angle + deltaAngle,
        },
      }

      // Get bone chain from this bones pivot
      const projectedBones: IBone[] = [boneWithDeltaAngle, ...bones.slice(index + 1)]

      // Get gradient from small change in pivot angle
      const pivotTransform = pivotTransforms[index]!
      const { effectorPosition } = forwardPass(projectedBones, pivotTransform)
      const projectedError = V2O.euclideanDistanceV2(target, effectorPosition)
      const gradient = (projectedError - error) / deltaAngle

      // Get resultant angle step which minimizes error
      const angleStep = -gradient * adaptLearningRate(learningRate, projectedError)

      return { joint: bone.joint, angleStep }
    })
    .forEach(({ joint, angleStep }) => {
      joint.angle += angleStep
      if (joint.constraint === undefined) return
      const halfContraint = joint.constraint / 2
      joint.angle = clamp(joint.angle, -halfContraint, halfContraint)
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

export function forwardPass(bones: IBone[], pivotTransform: Transform): ForwardPass {
  const transforms = [pivotTransform]

  for (let index = 0; index < bones.length; index++) {
    const currentBone = bones[index]!
    const parentTransform = transforms[index]!

    const absoluteRotation = currentBone.joint.angle + parentTransform.rotation
    const relativePosition = V2O.fromPolar(currentBone.length, absoluteRotation)
    const absolutePosition = V2O.add(relativePosition, parentTransform.position)
    transforms.push({ position: absolutePosition, rotation: absoluteRotation })
  }

  const effectorPosition = transforms[transforms.length - 1]!.position

  return { transforms, effectorPosition }
}
