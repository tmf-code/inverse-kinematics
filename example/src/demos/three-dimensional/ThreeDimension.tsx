import { OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { QuaternionO, Solve3D, V3 } from 'ik'
import React, { useState } from 'react'
import { Base } from './components/Base'
import { DebugForwardPass } from './components/DebugForwardPass'
import { Logger } from './components/Logger'
import { Target } from './components/Target'

const shoulder: V3 = [0, 0, 0]

const shoulderToElbow: Solve3D.Link = {
  length: 80,
  rotation: QuaternionO.zeroRotation(),
  constraints: { roll: 0, yaw: Math.PI, pitch: Math.PI * 1.1 },
}

const elbowToWrist: Solve3D.Link = {
  length: 100,
  rotation: QuaternionO.zeroRotation(),
  constraints: { roll: Math.PI / 2, yaw: { min: -(5 * Math.PI) / 6, max: 0 }, pitch: 0 },
}

const wristToIndexTip: Solve3D.Link = {
  length: 30,
  rotation: QuaternionO.zeroRotation(),
  constraints: { roll: 0, yaw: 0, pitch: (3 * Math.PI) / 2 },
}

const links: Solve3D.Link[] = [shoulderToElbow, elbowToWrist, wristToIndexTip]

const base: V3 = shoulder

function ThreeDimension() {
  const [target, setTarget] = useState([500, 50, 0] as V3)
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
          <Base position={base} links={links} target={target} />
          <DebugForwardPass links={links} basePosition={base} />
          <Target position={target} />
        </group>
      </Canvas>
      <Logger target={target} links={links} basePosition={base} />
    </div>
  )
}

export default ThreeDimension
