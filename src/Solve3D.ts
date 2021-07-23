import { QuaternionO, SolveOptions, V3O } from '.'
import { Quaternion } from './math/Quaternion'
import { V3 } from './math/V3'
import { Range } from './Range'
import { defaultCCDOptions, defaultFABRIKOptions, SolveCCDOptions, SolveFABRIKOptions } from './SolveOptions'

export interface Link {
  /**
   * The rotation at the base of the link
   */
  rotation: Quaternion

  /**
   * undefined: No constraint
   *
   * {pitch, yaw, roll}: Range | Number
   *
   * Range: minimum angle, maximum angle (radians), positive is anticlockwise from previous Link's direction vector
   *
   * number: the range of rotation (radian) about the previous links direction vector. A rotation of 90 deg would be 45 deg either direction
   *
   * ExactRotation: Either a global, or local rotation which the Link is locked to
   */
  constraints?: Constraints
  position: V3
}

type Constraints = EulerConstraint | ExactRotation

interface EulerConstraint {
  /**
   * Rotation about X
   */
  pitch?: number | Range
  /**
   * Rotation about Y
   */
  yaw?: number | Range
  /**
   * Rotation about Z
   */
  roll?: number | Range
}

interface ExactRotation {
  value: Quaternion
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
  target: V3,
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
  target: V3,
  { deltaAngle, learningRate, acceptedError }: Required<SolveFABRIKOptions>,
): SolveResult {
  const { transforms: joints, effectorPosition } = getJointTransforms(links, baseJoint)
  const error = V3O.euclideanDistance(target, effectorPosition)

  if (error < acceptedError)
    return { links: links.map(copyLink), isWithinAcceptedError: true, getErrorDistance: () => error }

  if (joints.length !== links.length + 1) {
    throw new Error(
      `Joint transforms should have the same length as links + 1. Got ${joints.length}, expected ${links.length}`,
    )
  }

  const withAngleStep: Link[] = links.map(
    ({ position, rotation = QuaternionO.zeroRotation(), constraints }, linkIndex) => {
      // For each, calculate partial derivative, sum to give full numerical derivative
      const angleStep: V3 = V3O.fromArray(
        [0, 0, 0].map((_, v3Index) => {
          const eulerAngle = [0, 0, 0]
          eulerAngle[v3Index] = deltaAngle
          const linkWithAngleDelta = {
            position,
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

      const steppedRotation = QuaternionO.multiply(rotation, QuaternionO.fromEulerAngles(angleStep))

      return { position, rotation: steppedRotation, constraints }
    },
  )

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
  target: V3,
  { learningRate, acceptedError }: Required<SolveCCDOptions>,
): SolveResult {
  // 1. From base to tip, point projection from joint to effector at target
  let withAngleStep: Link[] = [...links.map(copyLink)]

  for (let index = withAngleStep.length - 1; index >= 0; index--) {
    const joints = getJointTransforms(withAngleStep, baseJoint)
    const effectorPosition = joints.effectorPosition
    const error = V3O.euclideanDistance(target, effectorPosition)

    if (error < acceptedError) break

    const link = withAngleStep[index]!
    const { rotation, position, constraints } = link
    const joint = joints.transforms[index]!

    /**
     * Following http://rodolphe-vaillant.fr/?e=114
     *
     * We found that if we didn't convert the world coordinate system here to local
     * that it would give very unstable solutions. It seems that others have struggled
     * with the same thing.
     *
     * https://github.com/zalo/zalo.github.io/blob/fb1b899ce9825b1123b0ebd2bfdce2459566e6db/assets/js/IK/IKExample.js#L67
     */
    const inverseRotation = QuaternionO.inverse(joint.rotation)
    const rotatedTarget = V3O.rotate(target, inverseRotation)
    const rotatedEffector = V3O.rotate(effectorPosition, inverseRotation)
    const rotatedJoint = V3O.rotate(joint.position, inverseRotation)
    const directionToTarget = V3O.subtract(rotatedTarget, rotatedJoint)
    const directionToEffector = V3O.subtract(rotatedEffector, rotatedJoint)

    const angleBetween = QuaternionO.rotationFromTo(directionToEffector, directionToTarget)

    const angleStep: Quaternion = QuaternionO.slerp(
      QuaternionO.zeroRotation(),
      angleBetween,
      typeof learningRate === 'function' ? learningRate(error) : learningRate,
    )

    withAngleStep[index] = { rotation: QuaternionO.multiply(rotation, angleStep), position, constraints }
  }

  const adjustedJoints = getJointTransforms(withAngleStep, baseJoint).transforms
  const withConstraints = applyConstraints(withAngleStep, adjustedJoints)

  return {
    links: withConstraints,
    getErrorDistance: () => getErrorDistance(withConstraints, baseJoint, target),
    isWithinAcceptedError: undefined,
  }
}

export interface JointTransform {
  position: V3
  rotation: Quaternion
}

function applyConstraints(withAngleStep: Link[], adjustedJoints: JointTransform[]) {
  return withAngleStep.map(({ position, rotation, constraints }, index) => {
    if (constraints === undefined) return { position: position, rotation }

    if (isExactRotation(constraints)) {
      if (constraints.type === 'global') {
        const targetRotation = constraints.value
        const currentRotation = adjustedJoints[index + 1]!.rotation
        const adjustedRotation = QuaternionO.multiply(
          QuaternionO.multiply(rotation, QuaternionO.inverse(currentRotation)),
          targetRotation,
        )

        return { position, rotation: adjustedRotation, constraints }
      } else {
        return { position, rotation: constraints.value, constraints }
      }
    }

    const { pitch, yaw, roll } = constraints

    let pitchMin: number
    let pitchMax: number
    if (typeof pitch === 'number') {
      pitchMin = -pitch / 2
      pitchMax = pitch / 2
    } else if (pitch === undefined) {
      pitchMin = -Infinity
      pitchMax = Infinity
    } else {
      pitchMin = pitch.min
      pitchMax = pitch.max
    }

    let yawMin: number
    let yawMax: number
    if (typeof yaw === 'number') {
      yawMin = -yaw / 2
      yawMax = yaw / 2
    } else if (yaw === undefined) {
      yawMin = -Infinity
      yawMax = Infinity
    } else {
      yawMin = yaw.min
      yawMax = yaw.max
    }

    let rollMin: number
    let rollMax: number
    if (typeof roll === 'number') {
      rollMin = -roll / 2
      rollMax = roll / 2
    } else if (roll === undefined) {
      rollMin = -Infinity
      rollMax = Infinity
    } else {
      rollMin = roll.min
      rollMax = roll.max
    }

    const lowerBound: V3 = [pitchMin, yawMin, rollMin]
    const upperBound: V3 = [pitchMax, yawMax, rollMax]
    const clampedRotation = QuaternionO.clamp(rotation, lowerBound, upperBound)
    return { position: position, rotation: clampedRotation, constraints: copyConstraints(constraints) }
  })
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
  const transforms = [{ ...joint }]

  for (let index = 0; index < links.length; index++) {
    const currentLink = links[index]!
    const parentTransform = transforms[index]!

    const absoluteRotation = QuaternionO.multiply(
      parentTransform.rotation,
      currentLink.rotation ?? QuaternionO.zeroRotation(),
    )
    const relativePosition = V3O.rotate(currentLink.position, absoluteRotation)
    const absolutePosition = V3O.add(relativePosition, parentTransform.position)
    transforms.push({ position: absolutePosition, rotation: absoluteRotation })
  }

  const effectorPosition = transforms[transforms.length - 1]!.position

  return { transforms, effectorPosition }
}

export function buildLink(position: V3, rotation = QuaternionO.zeroRotation(), constraints?: Constraints): Link {
  return {
    position,
    rotation,
    constraints,
  }
}

function copyLink({ rotation, position, constraints }: Link): Link {
  return {
    rotation,
    position: [...position],
    constraints: constraints === undefined ? undefined : copyConstraints(constraints),
  }
}

function copyConstraints(constraints: Constraints): Constraints {
  const result: Constraints = {}

  if (isExactRotation(constraints)) {
    return { type: constraints.type, value: [...constraints.value] }
  }
  const { pitch, yaw, roll } = constraints

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

function isExactRotation(rotation: EulerConstraint | ExactRotation): rotation is ExactRotation {
  return (rotation as ExactRotation).value !== undefined
}
