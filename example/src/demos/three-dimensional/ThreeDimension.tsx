import { OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { QuaternionO, Solve3D, V3 } from 'ik'
import React, { useState } from 'react'
import { Base } from './components/Base'
import { DebugForwardPass } from './components/DebugForwardPass'
import { Logger } from './components/Logger'
import { Target } from './components/Target'

const links: Solve3D.Link[] = [
  { rotation: QuaternionO.zeroRotation(), length: 50 },
  { rotation: QuaternionO.fromEulerAngles([0, 0, Math.PI / 2]), constraint: Math.PI, length: 200 },
  { rotation: QuaternionO.zeroRotation(), constraint: Math.PI, length: 200 },
  { rotation: QuaternionO.zeroRotation(), constraint: Math.PI, length: 200 },
]

const base: V3 = [0, 0, 0]

function ThreeDimension() {
  const [target, setTarget] = useState([500, 50, 0] as V3)
  return (
    <div
      onClick={(event) => {
        const position = [event.clientX - window.innerWidth / 2, -event.clientY + window.innerHeight / 2, 0] as V3
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
          <Base position={base} sequence={links} target={target} />
          <DebugForwardPass links={links} basePosition={base} />
          <Target position={target} />
        </group>
      </Canvas>
      <Logger target={target} links={links} basePosition={base} />
    </div>
  )
}

export default ThreeDimension
