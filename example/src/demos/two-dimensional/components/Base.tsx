import { useFrame } from '@react-three/fiber'
import { Solve2D, V2 } from 'ik'
import React, { useMemo, useRef } from 'react'
import { BoxBufferGeometry, Mesh, MeshNormalMaterial } from 'three'
import { Link, LinkProps } from './Link'

export const Base = ({ position, links, target }: { links: Solve2D.Link[]; position: V2; target: V2 }) => {
  const ref = useRef<Mesh<BoxBufferGeometry, MeshNormalMaterial>>()
  const adjustedLinksRef = useRef(links)
  const chain = useMemo(() => makeChain(links), [links])

  useFrame(() => {
    if (!ref.current) return
    ref.current.position.set(...position, 0)
    adjustedLinksRef.current = Solve2D.solve(links, position, target).links

    let depth = 0
    let child = chain

    while (child !== undefined && adjustedLinksRef.current[depth] !== undefined) {
      child.link.rotation = adjustedLinksRef.current[depth]!.rotation
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
    const link: LinkProps = { link: links[index]! }

    // Is first element
    if (chain === undefined) {
      chain = link
      continue
    }

    chain = { link: link.link, child: chain }
  }

  return chain
}
