import { Canvas } from '@react-three/fiber'
import { Solve2D, V2 } from 'ik'
import React, { useState } from 'react'
import { Base } from './components/Base'
import { DebugForwardPass } from './components/DebugForwardPass'
import { Logger } from './components/Logger'
import { Target } from './components/Target'

const links: Solve2D.Link[] = [
  { rotation: 0, length: 50 },
  { rotation: 0, constraint: Math.PI, length: 200 },
  { rotation: 0, constraint: Math.PI, length: 200 },
  { rotation: 0, constraint: Math.PI, length: 200 },
]

const base: V2 = [0, 0]

function TwoDimension() {
  const [target, setTarget] = useState([500, 50] as V2)
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
        <Base position={base} links={links} target={target} />
        <DebugForwardPass links={links} basePosition={base} />
        <Target position={target} />
      </Canvas>
      <Logger target={target} links={links} basePosition={base} />
    </div>
  )
}

export default TwoDimension
