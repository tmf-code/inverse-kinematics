import { useFrame } from '@react-three/fiber'
import { Solve3D, V3, MathUtils } from 'ik'
import React, { useMemo, useRef } from 'react'
import { BoxBufferGeometry, Mesh, MeshNormalMaterial } from 'three'
import { Link, LinkProps } from './Link'

export const Base = ({ position, links, target }: { links: readonly Solve3D.Link[]; position: V3; target: V3 }) => {
  const ref = useRef<Mesh<BoxBufferGeometry, MeshNormalMaterial>>()
  const adjustedLinksRef = useRef(links)
  const chain = useMemo(() => makeChain(links), [links])

  useFrame(() => {
    if (!ref.current) return
    ref.current.position.set(...position)
    adjustedLinksRef.current = Solve3D.solve(adjustedLinksRef.current, position, target, {
      acceptedError: 10,
      learningRate,
    }).links

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

function makeChain(links: readonly Solve3D.Link[]): LinkProps | undefined {
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

const knownRangeOfMovement = 230
function learningRate(errorDistance: number): number {
  const relativeDistanceToTarget = MathUtils.clamp(errorDistance / knownRangeOfMovement, 0, 1)
  const cutoff = 0.1

  if (relativeDistanceToTarget > cutoff) {
    return 10e-5
  }

  // result is between 0 and 1
  const remainingDistance = relativeDistanceToTarget / 0.02
  const minimumLearningRate = 10e-6

  return minimumLearningRate + remainingDistance * 10e-6
}
