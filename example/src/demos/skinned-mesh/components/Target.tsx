import { useThree } from '@react-three/fiber'
import { V3, V3O } from 'inverse-kinematics'
import React, { useEffect } from 'react'
import { Vector3 } from 'three'

export const Target = ({ position, setPosition }: { position: V3; setPosition: (position: V3) => void }) => {
  const { camera } = useThree()
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const vec = new Vector3()
      const clickPosition = new Vector3()
      vec.set((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1, 0.5)
      vec.unproject(camera)
      vec.sub(camera.position).normalize()
      const distance = -camera.position.z / vec.z
      clickPosition.copy(camera.position).add(vec.multiplyScalar(distance))
      setPosition(V3O.fromVector3(clickPosition))
    }
    window.addEventListener('click', onClick)
    return () => {
      window.removeEventListener('click', onClick)
    }
  }, [])
  return (
    <mesh scale={[0.1, 0.1, 0.1]} position={[...position]}>
      <boxBufferGeometry />
      <meshBasicMaterial color={'hotpink'} />
    </mesh>
  )
}
