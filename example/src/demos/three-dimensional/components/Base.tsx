import { useFrame } from '@react-three/fiber'
import { Solve3D, V3 } from 'ik'
import React, { useMemo, useRef } from 'react'
import { BoxBufferGeometry, Mesh, MeshNormalMaterial } from 'three'
import { clamp } from 'three/src/math/MathUtils'
import { Link, LinkProps } from './Link'

export const Base = ({ position, sequence, target }: { sequence: Solve3D.Link[]; position: V3; target: V3 }) => {
  const ref = useRef<Mesh<BoxBufferGeometry, MeshNormalMaterial>>()
  const chain = useMemo(() => makeChain(sequence), [sequence])

  useFrame(() => {
    if (!ref.current) return
    ref.current.position.set(...position)
    Solve3D.solve(sequence, position, target, {
      acceptedError: 10,
      learningRate,
    })
  })

  return (
    <mesh ref={ref}>
      <boxBufferGeometry args={[50, 50]} />
      <meshNormalMaterial />
      {chain && <Link {...chain} />}
    </mesh>
  )
}

function makeChain(links: Solve3D.Link[]): LinkProps | undefined {
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
  const relativeDistanceToTarget = clamp(errorDistance / knownRangeOfMovement, 0, 1)
  const cutoff = 0.1

  if (relativeDistanceToTarget > cutoff) {
    return 10e-5
  }

  // result is between 0 and 1
  const remainingDistance = relativeDistanceToTarget / 0.02
  const minimumLearningRate = 10e-6

  return minimumLearningRate + remainingDistance * 10e-6
}
