import { V3 } from 'inverse-kinematics'
import React from 'react'

export const Target = ({ position }: { position: V3 }) => {
  return (
    <mesh scale={[50, 50, 1]} position={[...position]}>
      <boxBufferGeometry />
      <meshBasicMaterial color={'hotpink'} />
    </mesh>
  )
}
