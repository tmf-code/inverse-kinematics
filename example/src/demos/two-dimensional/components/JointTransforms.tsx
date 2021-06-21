import { useFrame } from '@react-three/fiber'
import { Solve2D } from 'ik'
import React, { useMemo, useRef } from 'react'
import { Group } from 'three'

export const JointTransforms = ({
  links,
  base,
}: {
  links: { current: readonly Solve2D.Link[] }
  base: Solve2D.JointTransform
}) => {
  const ref = useRef<Group>()

  useFrame(() => {
    if (ref.current === undefined) return
    const { transforms } = Solve2D.getJointTransforms(links.current, base)
    for (let index = 0; index < ref.current.children.length; index++) {
      const child = ref.current.children[index]!
      const jointPosition = transforms[index]?.position
      if (jointPosition === undefined) {
        throw new Error(`No corresponding child position for index ${index}`)
      }
      child.position.set(...jointPosition, 100)
    }
  })

  const jointPositions = useMemo(
    () =>
      Array.from({ length: links.current.length + 1 }).map((_, index) => {
        return (
          <mesh key={index}>
            <boxBufferGeometry args={[12.5, 12.5]} />
            <meshBasicMaterial color={'red'} />
          </mesh>
        )
      }),
    [links.current.length],
  )
  return <group ref={ref}>{jointPositions}</group>
}
