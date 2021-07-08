import * as V3O from './V3O'
import { Quaternion } from './Quaternion'
import { V3 } from './V3'
import * as MathUtils from './MathUtils'

export const multiply = (a: Quaternion, b: Quaternion): Quaternion => {
  const qax = a[0]
  const qay = a[1]
  const qaz = a[2]
  const qaw = a[3]
  const qbx = b[0]
  const qby = b[1]
  const qbz = b[2]
  const qbw = b[3]

  return [
    qax * qbw + qaw * qbx + qay * qbz - qaz * qby,
    qay * qbw + qaw * qby + qaz * qbx - qax * qbz,
    qaz * qbw + qaw * qbz + qax * qby - qay * qbx,
    qaw * qbw - qax * qbx - qay * qby - qaz * qbz,
  ]
}

export const fromEulerAngles = ([x, y, z]: V3): Quaternion => {
  const cos = Math.cos
  const sin = Math.sin

  const c1 = cos(x / 2)
  const c2 = cos(y / 2)
  const c3 = cos(z / 2)

  const s1 = sin(x / 2)
  const s2 = sin(y / 2)
  const s3 = sin(z / 2)

  return [
    s1 * c2 * c3 + c1 * s2 * s3,
    c1 * s2 * c3 - s1 * c2 * s3,
    c1 * c2 * s3 + s1 * s2 * c3,
    c1 * c2 * c3 - s1 * s2 * s3,
  ]
}

export const conjugate = (quaternion: Quaternion): Quaternion => {
  return [-quaternion[0], -quaternion[1], -quaternion[2], quaternion[3]]
}

export const inverse = (quaternion: Quaternion): Quaternion => {
  const conj = conjugate(quaternion)
  const mag = magnitude(quaternion)

  return [conj[0] / mag, conj[1] / mag, conj[2] / mag, conj[3] / mag]
}

export const magnitude = (quaternion: Quaternion): number => Math.hypot(...quaternion)

export const zeroRotation = (): Quaternion => [0, 0, 0, 1]

export const normalize = (quaternion: Quaternion): Quaternion => {
  const length = Math.hypot(...quaternion)
  if (length === 0) return zeroRotation()
  return [quaternion[0] / length, quaternion[1] / length, quaternion[2] / length, quaternion[3] / length]
}

export const clamp = (quaternion: Quaternion, lowerBound: V3, upperBound: V3): Quaternion => {
  const rotationAxis = [quaternion[0], quaternion[1], quaternion[2]]
  const w = quaternion[3]

  const [x, y, z] = V3O.fromArray(
    rotationAxis.map((component, index) => {
      const angle = 2 * Math.atan(component / w)

      const lower = lowerBound[index]!
      const upper = upperBound[index]!
      if (lower > upper)
        throw new Error(
          `Lower bound should be less than upper bound for component ${index}. Lower: ${lower}, upper: ${upper}`,
        )
      const clampedAngle = MathUtils.clamp(angle, lower, upper)
      return Math.tan(0.5 * clampedAngle)
    }),
  )
  return normalize([x, y, z, 1])
}

export const fromUnitDirectionVector = (vector: V3): Quaternion => {
  return rotationFromTo([1, 0, 0], vector)
}

export const rotationFromTo = (a: V3, b: V3): Quaternion => {
  const aNormalised = V3O.normalise(a)
  const bNormalised = V3O.normalise(b)
  const dot = V3O.dotProduct(aNormalised, bNormalised)

  const isParallel = dot >= 1
  if (isParallel) {
    // a, b are parallel
    return zeroRotation()
  }

  const isAntiParallel = dot < -1 + Number.EPSILON
  if (isAntiParallel) {
    let axis = V3O.crossProduct([1, 0, 0], aNormalised)
    const aPointsForward = V3O.sqrEuclideanLength(axis) === 0

    if (aPointsForward) {
      axis = V3O.crossProduct([0, 1, 0], aNormalised)
    }

    axis = V3O.normalise(axis)

    return fromAxisAngle(axis, Math.PI)
  }

  const q: Quaternion = [...V3O.crossProduct(aNormalised, bNormalised), 1 + dot]
  return normalize(q)
}

export const fromAxisAngle = (axis: V3, angle: number): Quaternion => {
  const halfAngle = angle / 2
  return [...V3O.scale(axis, Math.sin(halfAngle)), Math.cos(halfAngle)]
}

export const fromObject = (object: { w: number; x: number; y: number; z: number }): Quaternion => [
  object.x,
  object.y,
  object.z,
  object.w,
]
