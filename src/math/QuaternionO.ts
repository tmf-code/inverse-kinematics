import { Quaternion } from './Quaternion'
import { V3 } from './V3'

export const multiply = (a: Quaternion, b: Quaternion): Quaternion => {
  const r = a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3]
  const x = a[0] * b[1] + a[1] * b[0] + a[2] * b[3] - a[3] * b[2]
  const y = a[0] * b[2] - a[1] * b[3] + a[2] * b[0] + a[3] * b[1]
  const z = a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0]

  return [r, x, y, z]
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
    c1 * c2 * c3 - s1 * s2 * s3,
    s1 * c2 * c3 + c1 * s2 * s3,
    c1 * s2 * c3 - s1 * c2 * s3,
    c1 * c2 * s3 + s1 * s2 * c3,
  ]
}

export const conjugate = (quaternion: Quaternion): Quaternion => {
  return [quaternion[0], -quaternion[1], -quaternion[2], -quaternion[3]]
}

export const zeroRotation = (): Quaternion => [1, 0, 0, 0]
