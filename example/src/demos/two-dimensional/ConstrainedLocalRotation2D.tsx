import { Canvas } from '@react-three/fiber'
import { MathUtils, Solve2D, V2 } from 'inverse-kinematics'
import { useControls } from 'leva'
import React, { useEffect, useState } from 'react'
import { useAnimationFrame } from '../../hooks/useAnimationFrame'
import { Base } from './components/Base'
import { JointTransforms } from './components/JointTransforms'
import { Logger } from './components/Logger'
import { Target } from './components/Target'

const base: Solve2D.JointTransform = { position: [0, 0], rotation: 0 }

export default function ConstrainedLocalRotation2D() {
  const [target, setTarget] = useState([500, 50] as V2)
  const [links, setLinks] = useState<Solve2D.Link[]>([])

  const { linkCount, linkLength, endEffectorRotation } = useControls({
    linkCount: { value: 4, min: 0, max: 50, step: 1 },
    linkLength: { value: 200, min: 1, max: 200, step: 10 },
    endEffectorRotation: { value: 0, min: -180, max: 180, step: 5 },
  })

  useEffect(() => {
    setLinks(makeLinks(linkCount, linkLength, endEffectorRotation))
  }, [linkCount, linkLength, endEffectorRotation])

  useAnimationFrame(60, () => {
    const knownRangeOfMovement = linkCount * linkLength

    function learningRate(errorDistance: number): number {
      const relativeDistanceToTarget = MathUtils.clamp(errorDistance / knownRangeOfMovement, 0, 1)
      const cutoff = 0.1

      if (relativeDistanceToTarget > cutoff) {
        return 10e-6
      }

      // result is between 0 and 1
      const remainingDistance = relativeDistanceToTarget / 0.02
      const minimumLearningRate = 10e-7

      return minimumLearningRate + remainingDistance * 10e-7
    }

    const result = Solve2D.solve(links, base, target, {
      method: 'FABRIK',
      learningRate,
      acceptedError: 10,
    }).links

    links.forEach((_, index) => {
      links[index] = result[index]!
    })
  })

  return (
    <div
      onClick={({ clientX, clientY }) =>
        setTarget([clientX - window.innerWidth / 2, -clientY + window.innerHeight / 2])
      }
    >
      <Canvas
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          backgroundColor: 'aquamarine',
        }}
        orthographic
        linear
        camera={{ near: -1000 }}
      >
        <JointTransforms links={links} base={base} />
        <Base base={base} links={links} />
        <Target position={target} />
      </Canvas>
      <Logger target={target} links={links} base={base} />
    </div>
  )
}

const makeLinks = (linkCount: number, linkLength: number, endEffectorRotation: number): Solve2D.Link[] =>
  Array.from({ length: linkCount }).map((_, index) => {
    if (index === linkCount - 1) {
      return {
        position: [linkLength, 0],
        constraints: { value: (endEffectorRotation * Math.PI) / 180, type: 'local' },
        rotation: 0,
      }
    }
    return {
      position: [linkLength, 0],
      rotation: 0,
    }
  })
