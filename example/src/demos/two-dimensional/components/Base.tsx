import { useFrame } from '@react-three/fiber'
import { Solve2D, V2 } from 'ik'
import React, { useMemo, useRef } from 'react'
import { BoxBufferGeometry, Mesh, MeshNormalMaterial } from 'three'
import { Link, LinkProps } from './Link'

export const Base = ({ base: base, links }: { links: Solve2D.Link[]; base: Solve2D.JointTransform }) => {
  const ref = useRef<Mesh<BoxBufferGeometry, MeshNormalMaterial>>()
  const chain = useMemo(() => makeChain(links), [links])

  useFrame(() => {
    if (!ref.current) return
    ref.current.position.set(...base.position, 0)
    ref.current.rotation.set(0, 0, base.rotation)

    let depth = 0
    let child = chain

    while (child !== undefined && links[depth] !== undefined) {
      child.link.rotation = links[depth]!.rotation ?? 0
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

function makeChain(links: Solve2D.Link[]): LinkProps | undefined {
  let chain: LinkProps | undefined
  for (let index = links.length - 1; index >= 0; index--) {
    const link: LinkProps = { link: { ...links[index]!, rotation: links[index]!.rotation ?? 0 } }

    // Is first element
    if (chain === undefined) {
      chain = link
      continue
    }

    chain = { link: link.link, child: chain }
  }

  return chain
}
