import { forwardPass, IBone, V2 } from '../src'

describe('forwardPass', () => {
  it('Returns base in empty chain', () => {
    const bones: IBone[] = []
    const pivotTransform = { position: [0, 0] as V2, rotation: 0 }
    const endEffectorPosition = forwardPass(bones, pivotTransform).effectorPosition

    expect(endEffectorPosition).toEqual([0, 0])
  })

  it('Returns end effector position', () => {
    const bones: IBone[] = [{ joint: { angle: 0 }, length: 50 }]
    const pivotTransform = { position: [0, 0] as V2, rotation: 0 }
    const endEffectorPosition = forwardPass(bones, pivotTransform).effectorPosition

    expect(endEffectorPosition).toEqual([50, 0])
  })

  it('Returns end effector position after long chain', () => {
    const bones: IBone[] = [
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
    const bones: IBone[] = [{ joint: { angle: Math.PI / 2 }, length: 50 }]
    const pivotTransform = { position: [0, 0] as V2, rotation: 0 }
    const endEffectorPosition = forwardPass(bones, pivotTransform).effectorPosition

    expect(endEffectorPosition[0]).toBeCloseTo(0)
    expect(endEffectorPosition[1]).toBeCloseTo(50)
  })

  it('Returns end effector position chain with bends', () => {
    const bones: IBone[] = [
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
    const bones: IBone[] = []
    const pivotTransform = { position: [0, 0] as V2, rotation: 0 }
    const transforms = forwardPass(bones, pivotTransform).transforms

    expect(transforms.length).toBe(1)
    expect(transforms[0]).toStrictEqual({ position: [0, 0], rotation: 0 })
  })

  it('Returns absolute transforms for chain', () => {
    const bones: IBone[] = [
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
    const bones: IBone[] = [
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
    const bones: IBone[] = [
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
