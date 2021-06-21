import { OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { MathUtils, Solve3D, V3 } from 'ik'
import React, { useRef, useState } from 'react'
import { useAnimationFrame } from '../../hooks/useAnimationFrame'
import { Base } from './components/Base'
import { JointTransforms } from './components/JointTransforms'
import { Logger } from './components/Logger'
import { Target } from './components/Target'

const shoulder: V3 = [0, 0, 0]

const shoulderToElbow: Solve3D.Link = {
  length: 80,
  constraints: { roll: 0, yaw: Math.PI, pitch: Math.PI * 1.1 },
}

const elbowToWrist: Solve3D.Link = {
  length: 100,
  constraints: { roll: Math.PI / 2, yaw: { min: -(5 * Math.PI) / 6, max: 0 }, pitch: 0 },
}

const wristToIndexTip: Solve3D.Link = {
  length: 30,
  constraints: { roll: 0, yaw: 0, pitch: (3 * Math.PI) / 2 },
}

const initialLinks: Solve3D.Link[] = [shoulderToElbow, elbowToWrist, wristToIndexTip]

const base: V3 = shoulder

function ThreeDimension() {
  const [target, setTarget] = useState([500, 50, 0] as V3)
  const linksRef = useRef(initialLinks)

  useAnimationFrame(60, () => {
    linksRef.current = Solve3D.solve(linksRef.current, base, target, {
      acceptedError: 10,
      learningRate,
    }).links
  })

  return (
    <div
      onClick={(event) => {
        const position = [
          event.clientX - window.innerWidth / 2,
          -event.clientY + window.innerHeight / 2,
          Math.random() * 100,
        ] as V3
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
        linear
      >
        <OrbitControls />
        <group scale={[0.005, 0.005, 0.005]}>
          <Base position={base} links={linksRef} />
          <JointTransforms links={linksRef} basePosition={base} />
          <Target position={target} />
        </group>
      </Canvas>
      <Logger target={target} links={linksRef} basePosition={base} />
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

export default ThreeDimension
