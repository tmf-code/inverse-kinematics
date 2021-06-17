import { V2 } from '../src'
import { Link, getJointTransforms, getErrorDistance, solve, SolveOptions, JointTransform } from '../src/Solve2D'

describe('forwardPass', () => {
  it('Returns base in empty chain', () => {
    const links: Link[] = []
    const pivotTransform = { position: [0, 0] as V2, rotation: 0 }
    const endEffectorPosition = getJointTransforms(links, pivotTransform).effectorPosition

    expect(endEffectorPosition).toEqual([0, 0])
  })

  it('Returns end effector position', () => {
    const links: Link[] = [{ rotation: 0, length: 50 }]
    const pivotTransform = { position: [0, 0] as V2, rotation: 0 }
    const endEffectorPosition = getJointTransforms(links, pivotTransform).effectorPosition

    expect(endEffectorPosition).toEqual([50, 0])
  })

  it('Returns end effector position after long chain', () => {
    const links: Link[] = [
      { rotation: 0, length: 50 },
      { rotation: 0, length: 50 },
      { rotation: 0, length: 50 },
      { rotation: 0, length: 50 },
    ]
    const pivotTransform = { position: [0, 0] as V2, rotation: 0 }
    const endEffectorPosition = getJointTransforms(links, pivotTransform).effectorPosition

    expect(endEffectorPosition).toEqual([200, 0])
  })

  it('Returns end effector position after bend', () => {
    const links: Link[] = [{ rotation: Math.PI / 2, length: 50 }]
    const pivotTransform = { position: [0, 0] as V2, rotation: 0 }
    const endEffectorPosition = getJointTransforms(links, pivotTransform).effectorPosition

    expect(endEffectorPosition[0]).toBeCloseTo(0)
    expect(endEffectorPosition[1]).toBeCloseTo(50)
  })

  it('Returns end effector position chain with bends', () => {
    const links: Link[] = [
      { rotation: 0, length: 50 },
      { rotation: 0, length: 50 },
      { rotation: Math.PI / 2, length: 50 },
      { rotation: -Math.PI / 2, length: 50 },
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
      { rotation: 0, length: 50 },
      { rotation: 0, length: 50 },
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
      { rotation: 0, length: 50 },
      { rotation: 0, length: 50 },
      { rotation: Math.PI / 2, length: 50 },
      { rotation: -Math.PI / 2, length: 50 },
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
    solve(links, [0, 0], [0, 0])

    expect(links).toStrictEqual<Link[]>(linksCopy)
  })

  it('Reduces distance to target each time it is called', () => {
    const links: Link[] = [{ rotation: 0, length: 50 }]
    const target: V2 = [0, 50]

    const base: JointTransform = { position: [0, 0], rotation: 0 }

    solveAndCheckDidImprove(links, base, target)
    solveAndCheckDidImprove(links, base, target)
    solveAndCheckDidImprove(links, base, target)
  })

  it('Reduces distance to target each time it is called with complex chain', () => {
    const links: Link[] = [
      { rotation: 0, length: 50 },
      { rotation: 0, length: 50 },
      { rotation: 0, length: 50 },
      { rotation: 0, length: 50 },
    ]
    const target: V2 = [0, 50]

    const base: JointTransform = { position: [0, 0], rotation: 0 }

    solveAndCheckDidImprove(links, base, target)
    solveAndCheckDidImprove(links, base, target)
    solveAndCheckDidImprove(links, base, target)
  })
})

function cloneDeep<T>(object: T): T {
  return JSON.parse(JSON.stringify(object))
}

function solveAndCheckDidImprove(links: Link[], base: JointTransform, target: V2) {
  const options: SolveOptions = {
    acceptedError: 0,
  }

  const errorBefore = getErrorDistance(links, base, target)

  solve(links, base.position, target, options)

  const errorAfter = getErrorDistance(links, base, target)

  expect(errorBefore).toBeGreaterThan(errorAfter)

  return { errorBefore, errorAfter }
}
