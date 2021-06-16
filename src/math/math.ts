export function lerp(from: number, to: number, amount: number): number {
  amount = amount < 0 ? 0 : amount
  amount = amount > 1 ? 1 : amount
  return from + (to - from) * amount
}

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(min, value), max)

export function lerpTheta(
  from: number,
  to: number,
  amount: number,
  circleAt: number = Math.PI * 2
) {
  const removeLoops = (distance: number) =>
    clamp(distance - Math.floor(distance / circleAt) * circleAt, 0, circleAt)

  const distance = to - from
  const unloopedDistance = removeLoops(distance)
  const isLeft = unloopedDistance > Math.PI
  const offset = isLeft ? unloopedDistance - Math.PI * 2 : unloopedDistance
  return lerp(from, from + offset, amount)
}

export const valuesAreWithinDistance = (
  valueA: number,
  valueB: number,
  delta: number
) => {
  const highest = Math.max(valueA, valueB)
  const lowest = Math.min(valueA, valueB)

  return highest - delta < lowest
}

export const rotationsAreWithinAngle = (
  rotationA: number,
  rotationB: number,
  angle: number
) => {
  const normalisedA = rotationA % (Math.PI * 2)
  const normalisedB = rotationB % (Math.PI * 2)

  return valuesAreWithinDistance(normalisedA, normalisedB, angle)
}
