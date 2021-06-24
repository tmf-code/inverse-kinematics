import { V3 } from 'ik'
import React from 'react'

export const Target = ({ position }: { position: V3 }) => {
  return (
    <mesh position={[...position]}>
      <boxBufferGeometry />
      <meshBasicMaterial color={'hotpink'} />
    </mesh>
  )
}
