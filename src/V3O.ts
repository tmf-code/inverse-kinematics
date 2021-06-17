import * as MathUtils from './MathUtils'
import { V2 } from './V2'
import { V3 } from './V3'

type ThreeVector3 = {
  x: number
  y: number
  z: number
}

export const VECTOR_LENGTH = 3

export const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
export const sum = (vectors: V3[]): V3 => {
  const result = [0, 0, 0]

  for (let vectorIndex = 0; vectorIndex < vectors.length; vectorIndex++) {
    const vector = vectors[vectorIndex]!
    result[0] += vector[0]
    result[1] += vector[1]
    result[2] += vector[2]
  }

  return fromArray(result)
}

/**
 * @returns a - b
 */
export const subtract = (base: V3, subtraction: V3): V3 => [
  base[0] - subtraction[0],
  base[1] - subtraction[1],
  base[2] - subtraction[2],
]

/**
 * @returns element-wise multiplication of base and multiplier
 */
export const multiply = (base: V3, multiplier: V3): V3 => [
  base[0] * multiplier[0],
  base[1] * multiplier[1],
  base[2] * multiplier[2],
]

/**
 * @returns a / b
 */
export const divide = (base: V3, divisor: V3): V3 => [base[0] / divisor[0], base[1] / divisor[1], base[2] / divisor[2]]

export const scale = (base: V3, factor: number): V3 => [base[0] * factor, base[1] * factor, base[2] * factor]

export const sign = (vector: V3): V3 => [Math.sign(vector[0]), Math.sign(vector[1]), Math.sign(vector[2])]

export const normalise = (vector: V3): V3 => {
  const length = euclideanLength(vector)
  if (length === 0) {
    return zero()
  }
  return scale(vector, 1 / length)
}

export const extractXY = (vector: V3): V2 => [vector[0], vector[1]]
export const extractXZ = (vector: V3): V2 => [vector[0], vector[2]]
export const extractYZ = (vector: V3): V2 => [vector[1], vector[2]]

export const sqrEuclideanLength = (vector: V3): number => manhattanLength(multiply(vector, vector))

export const manhattanLength = (vector: V3): number => vector[0] + vector[1] + vector[2]

export const dotProduct = (a: V3, b: V3): number => {
  const product = multiply(a, b)
  return manhattanLength(product)
}

export const crossProduct = (a: V3, b: V3): V3 => {
  const [ax, ay, az] = a
  const [bx, by, bz] = b

  const x = ay * bz - az * by
  const y = az * bx - ax * bz
  const z = ax * by - ay * bx

  return [x, y, z]
}

export const euclideanLength = (vector: V3): number => sqrEuclideanLength(vector) ** 0.5

export const sqrEuclideanDistance = (a: V3, b: V3): number => {
  const distance = subtract(a, b)
  return sqrEuclideanLength(distance)
}

export const euclideanDistance = (a: V3, b: V3): number => {
  const distance = subtract(a, b)
  return euclideanLength(distance)
}

export const lerp = (from: V3, to: V3, amount: number): V3 => [
  MathUtils.lerp(from[0], to[0], amount),
  MathUtils.lerp(from[1], to[1], amount),
  MathUtils.lerp(from[2], to[2], amount),
]

export const lerpTheta = (from: V3, to: V3, amount: number): V3 => [
  MathUtils.lerpTheta(from[0], to[0], amount, Math.PI * 2),
  MathUtils.lerpTheta(from[1], to[1], amount, Math.PI * 2),
  MathUtils.lerpTheta(from[2], to[2], amount, Math.PI * 2),
]

export const up = (): V3 => [0, 1, 0]
export const down = (): V3 => [0, -1, 0]
export const right = (): V3 => [1, 0, 0]
export const left = (): V3 => [-1, 0, 0]
export const forwards = (): V3 => [0, 0, 1]
export const back = (): V3 => [0, 0, -1]
export const zero = (): V3 => [0, 0, 0]
export const copy = (vector: V3): V3 => [vector[0], vector[1], vector[2]]
export const flipX = (vector: V3): V3 => [-vector[0], vector[1], vector[2]]
export const flipY = (vector: V3): V3 => [vector[0], -vector[1], vector[2]]
export const flipZ = (vector: V3): V3 => [vector[0], vector[1], -vector[2]]
export const clamp = (vector: V3, min: V3, max: V3): V3 => [
  MathUtils.clamp(vector[0], min[0], max[0]),
  MathUtils.clamp(vector[1], min[1], max[1]),
  MathUtils.clamp(vector[2], min[2], max[2]),
]

export const random = (): V3 => [Math.random(), Math.random(), Math.random()]
export const randomRange = (min: number, max: number): V3 => add(scale(random(), max - min), [min, min, min])
export const fromArray = (array: number[]): V3 => {
  if (array.length !== VECTOR_LENGTH)
    throw new Error(`Cannot create V3 from ${array}, length is ${array.length}. Length should be ${VECTOR_LENGTH}`)
  return array as unknown as V3
}

export const fromThree = (vector: ThreeVector3): V3 => [vector.x, vector.y, vector.z]
