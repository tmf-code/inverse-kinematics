import { useFrame } from '@react-three/fiber'
import { Quaternion } from 'ik'
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
  link: { rotation: Quaternion; length: number }
  child?: LinkProps
}

export const Link = ({ link, child }: LinkProps) => {
  const rotationRef = useRef<Group>()
  const translationRef = useRef<Mesh<BoxBufferGeometry, MeshNormalMaterial>>()

  useFrame(() => {
    if (!rotationRef.current) return
    if (!translationRef.current) return
    rotationRef.current.quaternion.set(link.rotation[1], link.rotation[2], link.rotation[3], link.rotation[0])
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
        <sphereBufferGeometry args={[20, 8, 8]} />
        <meshStandardMaterial transparent wireframe />
        {child && <Link {...child} />}
      </mesh>
      <primitive object={line} />
    </group>
  )
}
