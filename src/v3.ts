import { clamp, lerp, lerpTheta } from './math'
import { V2 } from './v2'

export type V3 = readonly [x: number, y: number, z: number]

type ThreeVector3 = {
  x: number
  y: number
  z: number
}

export class V3O {
  static VECTOR_LENGTH = 3

  static add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
  static sum = (vectors: V3[]): V3 => {
    const result = [0, 0, 0]

    for (let vectorIndex = 0; vectorIndex < vectors.length; vectorIndex++) {
      const vector = vectors[vectorIndex]!
      result[0] += vector[0]
      result[1] += vector[1]
      result[2] += vector[2]
    }

    return V3O.fromArray(result)
  }

  /**
   * @returns a - b
   */
  static subtract = (base: V3, subtraction: V3): V3 => [
    base[0] - subtraction[0],
    base[1] - subtraction[1],
    base[2] - subtraction[2],
  ]

  /**
   * @returns element-wise multiplication of base and multiplier
   */
  static multiply = (base: V3, multiplier: V3): V3 => [
    base[0] * multiplier[0],
    base[1] * multiplier[1],
    base[2] * multiplier[2],
  ]

  /**
   * @returns a / b
   */
  static divide = (base: V3, divisor: V3): V3 => [base[0] / divisor[0], base[1] / divisor[1], base[2] / divisor[2]]

  static scale = (base: V3, factor: number): V3 => [base[0] * factor, base[1] * factor, base[2] * factor]

  static sign = (vector: V3): V3 => [Math.sign(vector[0]), Math.sign(vector[1]), Math.sign(vector[2])]

  static normalise = (vector: V3): V3 => {
    const length = V3O.euclideanLength(vector)
    if (length === 0) {
      return V3O.zero()
    }
    return V3O.scale(vector, 1 / length)
  }

  static extractXY = (vector: V3): V2 => [vector[0], vector[1]]
  static extractXZ = (vector: V3): V2 => [vector[0], vector[2]]
  static extractYZ = (vector: V3): V2 => [vector[1], vector[2]]

  static sqrEuclideanLength = (vector: V3): number => V3O.manhattanLength(V3O.multiply(vector, vector))

  static manhattanLength = (vector: V3): number => vector[0] + vector[1] + vector[2]

  static dotProduct(a: V3, b: V3): number {
    const product = V3O.multiply(a, b)
    return V3O.manhattanLength(product)
  }

  static crossProduct = (a: V3, b: V3): V3 => {
    const [ax, ay, az] = a
    const [bx, by, bz] = b

    const x = ay * bz - az * by
    const y = az * bx - ax * bz
    const z = ax * by - ay * bx

    return [x, y, z]
  }

  static euclideanLength = (vector: V3): number => V3O.sqrEuclideanLength(vector) ** 0.5

  static sqrEuclideanDistance = (a: V3, b: V3): number => {
    const distance = V3O.subtract(a, b)
    return V3O.sqrEuclideanLength(distance)
  }

  static euclideanDistance = (a: V3, b: V3): number => {
    const distance = V3O.subtract(a, b)
    return V3O.euclideanLength(distance)
  }

  static lerp = (from: V3, to: V3, amount: number): V3 => [
    lerp(from[0], to[0], amount),
    lerp(from[1], to[1], amount),
    lerp(from[2], to[2], amount),
  ]

  static lerpTheta = (from: V3, to: V3, amount: number): V3 => [
    lerpTheta(from[0], to[0], amount, Math.PI * 2),
    lerpTheta(from[1], to[1], amount, Math.PI * 2),
    lerpTheta(from[2], to[2], amount, Math.PI * 2),
  ]

  static up = (): V3 => [0, 1, 0]
  static down = (): V3 => [0, -1, 0]
  static right = (): V3 => [1, 0, 0]
  static left = (): V3 => [-1, 0, 0]
  static forwards = (): V3 => [0, 0, 1]
  static back = (): V3 => [0, 0, -1]
  static zero = (): V3 => [0, 0, 0]
  static copy = (vector: V3): V3 => [vector[0], vector[1], vector[2]]
  static flipX = (vector: V3): V3 => [-vector[0], vector[1], vector[2]]
  static flipY = (vector: V3): V3 => [vector[0], -vector[1], vector[2]]
  static flipZ = (vector: V3): V3 => [vector[0], vector[1], -vector[2]]
  static clamp = (vector: V3, min: V3, max: V3): V3 => [
    clamp(vector[0], min[0], max[0]),
    clamp(vector[1], min[1], max[1]),
    clamp(vector[2], min[2], max[2]),
  ]

  static random = (): V3 => [Math.random(), Math.random(), Math.random()]
  static randomRange = (min: number, max: number): V3 => V3O.add(V3O.scale(V3O.random(), max - min), [min, min, min])
  static fromArray = (array: number[]): V3 => {
    if (array.length !== V3O.VECTOR_LENGTH)
      throw new Error(
        `Cannot create V3 from ${array}, length is ${array.length}. Length should be ${V3O.VECTOR_LENGTH}`,
      )
    return array as unknown as V3
  }

  static fromThree = (vector: ThreeVector3): V3 => [vector.x, vector.y, vector.z]
}
