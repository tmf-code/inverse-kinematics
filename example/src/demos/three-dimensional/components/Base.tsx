import { useFrame } from '@react-three/fiber'
import { Solve3D, V3, MathUtils, QuaternionO } from 'ik'
import React, { useMemo, useRef } from 'react'
import { BoxBufferGeometry, Mesh, MeshNormalMaterial } from 'three'
import { Link, LinkProps } from './Link'

export const Base = ({ position, links }: { links: { current: readonly Solve3D.Link[] }; position: V3 }) => {
  const ref = useRef<Mesh<BoxBufferGeometry, MeshNormalMaterial>>()
  const chain = useMemo(() => makeChain(links.current), [links.current.length])

  useFrame(() => {
    if (!ref.current) return
    ref.current.position.set(...position)

    let depth = 0
    let child = chain

    while (child !== undefined && links.current[depth] !== undefined) {
      child.link.rotation = links.current[depth]!.rotation ?? QuaternionO.zeroRotation()
      depth++
      child = child.child
    }
  })

  return (
    <mesh ref={ref}>
      <boxBufferGeometry args={[50, 50]} />
      <meshNormalMaterial />
      {chain && <Link {...chain} />}
    </mesh>
  )
}

function makeChain(links: readonly Solve3D.Link[]): LinkProps | undefined {
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
