import { Quaternion, QuaternionO, Solve3D, SolveOptions, V3, V3O } from '../src'
import { Link, getJointTransforms, getErrorDistance, solve, JointTransform, SolveResult } from '../src/Solve3D'

describe('forwardPass', () => {
  it('Returns base in empty chain', () => {
    const links: Link[] = []
    const pivotTransform = { position: [0, 0, 0] as V3, rotation: QuaternionO.zeroRotation() }
    const endEffectorPosition = getJointTransforms(links, pivotTransform).effectorPosition

    expect(endEffectorPosition).toEqual<V3>([0, 0, 0])
  })

  it('Returns end effector position', () => {
    const links: Link[] = [{ rotation: QuaternionO.zeroRotation(), position: [50, 0, 0] }]
    const pivotTransform = { position: [0, 0, 0] as V3, rotation: QuaternionO.zeroRotation() }
    const endEffectorPosition = getJointTransforms(links, pivotTransform).effectorPosition

    expect(endEffectorPosition).toEqual<V3>([50, 0, 0])
  })

  it('Respects base rotation', () => {
    const links: Link[] = [{ rotation: QuaternionO.zeroRotation(), position: [50, 0, 0] }]
    const pivotTransform = { position: [0, 0, 0] as V3, rotation: QuaternionO.fromEulerAngles([0, 0, Math.PI / 2]) }
    const endEffectorPosition = getJointTransforms(links, pivotTransform).effectorPosition

    expect(endEffectorPosition[1]).toBeCloseTo(50)
  })

  it('Returns end effector position after long chain', () => {
    const links: Link[] = [
      { rotation: QuaternionO.zeroRotation(), position: [50, 0, 0] },
      { rotation: QuaternionO.zeroRotation(), position: [50, 0, 0] },
      { rotation: QuaternionO.zeroRotation(), position: [50, 0, 0] },
      { rotation: QuaternionO.zeroRotation(), position: [50, 0, 0] },
    ]
    const pivotTransform = { position: [0, 0, 0] as V3, rotation: QuaternionO.zeroRotation() }
    const endEffectorPosition = getJointTransforms(links, pivotTransform).effectorPosition

    expect(endEffectorPosition).toEqual<V3>([200, 0, 0])
  })

  it('Returns end effector position after bend', () => {
    const links: Link[] = [{ rotation: QuaternionO.fromEulerAngles([0, 0, Math.PI / 2]), position: [50, 0, 0] }]
    const pivotTransform = { position: [0, 0, 0] as V3, rotation: QuaternionO.zeroRotation() }
    const endEffectorPosition = getJointTransforms(links, pivotTransform).effectorPosition

    expect(endEffectorPosition[0]).toBeCloseTo(0)
    expect(endEffectorPosition[1]).toBeCloseTo(50)
  })

  it('Returns end effector position chain with bends', () => {
    const links: Link[] = [
      { rotation: QuaternionO.zeroRotation(), position: [50, 0, 0] },
      { rotation: QuaternionO.zeroRotation(), position: [50, 0, 0] },
      { rotation: QuaternionO.fromEulerAngles([0, 0, Math.PI / 2]), position: [50, 0, 0] },
      { rotation: QuaternionO.fromEulerAngles([0, 0, -Math.PI / 2]), position: [50, 0, 0] },
    ]
    const pivotTransform = { position: [0, 0, 0] as V3, rotation: QuaternionO.zeroRotation() }
    const endEffectorPosition = getJointTransforms(links, pivotTransform).effectorPosition

    expect(endEffectorPosition[0]).toBeCloseTo(150)
    expect(endEffectorPosition[1]).toBeCloseTo(50)
  })

  it('Returns absolute transforms for empty chain', () => {
    const links: Link[] = []
    const pivotTransform = { position: [0, 0, 0] as V3, rotation: QuaternionO.zeroRotation() }
    const transforms = getJointTransforms(links, pivotTransform).transforms

    expect(transforms.length).toBe(1)
    expect(transforms[0]).toStrictEqual<JointTransform>({ position: [0, 0, 0], rotation: QuaternionO.zeroRotation() })
  })

  it('Returns absolute transforms for chain', () => {
    const links: Link[] = [
      { rotation: QuaternionO.zeroRotation(), position: [50, 0, 0] },
      { rotation: QuaternionO.zeroRotation(), position: [50, 0, 0] },
    ]
    const pivotTransform = { position: [50, 0, 0] as V3, rotation: QuaternionO.zeroRotation() }
    const transforms = getJointTransforms(links, pivotTransform).transforms

    expect(transforms.length).toBe(3)
    expect(transforms).toStrictEqual<JointTransform[]>([
      { position: [50, 0, 0], rotation: QuaternionO.zeroRotation() },
      { position: [100, 0, 0], rotation: QuaternionO.zeroRotation() },
      { position: [150, 0, 0], rotation: QuaternionO.zeroRotation() },
    ])
  })

  it('Returns absolute transforms for chain with bends', () => {
    const links: Link[] = [
      { rotation: QuaternionO.zeroRotation(), position: [50, 0, 0] },
      { rotation: QuaternionO.zeroRotation(), position: [50, 0, 0] },
      { rotation: QuaternionO.fromEulerAngles([0, 0, Math.PI / 2]), position: [50, 0, 0] },
      { rotation: QuaternionO.fromEulerAngles([0, 0, -Math.PI / 2]), position: [50, 0, 0] },
    ]
    const pivotTransform = { position: [50, 0, 0] as V3, rotation: QuaternionO.zeroRotation() }
    const transforms = getJointTransforms(links, pivotTransform).transforms

    expect(transforms.length).toBe(5)
    expect(transforms).toStrictEqual<JointTransform[]>([
      { position: [50, 0, 0], rotation: QuaternionO.zeroRotation() },
      { position: [100, 0, 0], rotation: QuaternionO.zeroRotation() },
      { position: [150, 0, 0], rotation: QuaternionO.zeroRotation() },
      { position: [150, 50, 0], rotation: QuaternionO.fromEulerAngles([0, 0, Math.PI / 2]) },
      { position: [200, 50, 0], rotation: QuaternionO.zeroRotation() },
    ])
  })

  it('Respects exact local constraint', () => {
    let links: Link[] = [
      {
        rotation: QuaternionO.zeroRotation(),
        position: [1, 0, 0],
        constraints: { value: QuaternionO.fromEulerAngles([Math.PI / 4, 0, 0]), type: 'local' },
      },
    ]
    const target: V3 = [0, 1, 0]
    const base: JointTransform = { position: [0, 0, 0], rotation: QuaternionO.zeroRotation() }
    const result = solve(links, base, target, { learningRate: 0, method: 'FABRIK' })
    links = result.links

    const jointTransforms = getJointTransforms(links, base)
    expect(jointTransforms.transforms[1]?.rotation).toBeCloseToQuaternion(
      QuaternionO.fromEulerAngles([Math.PI / 4, 0, 0]),
    )
  })

  it('Respects exact global constraint', () => {
    let links: Link[] = [
      { rotation: QuaternionO.zeroRotation(), position: [1, 0, 0] },
      { rotation: QuaternionO.zeroRotation(), position: [1, 0, 0] },
      {
        rotation: QuaternionO.zeroRotation(),
        position: [1, 0, 0],
        constraints: { value: QuaternionO.fromEulerAngles([Math.PI / 2, 0, 0]), type: 'global' },
      },
    ]
    const target: V3 = [0, 1, 0]
    const base: JointTransform = { position: [0, 0, 0], rotation: QuaternionO.zeroRotation() }
    const result = solve(links, base, target, { learningRate: 0, method: 'FABRIK' })
    links = result.links

    const jointTransforms = getJointTransforms(links, base)

    expect(jointTransforms.transforms[3]?.rotation).toBeCloseToQuaternion(
      QuaternionO.fromEulerAngles([Math.PI / 2, 0, 0]),
    )
  })
})

describe('solve FABRIK', () => {
  it('Runs with empty links array', () => {
    const links: Link[] = []
    const linksCopy = cloneDeep(links)
    solve(links, { position: [0, 0, 0], rotation: QuaternionO.zeroRotation() }, [0, 0, 0])

    expect(links).toStrictEqual<Link[]>(linksCopy)
  })

  it('Reduces distance to target each time it is called', () => {
    const links: Link[] = [{ rotation: QuaternionO.zeroRotation(), position: [50, 0, 0] }]
    const target: V3 = [0, 50, 0]

    const base: JointTransform = { position: [0, 0, 0], rotation: QuaternionO.zeroRotation() }

    solveAndCheckDidImprove(links, base, target, 3, 'FABRIK')
  })

  it('Reduces distance to target each time it is called with complex chain', () => {
    const links: Link[] = [
      { rotation: QuaternionO.zeroRotation(), position: [50, 0, 0] },
      { rotation: QuaternionO.zeroRotation(), position: [50, 0, 0] },
      { rotation: QuaternionO.zeroRotation(), position: [50, 0, 0] },
      { rotation: QuaternionO.zeroRotation(), position: [50, 0, 0] },
    ]
    const target: V3 = [0, 50, 0]

    const base: JointTransform = { position: [0, 0, 0], rotation: QuaternionO.zeroRotation() }

    solveAndCheckDidImprove(links, base, target, 3, 'FABRIK')
  })

  it('Should not improve if output of previous step is not used as input to following step', () => {
    const links: Link[] = [
      { rotation: QuaternionO.zeroRotation(), position: [50, 0, 0] },
      { rotation: QuaternionO.zeroRotation(), position: [50, 0, 0] },
      { rotation: QuaternionO.zeroRotation(), position: [50, 0, 0] },
      { rotation: QuaternionO.zeroRotation(), position: [50, 0, 0] },
    ]
    const target: V3 = [0, 50, 0]

    const base: JointTransform = { position: [0, 0, 0], rotation: QuaternionO.zeroRotation() }

    const options: SolveOptions = {
      acceptedError: 0,
      method: 'FABRIK',
    }

    for (let index = 0; index < 3; index++) {
      const errorBefore = getErrorDistance(links, base, target)
      solve(links, base, target, options)
      const errorAfter = Solve3D.getErrorDistance(links, base, target)
      expect(errorBefore).toEqual(errorAfter)
    }
  })

  it('Respects no rotation unary constraint', () => {
    const links: Link[] = [
      { rotation: QuaternionO.zeroRotation(), position: [50, 0, 0], constraints: { yaw: 0, roll: 0, pitch: 0 } },
    ]
    const target: V3 = [0, 50, 0]
    const base: JointTransform = { position: [0, 0, 0], rotation: QuaternionO.zeroRotation() }

    solveAndCheckDidNotImprove(links, base, target, 3, 'FABRIK')
  })

  it('Respects no rotation binary constraint', () => {
    const links: Link[] = [
      {
        rotation: QuaternionO.zeroRotation(),
        position: [50, 0, 0],
        constraints: { yaw: { min: 0, max: 0 }, roll: { min: 0, max: 0 }, pitch: { min: 0, max: 0 } },
      },
    ]
    const target: V3 = [0, 50, 0]
    const base: JointTransform = { position: [0, 0, 0], rotation: QuaternionO.zeroRotation() }

    solveAndCheckDidNotImprove(links, base, target, 3, 'FABRIK')
  })

  it('Respects binary constraint', () => {
    let links: Link[] = [
      {
        rotation: QuaternionO.zeroRotation(),
        position: [1, 0, 0],
        constraints: {
          yaw: 0,
          // Roll about z, causes x points vector to rotate to point up at y
          roll: { min: -Math.PI / 4, max: Math.PI / 4 },
          pitch: 0,
        },
      },
    ]
    const target: V3 = [0, 1, 0]
    const base: JointTransform = { position: [0, 0, 0], rotation: QuaternionO.zeroRotation() }

    let error: number
    let lastError = getErrorDistance(links, base, target)
    while (true) {
      const result = solve(links, base, target, { learningRate: 10e-3, method: 'FABRIK' })
      links = result.links
      error = result.getErrorDistance()

      const errorDifference = lastError - error
      const didNotImprove = errorDifference <= 0
      if (didNotImprove) break

      lastError = error
    }

    // Length 1, pointing 45 degrees on way from x to y
    const expectedError = V3O.euclideanDistance(target, [0.7071, 0.7071, 0])
    expect(error).toBeCloseTo(expectedError)

    const jointTransforms = getJointTransforms(links, base)

    // Quaternion from euler rotation about z 45 degrees
    expect(jointTransforms.transforms[1]?.rotation).toBeCloseToQuaternion([0, 0, 0.3826834, 0.9238795])
  })
})

describe('solve CCD', () => {
  it('Runs with empty links array', () => {
    const links: Link[] = []
    const linksCopy = cloneDeep(links)
    solve(links, { position: [0, 0, 0], rotation: QuaternionO.zeroRotation() }, [0, 0, 0], { method: 'CCD' })

    expect(links).toStrictEqual<Link[]>(linksCopy)
  })

  it('Reduces distance to target each time it is called', () => {
    const links: Link[] = [{ rotation: QuaternionO.zeroRotation(), position: [50, 0, 0] }]
    const target: V3 = [0, 50, 0]

    const base: JointTransform = { position: [0, 0, 0], rotation: QuaternionO.zeroRotation() }

    solveAndCheckDidImprove(links, base, target, 1, 'CCD')
  })

  it('Reduces distance to target each time it is called with complex chain', () => {
    const links: Link[] = [
      { rotation: QuaternionO.zeroRotation(), position: [50, 0, 0] },
      { rotation: QuaternionO.zeroRotation(), position: [50, 0, 0] },
      { rotation: QuaternionO.zeroRotation(), position: [50, 0, 0] },
      { rotation: QuaternionO.zeroRotation(), position: [50, 0, 0] },
    ]
    const target: V3 = [0, 50, 0]

    const base: JointTransform = { position: [0, 0, 0], rotation: QuaternionO.zeroRotation() }

    solveAndCheckDidImprove(links, base, target, 1, 'CCD')
  })

  it('Should not improve if output of previous step is not used as input to following step', () => {
    const links: Link[] = [
      { rotation: QuaternionO.zeroRotation(), position: [50, 0, 0] },
      { rotation: QuaternionO.zeroRotation(), position: [50, 0, 0] },
      { rotation: QuaternionO.zeroRotation(), position: [50, 0, 0] },
      { rotation: QuaternionO.zeroRotation(), position: [50, 0, 0] },
    ]
    const target: V3 = [0, 50, 0]

    const base: JointTransform = { position: [0, 0, 0], rotation: QuaternionO.zeroRotation() }

    const options: SolveOptions = {
      acceptedError: 0,
      method: 'CCD',
    }

    for (let index = 0; index < 3; index++) {
      const errorBefore = getErrorDistance(links, base, target)
      solve(links, base, target, options)
      const errorAfter = Solve3D.getErrorDistance(links, base, target)
      expect(errorBefore).toEqual(errorAfter)
    }
  })

  it('Respects no rotation unary constraint', () => {
    const links: Link[] = [
      { rotation: QuaternionO.zeroRotation(), position: [50, 0, 0], constraints: { yaw: 0, roll: 0, pitch: 0 } },
    ]
    const target: V3 = [0, 50, 0]
    const base: JointTransform = { position: [0, 0, 0], rotation: QuaternionO.zeroRotation() }

    solveAndCheckDidNotImprove(links, base, target, 3, 'CCD')
  })

  it('Respects no rotation binary constraint', () => {
    const links: Link[] = [
      {
        rotation: QuaternionO.zeroRotation(),
        position: [50, 0, 0],
        constraints: { yaw: { min: 0, max: 0 }, roll: { min: 0, max: 0 }, pitch: { min: 0, max: 0 } },
      },
    ]
    const target: V3 = [0, 50, 0]
    const base: JointTransform = { position: [0, 0, 0], rotation: QuaternionO.zeroRotation() }

    solveAndCheckDidNotImprove(links, base, target, 3, 'CCD')
  })

  it('Respects binary constraint', () => {
    let links: Link[] = [
      {
        rotation: QuaternionO.zeroRotation(),
        position: [1, 0, 0],
        constraints: {
          yaw: 0,
          // Roll about z, causes x points vector to rotate to point up at y
          roll: { min: -Math.PI / 4, max: Math.PI / 4 },
          pitch: 0,
        },
      },
    ]
    const target: V3 = [0, 1, 0]
    const base: JointTransform = { position: [0, 0, 0], rotation: QuaternionO.zeroRotation() }

    let error: number
    let lastError = getErrorDistance(links, base, target)
    while (true) {
      const result = solve(links, base, target, { learningRate: 10e-3, method: 'CCD' })
      links = result.links
      error = result.getErrorDistance()

      const errorDifference = lastError - error
      const didNotImprove = errorDifference <= 0
      if (didNotImprove) break

      lastError = error
    }

    // Length 1, pointing 45 degrees on way from x to y
    const expectedError = V3O.euclideanDistance(target, [0.7071, 0.7071, 0])
    expect(error).toBeCloseTo(expectedError)

    const jointTransforms = getJointTransforms(links, base)

    // Quaternion from euler rotation about z 45 degrees
    expect(jointTransforms.transforms[1]?.rotation).toBeCloseToQuaternion([0, 0, 0.3826834, 0.9238795])
  })
})

function cloneDeep<T>(object: T): T {
  return JSON.parse(JSON.stringify(object))
}

function solveAndCheckDidImprove(
  links: Link[],
  base: JointTransform,
  target: V3,
  times: number,
  method: 'CCD' | 'FABRIK',
) {
  const options: SolveOptions = {
    acceptedError: 0,
    method,
  }

  let solveResult: undefined | SolveResult

  for (let index = 0; index < times; index++) {
    const linksThisIteration = solveResult?.links ?? links
    const errorBefore = getErrorDistance(linksThisIteration, base, target)
    solveResult = solve(linksThisIteration, base, target, options)
    const errorAfter = solveResult.getErrorDistance()
    expect(errorBefore).toBeGreaterThan(errorAfter)
  }
}

function solveAndCheckDidNotImprove(
  links: Link[],
  base: JointTransform,
  target: V3,
  times: number,
  method: 'CCD' | 'FABRIK',
) {
  const options: SolveOptions = {
    acceptedError: 0,
    method,
  }

  let solveResult: undefined | SolveResult

  for (let index = 0; index < times; index++) {
    const linksThisIteration = solveResult?.links ?? links
    const errorBefore = getErrorDistance(linksThisIteration, base, target)
    solveResult = solve(linksThisIteration, base, target, options)
    const errorAfter = solveResult.getErrorDistance()
    expect(errorBefore).not.toBeGreaterThan(errorAfter)
  }
}

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
        message: () =>
          `expected ${received.map((number) => number.toPrecision(precision))} not to be close to  ${expected.map(
            (number) => number.toPrecision(precision),
          )}`,
        pass: true,
      }
    } else {
      return {
        message: () =>
          `expected  ${received.map((number) => number.toPrecision(precision))} to be close to ${expected.map(
            (number) => number.toPrecision(precision),
          )}`,
        pass: false,
      }
    }
  },
})
