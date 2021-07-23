import { Canvas } from '@react-three/fiber'
import { MathUtils, Solve2D, V2 } from 'inverse-kinematics'
import React, { useEffect, useRef, useState } from 'react'
import { useAnimationFrame } from '../../hooks/useAnimationFrame'
import { Base } from './components/Base'
import { JointTransforms } from './components/JointTransforms'
import { Logger } from './components/Logger'
import { Target } from './components/Target'
import { useControls } from 'leva'

const base: Solve2D.JointTransform = { position: [0, 0], rotation: 0 }

export default function TwoDimension({ method }: { method: 'CCD' | 'FABRIK' }) {
  const [target, setTarget] = useState([500, 50] as V2)
  const [links, setLinks] = useState<Solve2D.Link[]>([])

  const { linkCount, linkLength, linkMinAngle, linkMaxAngle } = useControls({
    linkCount: { value: 1, min: 0, max: 50, step: 1 },
    linkLength: { value: 200, min: 1, max: 200, step: 10 },
    linkMinAngle: { value: -90, min: -360, max: 0, step: 10 },
    linkMaxAngle: { value: 90, min: 0, max: 360, step: 10 },
  })

  useEffect(() => {
    setLinks(makeLinks(linkCount, linkLength, linkMinAngle, linkMaxAngle))
  }, [linkCount, linkLength, linkMinAngle, linkMaxAngle])

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
      learningRate: method === 'FABRIK' ? learningRate : 1,
      acceptedError: 10,
      method,
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

const makeLinks = (linkCount: number, linkLength: number, linkMinAngle: number, linkMaxAngle: number): Solve2D.Link[] =>
  Array.from({ length: linkCount }).map(() => ({
    position: [linkLength, 0],
    constraints: { min: (linkMinAngle * Math.PI) / 180, max: (linkMaxAngle * Math.PI) / 180 },
    rotation: 0,
  }))
