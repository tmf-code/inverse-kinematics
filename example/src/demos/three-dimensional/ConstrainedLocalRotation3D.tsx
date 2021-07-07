import { Canvas } from '@react-three/fiber'
import { MathUtils, QuaternionO, Solve3D, V2, V3 } from 'inverse-kinematics'
import React, { useEffect, useRef, useState } from 'react'
import { useAnimationFrame } from '../../hooks/useAnimationFrame'
import { Base } from './components/Base'
import { JointTransforms } from './components/JointTransforms'
import { Logger } from './components/Logger'
import { Target } from './components/Target'
import { useControls } from 'leva'
import { OrbitControls } from '@react-three/drei'

const base: Solve3D.JointTransform = { position: [0, 0, 0], rotation: QuaternionO.zeroRotation() }

export default function ConstrainedLocalRotation3D() {
  const [target, setTarget] = useState([500, 50, 0] as V3)
  const [links, setLinks] = useState<Solve3D.Link[]>([])

  const { linkCount, linkLength, endEffectorRotation } = useControls({
    linkCount: { value: 4, min: 0, max: 50, step: 1 },
    linkLength: { value: 1, min: 0.1, max: 2, step: 0.1 },
    endEffectorRotation: { value: 0, min: -180, max: 180, step: 5 },
  })

  useEffect(() => {
    setLinks(makeLinks(linkCount, linkLength, endEffectorRotation))
  }, [linkCount, linkLength, endEffectorRotation])

  useAnimationFrame(60, () => {
    const knownRangeOfMovement = linkCount * linkLength

    function learningRate(errorDistance: number): number {
      const relativeDistanceToTarget = MathUtils.clamp(errorDistance / knownRangeOfMovement, 0, 1)
      const cutoff = 0.5

      if (relativeDistanceToTarget > cutoff) {
        return 10e-3
      }

      // result is between 0 and 1
      const remainingDistance = relativeDistanceToTarget / 0.02
      const minimumLearningRate = 10e-4

      return (minimumLearningRate + remainingDistance * 10e-4) / knownRangeOfMovement
    }

    const result = Solve3D.solve(links, base, target, {
      learningRate,
      acceptedError: 0.1,
    }).links

    links.forEach((_, index) => {
      links[index] = result[index]!
    })
  })

  return (
    <div>
      <Canvas
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          backgroundColor: 'aquamarine',
        }}
        linear
      >
        <OrbitControls />
        <JointTransforms links={links} base={base} />
        <Base base={base} links={links} />
        <Target position={target} setPosition={setTarget} />
      </Canvas>
      <Logger target={target} links={links} base={base} />
    </div>
  )
}

const makeLinks = (linkCount: number, linkLength: number, endEffectorRotation: number): Solve3D.Link[] =>
  Array.from({ length: linkCount }).map((_, index) => {
    if (index === linkCount - 1) {
      return {
        length: linkLength,
        constraints: {
          value: QuaternionO.fromEulerAngles([0, 0, (endEffectorRotation * Math.PI) / 180]),
          type: 'local',
        },
        rotation: QuaternionO.zeroRotation(),
      }
    }
    return {
      length: linkLength,
      rotation: QuaternionO.zeroRotation(),
    }
  })
