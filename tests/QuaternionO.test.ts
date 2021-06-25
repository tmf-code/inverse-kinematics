import { QuaternionO, Quaternion, V3 } from '../src'

const identity = QuaternionO.zeroRotation()
const oneOnRootTwo = 1 / Math.pow(2, 0.5)

describe('Quaternion Operations', () => {
  it('Multiplies two identity quaternions correctly', () => {
    const a: Quaternion = identity
    const b: Quaternion = identity

    expect(QuaternionO.multiply(a, b)).toEqual(identity)
  })

  it('Multiplies with identity and has no effect', () => {
    const a: Quaternion = identity
    const b: Quaternion = [0, oneOnRootTwo, 0, oneOnRootTwo]

    expect(QuaternionO.multiply(a, b)).toEqual(b)
  })

  it('Rotates by 90 degree rotations twice to form a 180 degree rotation', () => {
    const a: Quaternion = [oneOnRootTwo, 0, 0, oneOnRootTwo]
    const b: Quaternion = [oneOnRootTwo, 0, 0, oneOnRootTwo]

    expect(QuaternionO.multiply(a, b)).toBeCloseToQuaternion([1, 0, 0, 0])
  })

  it('Rotates by 90 degree rotations twice to form a 180 degree rotation, in each axis', () => {
    for (let axis = 0; axis < 3; axis++) {
      const test: Quaternion = [
        ...Array.from({ length: 3 }).map((_, index) => (index === axis ? oneOnRootTwo : 0)),
        oneOnRootTwo,
      ] as unknown as Quaternion

      const expected = [
        ...Array.from({ length: 3 }).map((_, index) => (index === axis ? 1 : 0)),
        0,
      ] as unknown as Quaternion

      expect(QuaternionO.multiply(test, test)).toBeCloseToQuaternion(expected)
    }
  })

  it('Can create from Euler Angles', () => {
    const angles: V3 = [Math.PI / 2, Math.PI / 4, Math.PI / 6]
    const expected: Quaternion = [0.701, 0.092, 0.43, 0.56]

    expect(QuaternionO.fromEulerAngles(angles)).toBeCloseToQuaternion(expected)
  })

  it('Creates conjugate', () => {
    const input: Quaternion = [0, oneOnRootTwo, 0, oneOnRootTwo]
    const expected: Quaternion = [-0, -oneOnRootTwo, -0, oneOnRootTwo]

    expect(QuaternionO.conjugate(input)).toBeCloseToQuaternion(expected)
  })

  it('Can clamp to zero', () => {
    const input: Quaternion = [oneOnRootTwo, 0, 0, oneOnRootTwo]
    const lowerBound: V3 = [0, 0, 0]
    const upperBound: V3 = [0, 0, 0]

    const expected: Quaternion = [0, 0, 0, 1]

    expect(QuaternionO.clamp(input, lowerBound, upperBound)).toBeCloseToQuaternion(expected)
  })

  it('Can clamp to upperBound', () => {
    const input: Quaternion = [oneOnRootTwo, 0, 0, oneOnRootTwo]
    const lowerBound: V3 = [0, 0, 0]
    const upperBound: V3 = [Math.PI / 4, 0, 0]

    const expected: Quaternion = [0.3826834, 0, 0, 0.9238795]

    expect(QuaternionO.clamp(input, lowerBound, upperBound)).toBeCloseToQuaternion(expected)
  })

  it('Can clamp to lowerBound', () => {
    const input: Quaternion = [-oneOnRootTwo, 0, 0, oneOnRootTwo]
    const lowerBound: V3 = [-Math.PI / 4, 0, 0]
    const upperBound: V3 = [0, 0, 0]

    const expected: Quaternion = [-0.3826834, 0, 0, 0.9238795]

    expect(QuaternionO.clamp(input, lowerBound, upperBound)).toBeCloseToQuaternion(expected)
  })
})

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeCloseToQuaternion<Quaternion>(expected: Quaternion): R
    }
  }
}

expect.extend({
  toBeCloseToQuaternion(received: Quaternion, expected: Quaternion, precision = 2) {
    let pass = true
    received.forEach((_, index) => {
      const receivedComponent = received[index]!
      const expectedComponent = expected[index]!
      let expectedDiff = 0
      let receivedDiff = 0

      if (pass === false) return

      if (receivedComponent === Infinity && expectedComponent === Infinity) {
        return
      } else if (receivedComponent === -Infinity && expectedComponent === -Infinity) {
        return
      } else {
        expectedDiff = Math.pow(10, -precision) / 2
        receivedDiff = Math.abs(expectedComponent - receivedComponent)
        pass = receivedDiff < expectedDiff
      }
    })

    if (pass) {
      return {
        message: () => `expected ${received} not to be close to ${expected}`,
        pass: true,
      }
    } else {
      return {
        message: () => `expected ${received} to be close to ${expected}`,
        pass: false,
      }
    }
  },
})
