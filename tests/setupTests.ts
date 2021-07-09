import { Quaternion, V3 } from 'src'
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeCloseToV3<V3>(expected: V3): R
      toBeCloseToQuaternion<Quaternion>(expected: Quaternion): R
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
        message: () =>
          `expected ${toPrecision(received, precision)} not to be close to ${toPrecision(expected, precision)}`,
        pass: true,
      }
    } else {
      return {
        message: () =>
          `expected ${toPrecision(received, precision)} to be close to ${toPrecision(expected, precision)}`,

        pass: false,
      }
    }
  },
})

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
        message: () =>
          `expected ${toPrecision(received, precision)} not to be close to ${toPrecision(expected, precision)}`,
        pass: true,
      }
    } else {
      return {
        message: () =>
          `expected ${toPrecision(received, precision)} to be close to ${toPrecision(expected, precision)}`,
        pass: false,
      }
    }
  },
})

function toPrecision(array: readonly number[], precision: number): string[] {
  return array.map((component) => component.toPrecision(precision))
}
