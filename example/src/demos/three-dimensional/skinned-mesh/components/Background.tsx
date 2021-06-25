import React from 'react'
import { DoubleSide } from 'three'

export function Background() {
  return (
    <>
      <mesh scale={[100, 100, 1]} position={[0, 0, -100]}>
        <planeBufferGeometry></planeBufferGeometry>
        <meshNormalMaterial></meshNormalMaterial>
      </mesh>
      <mesh scale={[100, 100, 1]} position={[0, -50, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeBufferGeometry></planeBufferGeometry>
        <meshNormalMaterial side={DoubleSide}></meshNormalMaterial>
      </mesh>
    </>
  )
}
