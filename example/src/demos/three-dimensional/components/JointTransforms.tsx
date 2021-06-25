import { useFrame } from '@react-three/fiber'
import { Solve3D } from 'inverse-kinematics'
import React, { useMemo, useRef } from 'react'
import { Group } from 'three'

export const JointTransforms = ({ links, base }: { links: Solve3D.Link[]; base: Solve3D.JointTransform }) => {
  const ref = useRef<Group>()

  useFrame(() => {
    if (ref.current === undefined) return

    const { transforms } = Solve3D.getJointTransforms(links, base)
    for (let index = 0; index < ref.current.children.length; index++) {
      const child = ref.current.children[index]!
      const jointPosition = transforms[index]?.position
      if (jointPosition === undefined) {
        throw new Error(`No corresponding child position for index ${index}`)
      }
      child.position.set(...jointPosition)
    }
  })

  const jointTransforms = useMemo(
    () =>
      Array.from({ length: links.length + 1 }).map((_, index) => {
        return (
          <mesh key={index}>
            <boxBufferGeometry args={[0.1, 0.1, 0.1]} />
            <meshBasicMaterial color={'red'} />
          </mesh>
        )
      }),
    [links],
  )
  return <group ref={ref}>{jointTransforms}</group>
}
