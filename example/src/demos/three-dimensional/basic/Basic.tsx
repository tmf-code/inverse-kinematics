import { OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { MathUtils, QuaternionO, Solve3D, V3 } from 'inverse-kinematics'
import { useControls } from 'leva'
import React, { useEffect, useState } from 'react'
import { useAnimationFrame } from '../../../hooks/useAnimationFrame'
import { Base } from '../components/Base'
import { JointTransforms } from '../components/JointTransforms'
import { Logger } from '../components/Logger'
import { Target } from '../components/Target'

const base: Solve3D.JointTransform = { position: [0, 0, 0], rotation: QuaternionO.zeroRotation() }

export default function Basic({ method }: { method: 'CCD' | 'FABRIK' }) {
  const [target, setTarget] = useState([500, 50, 0] as V3)
  const [links, setLinks] = useState<Solve3D.Link[]>([])

  const { linkCount, linkLength, linkMinAngle, linkMaxAngle } = useControls({
    linkCount: { value: 4, min: 0, max: 50, step: 1 },
    linkLength: { value: 1, min: 0.1, max: 2, step: 0.1 },
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
      method,
      learningRate: method === 'FABRIK' ? learningRate : 1,
      acceptedError: 0,
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
        <group>
          <Base base={base} links={links} />
          <JointTransforms links={links} base={base} />
          <Target position={target} setPosition={setTarget} />
        </group>
      </Canvas>
      <Logger target={target} links={links} base={base} />
    </div>
  )
}

const makeLinks = (linkCount: number, linkLength: number, linkMinAngle: number, linkMaxAngle: number): Solve3D.Link[] =>
  Array.from({ length: linkCount }).map(() => ({
    position: [linkLength, 0, 0],
    rotation: QuaternionO.zeroRotation(),
    // constraints: {
    //   pitch: { min: (linkMinAngle * Math.PI) / 180, max: (linkMaxAngle * Math.PI) / 180 },
    //   yaw: { min: (linkMinAngle * Math.PI) / 180, max: (linkMaxAngle * Math.PI) / 180 },
    //   roll: { min: (linkMinAngle * Math.PI) / 180, max: (linkMaxAngle * Math.PI) / 180 },
    // },
  }))
