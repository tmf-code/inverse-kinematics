import { useFrame } from '@react-three/fiber'
import { Quaternion, V3 } from 'inverse-kinematics'
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
  link: { rotation: Quaternion; position: V3 }
  child?: LinkProps
}

export const Link = ({ link, child }: LinkProps) => {
  const rotationRef = useRef<Group>()
  const translationRef = useRef<Mesh<BoxBufferGeometry, MeshNormalMaterial>>()

  useFrame(() => {
    if (!rotationRef.current) return
    if (!translationRef.current) return
    rotationRef.current.quaternion.set(link.rotation[1], link.rotation[2], link.rotation[3], link.rotation[0])
    translationRef.current.position.set(...link.position)
  })

  const line: Line = useMemo(() => {
    const points = [new Vector3(), new Vector3(...link.position)]
    const geometry = new BufferGeometry().setFromPoints(points)
    const material = new LineBasicMaterial({ color: new Color('#8B008B') })

    return new Line(geometry, material)
  }, [link])

  return (
    <group ref={rotationRef}>
      <mesh ref={translationRef}>
        <sphereBufferGeometry args={[0.125, 8, 8]} />
        <meshStandardMaterial transparent wireframe />
        {child && <Link {...child} />}
      </mesh>
      <primitive object={line} />
    </group>
  )
}
