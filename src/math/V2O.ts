import * as MathUtils from './MathUtils'
import { V2 } from './V2'

export const angle = ([x, y]: V2): number => {
  return Math.atan2(y, x)
}

const VECTOR_LENGTH = 2
export const combine = (a: V2, b: V2, operation: (aElement: number, bElement: number) => number): V2 => {
  const result = new Array(VECTOR_LENGTH)

  for (let index = 0; index < VECTOR_LENGTH; index++) {
    const aElement = a[index]
    const bElement = b[index]

    result[index] = operation(aElement!, bElement!)
  }

  return fromArray(result)
}

export const add = (a: V2, b: V2): V2 => combine(a, b, (a, b) => a + b)

export const map = <T>(vector: V2, callback: (element: number, elementIndex: number, vector: V2) => T): [T, T] => {
  return vector.map((value, index, array) => callback(value, index, array as V2)) as [T, T]
}

export const maxAbs = (vector: V2, max: number): V2 => {
  const isClipped = max * max < sqrEuclideanLength(vector)
  if (!isClipped) return [...vector]

  const normalised = normalise(vector)
  const maxVector = scale(normalised, max)
  return maxVector
}

export const maxElement = (a: V2): number => {
  return Math.max(...a)
}

export const abs = (a: V2): V2 => {
  return [Math.abs(a[0]), Math.abs(a[1])]
}

export const subtract = (base: V2, subtraction: V2): V2 => combine(base, subtraction, (a, b) => a - b)

export const multiply = (base: V2, multiplier: V2): V2 => combine(base, multiplier, (a, b) => a * b)

export const dot = (a: V2, b: V2): number => a[0] * b[0] + a[1] * b[1]

export const lerp = (from: V2, to: V2, amount: number): V2 =>
  combine(from, to, (fromElement, toElement) => MathUtils.lerp(fromElement, toElement, amount))

export const clamp = (value: V2, min: V2, max: V2): V2 => [
  MathUtils.clamp(value[0], min[0], max[0]),
  MathUtils.clamp(value[1], min[1], max[1]),
]

export const tangent = (vector: V2): V2 => [-vector[1], vector[0]]

export const scale = (base: V2, factor: number): V2 => fromArray(base.map((element) => element * factor))

export const divideScalar = (base: V2, divisor: number): V2 => fromArray(base.map((element) => element / divisor))

export const divide = (base: V2, divisor: V2): V2 => combine(base, divisor, (a, b) => a / b)

export const normalise = (vector: V2): V2 => {
  const length = euclideanLength(vector)
  if (length === 0) {
    return zero()
  }
  return scale(vector, 1 / length)
}

export const sqrEuclideanLength = (vector: V2): number => vector[0] ** 2 + vector[1] ** 2

export const euclideanLength = (vector: V2): number => sqrEuclideanLength(vector) ** 0.5

export const sqrEuclideanDistance = (a: V2, b: V2): number => {
  const distance = subtract(a, b)
  return sqrEuclideanLength(distance)
}

export const euclideanDistance = (a: V2, b: V2): number => {
  const distance = subtract(a, b)
  return euclideanLength(distance)
}

export const rotate = ([x, y]: V2, angleRadians: number): V2 => {
  const cos = Math.cos(angleRadians)
  const sin = Math.sin(angleRadians)

  return [x * cos - y * sin, x * sin + y * cos]
}

export const zero = (): V2 => [0, 0]
export const flipX = (vector: V2): V2 => [-vector[0], vector[1]]
export const flipY = (vector: V2): V2 => [vector[0], -vector[1]]
export const flipAxes = (vector: V2): V2 => [-vector[0], -vector[1]]

export const pickX = (vector: V2): V2 => [vector[0], 0]
export const pickY = (vector: V2): V2 => [0, vector[1]]

export const fromArray = (array: number[]): V2 => {
  if (array.length !== VECTOR_LENGTH)
    throw new Error(`Cannot create V2 from ${array}, length is ${array.length}. Length should be ${VECTOR_LENGTH}`)
  return array as unknown as V2
}

export const valueEquality = (a: V2, b: V2): boolean => {
  return a[0] === b[0] && a[1] === b[1]
}

export const fromVector2 = ({ x, y }: { x: number; y: number }): V2 => [x, y]

export const average = (...vectors: [V2, ...V2[]]): V2 => {
  let sum: V2 = [0, 0]
  vectors.forEach((vector) => {
    sum = add(sum, vector)
  })

  return divideScalar(sum, vectors.length)
}

export const fromPolar = (radius: number, angle: number) => {
  return rotate([radius, 0], angle)
}
