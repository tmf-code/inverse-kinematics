import { Canvas } from '@react-three/fiber'
import { MathUtils, Solve2D, V2 } from 'ik'
import React, { useRef, useState } from 'react'
import { useAnimationFrame } from '../../hooks/useAnimationFrame'
import { Base } from './components/Base'
import { JointTransforms } from './components/JointTransforms'
import { Logger } from './components/Logger'
import { Target } from './components/Target'

const initialLinks: Solve2D.Link[] = [
  { length: 50 },
  { constraint: { min: 0, max: Math.PI / 2 }, length: 200 },
  { constraint: { min: 0, max: Math.PI / 2 }, length: 200 },
  { constraint: { min: 0, max: Math.PI / 2 }, length: 200 },
]

const base: V2 = [0, 0]

function TwoDimension() {
  const [target, setTarget] = useState([500, 50] as V2)
  const linksRef = useRef(initialLinks)

  useAnimationFrame(60, () => {
    linksRef.current = Solve2D.solve(linksRef.current, base, target, {
      learningRate,
      acceptedError: 10,
    }).links
  })

  return (
    <div
      onClick={(event) => {
        const position = [event.clientX - window.innerWidth / 2, -event.clientY + window.innerHeight / 2] as V2
        setTarget(position)
      }}
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
        <JointTransforms links={linksRef} position={base} />
        <Base position={base} links={linksRef} />
        <Target position={target} />
      </Canvas>
      <Logger target={target} links={initialLinks} basePosition={base} />
    </div>
  )
}

const knownRangeOfMovement = 230
function learningRate(errorDistance: number): number {
  const relativeDistanceToTarget = MathUtils.clamp(errorDistance / knownRangeOfMovement, 0, 1)
  const cutoff = 0.1

  if (relativeDistanceToTarget > cutoff) {
    return 10e-5
  }

  // result is between 0 and 1
  const remainingDistance = relativeDistanceToTarget / 0.02
  const minimumLearningRate = 10e-6

  return minimumLearningRate + remainingDistance * 10e-6
}

export default TwoDimension
