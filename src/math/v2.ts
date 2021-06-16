import { lerp, clamp } from "./math"

export type V2 = readonly [x: number, y: number]

export class V2O {
  static angle([x, y]: V2): number {
    return Math.atan2(y, x)
  }
  static VECTOR_LENGTH = 2
  static combine = (
    a: V2,
    b: V2,
    operation: (aElement: number, bElement: number) => number
  ): V2 => {
    const result = new Array(V2O.VECTOR_LENGTH)

    for (let index = 0; index < V2O.VECTOR_LENGTH; index++) {
      const aElement = a[index]
      const bElement = b[index]

      result[index] = operation(aElement!, bElement!)
    }

    return V2O.fromArray(result)
  }

  static add = (a: V2, b: V2): V2 => V2O.combine(a, b, (a, b) => a + b)

  static map = <T>(
    vector: V2,
    callback: (element: number, elementIndex: number, vector: V2) => T
  ): [T, T] => {
    return vector.map((value, index, array) =>
      callback(value, index, array as V2)
    ) as [T, T]
  }

  static maxAbs = (vector: V2, max: number): V2 => {
    const isClipped = max * max < V2O.sqrEuclideanLength(vector)
    if (!isClipped) return [...vector]

    const normalised = V2O.normalise(vector)
    const maxVector = V2O.scale(normalised, max)
    return maxVector
  }

  static maxElement = (a: V2): number => {
    return Math.max(...a)
  }

  static abs = (a: V2): V2 => {
    return [Math.abs(a[0]), Math.abs(a[1])]
  }

  static subtract = (base: V2, subtraction: V2): V2 =>
    V2O.combine(base, subtraction, (a, b) => a - b)

  static multiply = (base: V2, multiplier: V2): V2 =>
    V2O.combine(base, multiplier, (a, b) => a * b)

  static dot = (a: V2, b: V2): number => a[0] * b[0] + a[1] * b[1]

  static lerp = (from: V2, to: V2, amount: number): V2 =>
    V2O.combine(from, to, (fromElement, toElement) =>
      lerp(fromElement, toElement, amount)
    )

  static clamp = (value: V2, min: V2, max: V2): V2 => [
    clamp(value[0], min[0], max[0]),
    clamp(value[1], min[1], max[1]),
  ]

  static tangent = (vector: V2): V2 => [-vector[1], vector[0]]

  static scale = (base: V2, factor: number): V2 =>
    V2O.fromArray(base.map((element) => element * factor))

  static divideScalar = (base: V2, divisor: number): V2 =>
    V2O.fromArray(base.map((element) => element / divisor))

  static divide = (base: V2, divisor: V2): V2 =>
    V2O.combine(base, divisor, (a, b) => a / b)

  static normalise = (vector: V2): V2 => {
    const length = V2O.euclideanLength(vector)
    if (length === 0) {
      return V2O.zero()
    }
    return V2O.scale(vector, 1 / length)
  }

  static sqrEuclideanLength = (vector: V2): number =>
    vector[0] ** 2 + vector[1] ** 2

  static euclideanLength = (vector: V2): number =>
    V2O.sqrEuclideanLength(vector) ** 0.5

  static sqrEuclideanDistance = (a: V2, b: V2): number => {
    const distance = V2O.subtract(a, b)
    return V2O.sqrEuclideanLength(distance)
  }

  static euclideanDistanceV2 = (a: V2, b: V2): number => {
    const distance = V2O.subtract(a, b)
    return V2O.euclideanLength(distance)
  }

  static rotate = ([x, y]: V2, angleRadians: number): V2 => {
    const cos = Math.cos(angleRadians)
    const sin = Math.sin(angleRadians)

    return [x * cos - y * sin, x * sin + y * cos]
  }

  static zero = (): V2 => [0, 0]
  static flipX = (vector: V2): V2 => [-vector[0], vector[1]]
  static flipY = (vector: V2): V2 => [vector[0], -vector[1]]
  static flipAxes = (vector: V2): V2 => [-vector[0], -vector[1]]

  static pickX = (vector: V2): V2 => [vector[0], 0]
  static pickY = (vector: V2): V2 => [0, vector[1]]

  static fromArray = (array: number[]): V2 => {
    if (array.length !== V2O.VECTOR_LENGTH)
      throw new Error(
        `Cannot create V2 from ${array}, length is ${array.length}. Length should be ${V2O.VECTOR_LENGTH}`
      )
    return (array as unknown) as V2
  }

  static valueEquality = (a: V2, b: V2): boolean => {
    return a[0] === b[0] && a[1] === b[1]
  }

  static fromVector2 = ({ x, y }: { x: number; y: number }): V2 => [x, y]

  static average = (...vectors: [V2, ...V2[]]): V2 => {
    let sum: V2 = [0, 0]
    vectors.forEach((vector) => {
      sum = V2O.add(sum, vector)
    })

    return V2O.divideScalar(sum, vectors.length)
  }

  static fromPolar = (radius: number, angle: number) => {
    return V2O.rotate([radius, 0], angle)
  }
}
