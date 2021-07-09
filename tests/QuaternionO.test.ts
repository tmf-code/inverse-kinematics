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

  it('Ignores clamping inside range -Infinity - +Infinity', () => {
    const input: Quaternion = [-oneOnRootTwo, 0, 0, oneOnRootTwo]
    const lowerBound: V3 = [-Infinity, 0, 0]
    const upperBound: V3 = [Infinity, 0, 0]

    expect(QuaternionO.clamp(input, lowerBound, upperBound)).toBeCloseToQuaternion(input)
  })

  it('Throws if clamp lower bound > upper bound', () => {
    const input: Quaternion = [0, 0, 0, 1]
    const lowerBound: V3 = [Math.PI / 2, 0, 0]
    const upperBound: V3 = [0, 0, 0]

    expect(() => QuaternionO.clamp(input, lowerBound, upperBound)).toThrow()
  })

  it('Calculates magnitude', () => {
    {
      const input: Quaternion = [0, 0, 0, 1]
      const magnitude = QuaternionO.magnitude(input)

      expect(magnitude).toBe(1)
    }

    {
      const input: Quaternion = [0, 0, 0, 0]
      const magnitude = QuaternionO.magnitude(input)

      expect(magnitude).toBe(0)
    }
  })

  it('Calculates inverse', () => {
    const input: Quaternion = QuaternionO.fromEulerAngles([Math.PI, 0, 0])
    const expected: Quaternion = QuaternionO.fromEulerAngles([-Math.PI, 0, 0])

    expect(QuaternionO.inverse(input)).toBeCloseToQuaternion(expected)
  })

  it('Creates from unit direction vectors', () => {
    {
      const input: V3 = [0, 1, 0]
      const expected: Quaternion = [0, 0, oneOnRootTwo, oneOnRootTwo]

      expect(QuaternionO.fromUnitDirectionVector(input)).toBeCloseToQuaternion(expected)
    }
    {
      const input: V3 = [0, -1, 0]
      const expected: Quaternion = [0, 0, -oneOnRootTwo, oneOnRootTwo]

      expect(QuaternionO.fromUnitDirectionVector(input)).toBeCloseToQuaternion(expected)
    }
    {
      const input: V3 = [1, 0, 0]
      const expected: Quaternion = [0, 0, 0, 1]

      expect(QuaternionO.fromUnitDirectionVector(input)).toBeCloseToQuaternion(expected)
    }
  })

  it('Creates from axis angle', () => {
    const axis: V3 = [0, 1, 0]
    const angle = Math.PI / 2

    const expected: Quaternion = [0, oneOnRootTwo, 0, oneOnRootTwo]

    expect(QuaternionO.fromAxisAngle(axis, angle)).toBeCloseToQuaternion(expected)
  })

  it('Creates from rotation from two vectors', () => {
    {
      const a: V3 = [0, 0, -1]
      const b: V3 = [-1, 0, 0]

      const expected: Quaternion = [0, oneOnRootTwo, 0, oneOnRootTwo]

      expect(QuaternionO.rotationFromTo(a, b)).toBeCloseToQuaternion(expected)
    }
    {
      const a: V3 = [1, 0, 0]
      const b: V3 = [0, 4, 0]

      const expected: Quaternion = [0, 0, oneOnRootTwo, oneOnRootTwo]

      expect(QuaternionO.rotationFromTo(a, b)).toBeCloseToQuaternion(expected)
    }
  })
})
