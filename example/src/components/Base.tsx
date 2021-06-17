import { useFrame } from '@react-three/fiber'
import React, { useMemo, useRef } from 'react'
import { BoxBufferGeometry, Mesh, MeshNormalMaterial } from 'three'
import { Bone, BoneProps } from './Bone'
import { Bone as IKBone, solve, V2 } from 'ik'
import { useAnimationFrame } from '../hooks/useAnimationFrame'

export const Base = ({ position, sequence, target }: { sequence: IKBone[]; position: V2; target: V2 }) => {
  const ref = useRef<Mesh<BoxBufferGeometry, MeshNormalMaterial>>()
  const chain = useMemo(() => makeChain(sequence), [sequence])

  useFrame(() => {
    if (!ref.current) return
    ref.current.position.set(...position, 0)
    solve(sequence, position, target)
  })

  return (
    <mesh ref={ref}>
      <boxBufferGeometry args={[50, 50]} />
      <meshNormalMaterial />
      {chain && <Bone {...chain} />}
    </mesh>
  )
}

function makeChain(bones: IKBone[]): BoneProps | undefined {
  let chain: BoneProps | undefined
  for (let index = bones.length - 1; index >= 0; index--) {
    const bone: BoneProps = { bone: bones[index]! }

    // Is first element
    if (chain === undefined) {
      chain = bone
      continue
    }

    chain = { bone: bone.bone, child: chain }
  }

  return chain
}
