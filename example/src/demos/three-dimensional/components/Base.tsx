import { useFrame } from '@react-three/fiber'
import { QuaternionO, Solve3D } from 'inverse-kinematics'
import React, { useMemo, useRef } from 'react'
import { BoxBufferGeometry, Mesh, MeshNormalMaterial } from 'three'
import { Link, LinkProps } from './Link'

export const Base = ({ base: base, links }: { links: Solve3D.Link[]; base: Solve3D.JointTransform }) => {
  const ref = useRef<Mesh<BoxBufferGeometry, MeshNormalMaterial>>()
  const chain = useMemo(() => makeChain(links), [links])

  useFrame(() => {
    if (!ref.current) return
    ref.current.position.set(...base.position)
    ref.current.quaternion.set(...base.rotation)

    let depth = 0
    let child = chain

    while (child !== undefined && links[depth] !== undefined) {
      child.link.rotation = links[depth]!.rotation ?? QuaternionO.zeroRotation()
      depth++
      child = child.child
    }
  })

  return (
    <mesh ref={ref}>
      <boxBufferGeometry args={[0.3, 0.3, 0.01]} />
      <meshNormalMaterial />
      {chain && <Link {...chain} />}
    </mesh>
  )
}

function makeChain(links: Solve3D.Link[]): LinkProps | undefined {
  let chain: LinkProps | undefined
  for (let index = links.length - 1; index >= 0; index--) {
    const link: LinkProps = {
      link: { ...links[index]!, rotation: links[index]!.rotation ?? QuaternionO.zeroRotation() },
    }

    // Is first element
    if (chain === undefined) {
      chain = link
      continue
    }

    chain = { link: link.link, child: chain }
  }

  return chain
}
