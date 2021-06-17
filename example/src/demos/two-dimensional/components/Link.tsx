import { useFrame } from '@react-three/fiber'
import React, { useMemo, useRef } from 'react'
import {
  BoxBufferGeometry,
  BufferGeometry,
  Color,
  Group,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshNormalMaterial,
  Vector3,
} from 'three'

export interface LinkProps {
  link: { rotation: number; length: number }
  child?: LinkProps
}

export const Link = ({ link, child }: LinkProps) => {
  const rotationRef = useRef<Group>()
  const translationRef = useRef<Mesh<BoxBufferGeometry, MeshNormalMaterial>>()

  useFrame(() => {
    if (!rotationRef.current) return
    if (!translationRef.current) return
    rotationRef.current.rotation.set(0, 0, link.rotation)
    translationRef.current.position.set(link.length, 0, 0)
  })

  const line: Line = useMemo(() => {
    const points = [new Vector3(), new Vector3(link.length, 0, 0)]
    const geometry = new BufferGeometry().setFromPoints(points)
    const material = new LineBasicMaterial({ color: new Color('#8B008B') })

    return new Line(geometry, material)
  }, [link.length])

  return (
    <group ref={rotationRef}>
      <mesh ref={translationRef}>
        <sphereBufferGeometry args={[20, 100, 100]} />
        <meshNormalMaterial />
        {child && <Link {...child} />}
      </mesh>
      <primitive object={line} />
    </group>
  )
}
