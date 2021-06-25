import { Quaternion, V3, V3O } from '../src'

const oneOnRootTwo = 1 / Math.pow(2, 0.5)

describe('Vector3 Operations', () => {
  it('Can create vector from polar coordinates', () => {
    const radius = 1

    const angle: Quaternion = [0, oneOnRootTwo, 0, oneOnRootTwo]
    expect(V3O.fromPolar(radius, angle)).toBeCloseToV3([0, 0, -1])
  })

  it('Can create vector from polar coordinates, in each axis', () => {
    // X
    {
      const radius = 1
      const angle: Quaternion = [0, 0, 0, 1]
      expect(V3O.fromPolar(radius, angle)).toBeCloseToV3([1, 0, 0])
    }

    // Y
    {
      const radius = 1
      const angle: Quaternion = [0, 0, oneOnRootTwo, oneOnRootTwo]
      expect(V3O.fromPolar(radius, angle)).toBeCloseToV3([0, 1, 0])
    }

    // Z
    {
      const radius = 1
      const angle: Quaternion = [0, oneOnRootTwo, 0, oneOnRootTwo]
      expect(V3O.fromPolar(radius, angle)).toBeCloseToV3([0, 0, -1])
    }

    // -X
    // Just rolls on own axis so no movement
    {
      const radius = 1
      const angle: Quaternion = [1, 0, 0, 0]
      expect(V3O.fromPolar(radius, angle)).toBeCloseToV3([1, 0, 0])
    }

    // -Y
    {
      const radius = 1
      const angle: Quaternion = [0, 1, 0, 0]
      expect(V3O.fromPolar(radius, angle)).toBeCloseToV3([-1, 0, 0])
    }

    // -Z
    {
      const radius = 1
      const angle: Quaternion = [0, 0, 1, 0]
      expect(V3O.fromPolar(radius, angle)).toBeCloseToV3([-1, 0, 0])
    }
  })

  it('Can rotate a vector', () => {
    const vector: V3 = [1, 0, 0]
    const rotation: Quaternion = [0, oneOnRootTwo, 0, oneOnRootTwo]

    const expected: V3 = [0, 0, -1]

    expect(V3O.rotate(vector, rotation)).toBeCloseToV3(expected)
  })

  it('Can rotate a vector in each axis', () => {
    // vector in x direction, rotating 90 degrees about y, points in z
    {
      const vector: V3 = [1, 0, 0]
      const rotation: Quaternion = [0, oneOnRootTwo, 0, oneOnRootTwo]
      const expected: V3 = [0, 0, -1]
      expect(V3O.rotate(vector, rotation)).toBeCloseToV3(expected)
    }

    // vector in x direction, rotating 90 degrees about z, points in y
    {
      const vector: V3 = [1, 0, 0]
      const rotation: Quaternion = [0, 0, oneOnRootTwo, oneOnRootTwo]
      const expected: V3 = [0, 1, 0]
      expect(V3O.rotate(vector, rotation)).toBeCloseToV3(expected)
    }

    // vector in y direction, rotating 90 degrees about z, points in -x
    {
      const vector: V3 = [0, 1, 0]
      const rotation: Quaternion = [0, 0, oneOnRootTwo, oneOnRootTwo]
      const expected: V3 = [-1, 0, 0]
      expect(V3O.rotate(vector, rotation)).toBeCloseToV3(expected)
    }

    // vector in z direction, rotating 90 degrees about x, points in y
    {
      const vector: V3 = [0, 0, 1]
      const rotation: Quaternion = [oneOnRootTwo, 0, 0, oneOnRootTwo]
      const expected: V3 = [0, -1, 0]
      expect(V3O.rotate(vector, rotation)).toBeCloseToV3(expected)
    }
  })
})

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeCloseToV3<V3>(expected: V3): R
    }
  }
}

expect.extend({
  toBeCloseToV3(received: V3, expected: V3, precision = 2) {
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
