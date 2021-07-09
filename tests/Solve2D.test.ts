import { SolveOptions, V2, V2O } from '../src'
import {
  buildLink,
  getErrorDistance,
  getJointTransforms,
  JointTransform,
  Link,
  solve,
  SolveResult,
} from '../src/Solve2D'

describe('getJointTransforms', () => {
  it('Returns base in empty chain', () => {
    const links: Link[] = []
    const pivotTransform = { position: [0, 0] as V2, rotation: 0 }
    const endEffectorPosition = getJointTransforms(links, pivotTransform).effectorPosition

    expect(endEffectorPosition).toEqual([0, 0])
  })

  it('Returns end effector position', () => {
    const links: Link[] = [{ rotation: 0, position: [50, 0] }]
    const pivotTransform = { position: [0, 0] as V2, rotation: 0 }
    const endEffectorPosition = getJointTransforms(links, pivotTransform).effectorPosition

    expect(endEffectorPosition).toEqual([50, 0])
  })

  it('Respects base rotation', () => {
    const links: Link[] = [buildLink([50, 0])]
    const pivotTransform = { position: [0, 0] as V2, rotation: Math.PI / 2 }
    const endEffectorPosition = getJointTransforms(links, pivotTransform).effectorPosition

    expect(endEffectorPosition[1]).toBeCloseTo(50)
  })

  it('Returns end effector position after long chain', () => {
    const links: Link[] = [
      { rotation: 0, position: [50, 0] },
      { rotation: 0, position: [50, 0] },
      { rotation: 0, position: [50, 0] },
      { rotation: 0, position: [50, 0] },
    ]
    const pivotTransform = { position: [0, 0] as V2, rotation: 0 }
    const endEffectorPosition = getJointTransforms(links, pivotTransform).effectorPosition

    expect(endEffectorPosition).toEqual([200, 0])
  })

  it('Returns end effector position after bend', () => {
    const links: Link[] = [{ rotation: Math.PI / 2, position: [50, 0] }]
    const pivotTransform = { position: [0, 0] as V2, rotation: 0 }
    const endEffectorPosition = getJointTransforms(links, pivotTransform).effectorPosition

    expect(endEffectorPosition[0]).toBeCloseTo(0)
    expect(endEffectorPosition[1]).toBeCloseTo(50)
  })

  it('Returns end effector position chain with bends', () => {
    const links: Link[] = [
      { rotation: 0, position: [50, 0] },
      { rotation: 0, position: [50, 0] },
      { rotation: Math.PI / 2, position: [50, 0] },
      { rotation: -Math.PI / 2, position: [50, 0] },
    ]
    const pivotTransform = { position: [0, 0] as V2, rotation: 0 }
    const endEffectorPosition = getJointTransforms(links, pivotTransform).effectorPosition

    expect(endEffectorPosition[0]).toBeCloseTo(150)
    expect(endEffectorPosition[1]).toBeCloseTo(50)
  })

  it('Returns absolute transforms for empty chain', () => {
    const links: Link[] = []
    const pivotTransform = { position: [0, 0] as V2, rotation: 0 }
    const transforms = getJointTransforms(links, pivotTransform).transforms

    expect(transforms.length).toBe(1)
    expect(transforms[0]).toStrictEqual({ position: [0, 0], rotation: 0 })
  })

  it('Returns absolute transforms for chain', () => {
    const links: Link[] = [
      { rotation: 0, position: [50, 0] },
      { rotation: 0, position: [50, 0] },
    ]
    const pivotTransform = { position: [50, 0] as V2, rotation: 0 }
    const transforms = getJointTransforms(links, pivotTransform).transforms

    expect(transforms.length).toBe(3)
    expect(transforms).toStrictEqual([
      { position: [50, 0], rotation: 0 },
      { position: [100, 0], rotation: 0 },
      { position: [150, 0], rotation: 0 },
    ])
  })

  it('Returns absolute transforms for chain with bends', () => {
    const links: Link[] = [
      { rotation: 0, position: [50, 0] },
      { rotation: 0, position: [50, 0] },
      { rotation: Math.PI / 2, position: [50, 0] },
      { rotation: -Math.PI / 2, position: [50, 0] },
    ]
    const pivotTransform = { position: [50, 0] as V2, rotation: 0 }
    const transforms = getJointTransforms(links, pivotTransform).transforms

    expect(transforms.length).toBe(5)
    expect(transforms).toStrictEqual([
      { position: [50, 0], rotation: 0 },
      { position: [100, 0], rotation: 0 },
      { position: [150, 0], rotation: 0 },
      { position: [150, 50], rotation: Math.PI / 2 },
      { position: [200, 50], rotation: 0 },
    ])
  })
})

describe('solve', () => {
  it('Runs with empty links array', () => {
    const links: Link[] = []
    const linksCopy = cloneDeep(links)
    solve(links, { position: [0, 0], rotation: 0 }, [0, 0])

    expect(links).toStrictEqual<Link[]>(linksCopy)
  })

  it('Reduces distance to target each time it is called', () => {
    const links: Link[] = [{ rotation: 0, position: [50, 0] }]
    const target: V2 = [0, 50]

    const base: JointTransform = { position: [0, 0], rotation: 0 }

    solveAndCheckDidImprove(links, base, target, 3)
  })

  it('Reduces distance to target each time it is called with complex chain', () => {
    const links: Link[] = [
      { rotation: 0, position: [50, 0] },
      { rotation: 0, position: [50, 0] },
      { rotation: 0, position: [50, 0] },
      { rotation: 0, position: [50, 0] },
    ]
    const target: V2 = [0, 50]

    const base: JointTransform = { position: [0, 0], rotation: 0 }

    solveAndCheckDidImprove(links, base, target, 3)
  })

  it('Respects no rotation unary constraint', () => {
    const links: Link[] = [{ rotation: 0, position: [50, 0], constraints: 0 }]
    const target: V2 = [0, 50]
    const base: JointTransform = { position: [0, 0], rotation: 0 }

    solveAndCheckDidNotImprove(links, base, target, 3)
  })

  it('Respects unary constraint', () => {
    let links: Link[] = [{ rotation: 0, position: [1, 0], constraints: Math.PI / 2 }]
    const target: V2 = [0, 1]
    const base: JointTransform = { position: [0, 0], rotation: 0 }

    let error: number
    let lastError = getErrorDistance(links, base, target)
    while (true) {
      const result = solve(links, base, target, { learningRate: 10e-2 })
      links = result.links
      error = result.getErrorDistance()

      const errorDifference = lastError - error
      const didNotImprove = errorDifference <= 0
      if (didNotImprove) break

      lastError = error
    }

    const expectedError = V2O.euclideanDistance(target, [0.7071, 0.7071])
    expect(error).toBeCloseTo(expectedError)

    const jointTransforms = getJointTransforms(links, base)
    expect(jointTransforms.transforms[1]?.rotation).toBeCloseTo(Math.PI / 4)
  })

  it('Respects no rotation binary constraint', () => {
    const links: Link[] = [{ rotation: 0, position: [50, 0], constraints: { min: 0, max: 0 } }]
    const target: V2 = [0, 50]
    const base: JointTransform = { position: [0, 0], rotation: 0 }

    solveAndCheckDidNotImprove(links, base, target, 3)
  })

  it('Respects binary constraint', () => {
    let links: Link[] = [{ rotation: 0, position: [1, 0], constraints: { min: -Math.PI / 4, max: Math.PI / 4 } }]
    const target: V2 = [0, 1]
    const base: JointTransform = { position: [0, 0], rotation: 0 }

    let error: number
    let lastError = getErrorDistance(links, base, target)
    while (true) {
      const result = solve(links, base, target, { learningRate: 10e-2 })
      links = result.links
      error = result.getErrorDistance()

      const errorDifference = lastError - error
      const didNotImprove = errorDifference <= 0
      if (didNotImprove) break

      lastError = error
    }
    const expectedError = V2O.euclideanDistance(target, [0.7071, 0.7071])
    expect(error).toBeCloseTo(expectedError)

    const jointTransforms = getJointTransforms(links, base)
    expect(jointTransforms.transforms[1]?.rotation).toBeCloseTo(Math.PI / 4)
  })

  it('Respects exact local constraint', () => {
    let links: Link[] = [{ rotation: 0, position: [1, 0], constraints: { value: Math.PI / 4, type: 'local' } }]
    const target: V2 = [0, 1]
    const base: JointTransform = { position: [0, 0], rotation: 0 }
    const result = solve(links, base, target, { learningRate: 10e-2 })
    links = result.links

    const jointTransforms = getJointTransforms(links, base)
    expect(jointTransforms.transforms[1]?.rotation).toBeCloseTo(Math.PI / 4)
  })

  it('Respects exact global constraint', () => {
    let links: Link[] = [
      { rotation: 0, position: [1, 0] },
      { rotation: 0, position: [1, 0] },
      { rotation: 0, position: [1, 0], constraints: { value: Math.PI / 4, type: 'global' } },
    ]
    const target: V2 = [0, 1]
    const base: JointTransform = { position: [0, 0], rotation: 0 }
    const result = solve(links, base, target, { learningRate: 10e-2 })
    links = result.links

    const jointTransforms = getJointTransforms(links, base)

    expect(jointTransforms.transforms[3]?.rotation).toBe(Math.PI / 4)
  })
})

function cloneDeep<T>(object: T): T {
  return JSON.parse(JSON.stringify(object))
}

function solveAndCheckDidImprove(links: Link[], base: JointTransform, target: V2, times: number) {
  const options: SolveOptions = {
    acceptedError: 0,
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

function solveAndCheckDidNotImprove(links: Link[], base: JointTransform, target: V2, times: number) {
  const options: SolveOptions = {
    acceptedError: 0,
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
