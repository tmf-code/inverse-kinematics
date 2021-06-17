import { forwardPass, Bone, solve, SolveOptions, Transform, V2, V2O } from '../src'

describe('forwardPass', () => {
  it('Returns base in empty chain', () => {
    const bones: Bone[] = []
    const pivotTransform = { position: [0, 0] as V2, rotation: 0 }
    const endEffectorPosition = forwardPass(bones, pivotTransform).effectorPosition

    expect(endEffectorPosition).toEqual([0, 0])
  })

  it('Returns end effector position', () => {
    const bones: Bone[] = [{ joint: { angle: 0 }, length: 50 }]
    const pivotTransform = { position: [0, 0] as V2, rotation: 0 }
    const endEffectorPosition = forwardPass(bones, pivotTransform).effectorPosition

    expect(endEffectorPosition).toEqual([50, 0])
  })

  it('Returns end effector position after long chain', () => {
    const bones: Bone[] = [
      { joint: { angle: 0 }, length: 50 },
      { joint: { angle: 0 }, length: 50 },
      { joint: { angle: 0 }, length: 50 },
      { joint: { angle: 0 }, length: 50 },
    ]
    const pivotTransform = { position: [0, 0] as V2, rotation: 0 }
    const endEffectorPosition = forwardPass(bones, pivotTransform).effectorPosition

    expect(endEffectorPosition).toEqual([200, 0])
  })

  it('Returns end effector position after bend', () => {
    const bones: Bone[] = [{ joint: { angle: Math.PI / 2 }, length: 50 }]
    const pivotTransform = { position: [0, 0] as V2, rotation: 0 }
    const endEffectorPosition = forwardPass(bones, pivotTransform).effectorPosition

    expect(endEffectorPosition[0]).toBeCloseTo(0)
    expect(endEffectorPosition[1]).toBeCloseTo(50)
  })

  it('Returns end effector position chain with bends', () => {
    const bones: Bone[] = [
      { joint: { angle: 0 }, length: 50 },
      { joint: { angle: 0 }, length: 50 },
      { joint: { angle: Math.PI / 2 }, length: 50 },
      { joint: { angle: -Math.PI / 2 }, length: 50 },
    ]
    const pivotTransform = { position: [0, 0] as V2, rotation: 0 }
    const endEffectorPosition = forwardPass(bones, pivotTransform).effectorPosition

    expect(endEffectorPosition[0]).toBeCloseTo(150)
    expect(endEffectorPosition[1]).toBeCloseTo(50)
  })

  it('Returns absolute transforms for empty chain', () => {
    const bones: Bone[] = []
    const pivotTransform = { position: [0, 0] as V2, rotation: 0 }
    const transforms = forwardPass(bones, pivotTransform).transforms

    expect(transforms.length).toBe(1)
    expect(transforms[0]).toStrictEqual({ position: [0, 0], rotation: 0 })
  })

  it('Returns absolute transforms for chain', () => {
    const bones: Bone[] = [
      { joint: { angle: 0 }, length: 50 },
      { joint: { angle: 0 }, length: 50 },
    ]
    const pivotTransform = { position: [50, 0] as V2, rotation: 0 }
    const transforms = forwardPass(bones, pivotTransform).transforms

    expect(transforms.length).toBe(3)
    expect(transforms).toStrictEqual([
      { position: [50, 0], rotation: 0 },
      { position: [100, 0], rotation: 0 },
      { position: [150, 0], rotation: 0 },
    ])
  })

  it('Returns absolute transforms for chain', () => {
    const bones: Bone[] = [
      { joint: { angle: 0 }, length: 50 },
      { joint: { angle: 0 }, length: 50 },
    ]
    const pivotTransform = { position: [50, 0] as V2, rotation: 0 }
    const transforms = forwardPass(bones, pivotTransform).transforms

    expect(transforms.length).toBe(3)
    expect(transforms).toStrictEqual([
      { position: [50, 0], rotation: 0 },
      { position: [100, 0], rotation: 0 },
      { position: [150, 0], rotation: 0 },
    ])
  })

  it('Returns absolute transforms for chain with bends', () => {
    const bones: Bone[] = [
      { joint: { angle: 0 }, length: 50 },
      { joint: { angle: 0 }, length: 50 },
      { joint: { angle: Math.PI / 2 }, length: 50 },
      { joint: { angle: -Math.PI / 2 }, length: 50 },
    ]
    const pivotTransform = { position: [50, 0] as V2, rotation: 0 }
    const transforms = forwardPass(bones, pivotTransform).transforms

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
  it('Runs with empty bones array', () => {
    const bones: Bone[] = []
    const bonesCopy = cloneDeep(bones)
    solve(bones, [0, 0], [0, 0])

    expect(bones).toStrictEqual<Bone[]>(bonesCopy)
  })

  it('Reduces distance to target each time it is called', () => {
    const bones: Bone[] = [{ joint: { angle: 0 }, length: 50 }]
    const target: V2 = [0, 50]

    const base: Transform = { position: [0, 0], rotation: 0 }

    solveAndCheckDidImprove(bones, base, target)
    solveAndCheckDidImprove(bones, base, target)
    solveAndCheckDidImprove(bones, base, target)
  })

  it('Reduces distance to target each time it is called with complex chain', () => {
    const bones: Bone[] = [
      { joint: { angle: 0 }, length: 50 },
      { joint: { angle: 0 }, length: 50 },
      { joint: { angle: 0 }, length: 50 },
      { joint: { angle: 0 }, length: 50 },
    ]
    const target: V2 = [0, 50]

    const base: Transform = { position: [0, 0], rotation: 0 }

    solveAndCheckDidImprove(bones, base, target)
    solveAndCheckDidImprove(bones, base, target)
    solveAndCheckDidImprove(bones, base, target)
  })
})

function cloneDeep<T>(object: T): T {
  return JSON.parse(JSON.stringify(object))
}

function solveAndCheckDidImprove(bones: Bone[], base: Transform, target: V2) {
  const options: SolveOptions = {
    acceptedError: 0,
  }

  const effectorDistanceBefore = forwardPass(bones, base).effectorPosition
  const errorBefore = V2O.euclideanDistanceV2(target, effectorDistanceBefore)

  solve(bones, base.position, target, options)

  const effectorDistanceAfter = forwardPass(bones, base).effectorPosition
  const errorAfter = V2O.euclideanDistanceV2(target, effectorDistanceAfter)

  expect(errorBefore).toBeGreaterThan(errorAfter)

  return { errorBefore, errorAfter }
}
