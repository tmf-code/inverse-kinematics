import { QuaternionO, V3 } from '../src'
import { Link, getJointTransforms, getErrorDistance, solve, SolveOptions, JointTransform } from '../src/Solve3D'

describe('forwardPass', () => {
  it('Returns base in empty chain', () => {
    const links: Link[] = []
    const pivotTransform = { position: [0, 0, 0] as V3, rotation: QuaternionO.zeroRotation() }
    const endEffectorPosition = getJointTransforms(links, pivotTransform).effectorPosition

    expect(endEffectorPosition).toEqual<V3>([0, 0, 0])
  })

  it('Returns end effector position', () => {
    const links: Link[] = [{ rotation: QuaternionO.zeroRotation(), length: 50 }]
    const pivotTransform = { position: [0, 0, 0] as V3, rotation: QuaternionO.zeroRotation() }
    const endEffectorPosition = getJointTransforms(links, pivotTransform).effectorPosition

    expect(endEffectorPosition).toEqual<V3>([50, 0, 0])
  })

  it('Returns end effector position after long chain', () => {
    const links: Link[] = [
      { rotation: QuaternionO.zeroRotation(), length: 50 },
      { rotation: QuaternionO.zeroRotation(), length: 50 },
      { rotation: QuaternionO.zeroRotation(), length: 50 },
      { rotation: QuaternionO.zeroRotation(), length: 50 },
    ]
    const pivotTransform = { position: [0, 0, 0] as V3, rotation: QuaternionO.zeroRotation() }
    const endEffectorPosition = getJointTransforms(links, pivotTransform).effectorPosition

    expect(endEffectorPosition).toEqual<V3>([200, 0, 0])
  })

  it('Returns end effector position after bend', () => {
    const links: Link[] = [{ rotation: QuaternionO.fromEulerAngles([0, 0, Math.PI / 2]), length: 50 }]
    const pivotTransform = { position: [0, 0, 0] as V3, rotation: QuaternionO.zeroRotation() }
    const endEffectorPosition = getJointTransforms(links, pivotTransform).effectorPosition

    expect(endEffectorPosition[0]).toBeCloseTo(0)
    expect(endEffectorPosition[1]).toBeCloseTo(50)
  })

  it('Returns end effector position chain with bends', () => {
    const links: Link[] = [
      { rotation: QuaternionO.zeroRotation(), length: 50 },
      { rotation: QuaternionO.zeroRotation(), length: 50 },
      { rotation: QuaternionO.fromEulerAngles([0, 0, Math.PI / 2]), length: 50 },
      { rotation: QuaternionO.fromEulerAngles([0, 0, -Math.PI / 2]), length: 50 },
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
      { rotation: QuaternionO.zeroRotation(), length: 50 },
      { rotation: QuaternionO.zeroRotation(), length: 50 },
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
      { rotation: QuaternionO.zeroRotation(), length: 50 },
      { rotation: QuaternionO.zeroRotation(), length: 50 },
      { rotation: QuaternionO.fromEulerAngles([0, 0, Math.PI / 2]), length: 50 },
      { rotation: QuaternionO.fromEulerAngles([0, 0, -Math.PI / 2]), length: 50 },
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
})

describe('solve', () => {
  it('Runs with empty links array', () => {
    const links: Link[] = []
    const linksCopy = cloneDeep(links)
    solve(links, [0, 0, 0], [0, 0, 0])

    expect(links).toStrictEqual<Link[]>(linksCopy)
  })

  it('Reduces distance to target each time it is called', () => {
    const links: Link[] = [{ rotation: QuaternionO.zeroRotation(), length: 50 }]
    const target: V3 = [0, 50, 0]

    const base: JointTransform = { position: [0, 0, 0], rotation: QuaternionO.zeroRotation() }

    solveAndCheckDidImprove(links, base, target)
    solveAndCheckDidImprove(links, base, target)
    solveAndCheckDidImprove(links, base, target)
  })

  it('Reduces distance to target each time it is called with complex chain', () => {
    const links: Link[] = [
      { rotation: QuaternionO.zeroRotation(), length: 50 },
      { rotation: QuaternionO.zeroRotation(), length: 50 },
      { rotation: QuaternionO.zeroRotation(), length: 50 },
      { rotation: QuaternionO.zeroRotation(), length: 50 },
    ]
    const target: V3 = [0, 50, 0]

    const base: JointTransform = { position: [0, 0, 0], rotation: QuaternionO.zeroRotation() }

    solveAndCheckDidImprove(links, base, target)
    solveAndCheckDidImprove(links, base, target)
    solveAndCheckDidImprove(links, base, target)
  })
})

function cloneDeep<T>(object: T): T {
  return JSON.parse(JSON.stringify(object))
}

function solveAndCheckDidImprove(links: Link[], base: JointTransform, target: V3) {
  const options: SolveOptions = {
    acceptedError: 0,
  }

  const errorBefore = getErrorDistance(links, base, target)

  solve(links, base.position, target, options)

  const errorAfter = getErrorDistance(links, base, target)

  expect(errorBefore).toBeGreaterThan(errorAfter)

  return { errorBefore, errorAfter }
}
