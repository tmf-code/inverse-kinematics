import { useFrame } from '@react-three/fiber'
import { V2O } from 'inverse-kinematics'
import React, { useRef } from 'react'
import { Object3D } from 'three'

export function useCircularMotion(
  ref: React.MutableRefObject<Object3D | undefined | null>,
  radius: number,
  rate: number,
) {
  const angle = useRef(0)
  useFrame((_context, deltaTime) => {
    if (!ref.current) return
    const position = V2O.fromPolar(radius, angle.current)
    ref.current.position.x = position[0]
    ref.current.position.z = position[1]

    angle.current += deltaTime * rate
  })
}
