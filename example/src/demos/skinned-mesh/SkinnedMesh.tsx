import { OrbitControls, useGLTF } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { MathUtils, Quaternion, QuaternionO, Solve3D, V3, V3O } from 'ik'
import React, { Suspense, useRef, useState } from 'react'
import { Bone, DoubleSide, MeshNormalMaterial, Skeleton, Vector3, Quaternion as ThreeQuaternion } from 'three'
import { useAnimationFrame } from '../../hooks/useAnimationFrame'
import { Base } from './components/Base'
import { Logger } from './components/Logger'
import { Target } from './components/Target'
import tubeSrc from './tube2.gltf?url'

function QFromThreeQ(q: ThreeQuaternion): Quaternion {
  return [q.w, q.x, q.y, q.z]
}

function SkinnedMesh() {
  const { nodes } = useGLTF(tubeSrc) as any
  // console.log(nodes)

  // get base from nodes
  const baseBone = nodes.Bone as Bone
  const base: Solve3D.JointTransform = {
    position: [0, 0, 0],
    rotation: QFromThreeQ(baseBone.quaternion),
  }
  // console.log(base)

  // get link bones from base
  const linkBones: Bone[] = []
  let currentBone = baseBone
  while (currentBone.children[0] !== undefined) {
    linkBones.push(currentBone.children[0] as Bone)
    currentBone = currentBone.children[0] as Bone
  }
  // console.log(linkBones)

  // get links from link bones
  const initialLinks: Solve3D.Link[] = linkBones.map((bone) => {
    const previousBonePosition = new Vector3()
    const currentBonePosition = new Vector3()
    bone.parent!.getWorldPosition(previousBonePosition)
    bone.getWorldPosition(currentBonePosition)
    return {
      length: V3O.euclideanDistance(V3O.fromVector3(previousBonePosition), V3O.fromVector3(currentBonePosition)),
      rotation: QFromThreeQ(bone.quaternion),
    }
  })
  // console.log(initialLinks)

  const [target, setTarget] = useState([500, 50, 0] as V3)
  const linksRef = useRef(initialLinks)

  useAnimationFrame(60, () => {
    linksRef.current = Solve3D.solve(linksRef.current, base, target, {
      acceptedError: 0.001,
      learningRate,
    }).links

    // update positions of link bones
    linkBones.map((bone, index) => {
      const quaternion = linksRef.current?.[index]?.rotation!
      bone.quaternion.set(quaternion[1], quaternion[2], quaternion[3], quaternion[0])
    })

    // nodes.Bone.rotation.x += -0.01
    // nodes.Bone.children[0].rotation.x += -0.01
    // nodes.Bone.children[0].children[0].rotation.x += -0.01
    // nodes.Bone.children[0].children[0].children[0].rotation.x += -0.01
  })

  return (
    <div>
      <Canvas
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          backgroundColor: 'purple',
        }}
        linear
      >
        <OrbitControls />
        <Suspense fallback={null}>
          <group dispose={null} scale={[1, 1, 1]}>
            <Base base={base} links={linksRef}></Base>
            <Target position={target} setPosition={setTarget} />

            <primitive object={nodes.Bone} rotation={[0, 0, Math.PI / 2]} />
            <skinnedMesh
              position={[0, 0, 0]}
              geometry={nodes.Cylinder.geometry}
              material={new MeshNormalMaterial()}
              skeleton={nodes.Cylinder.skeleton}
            />
          </group>
        </Suspense>
        <mesh scale={[100, 100, 1]} position={[0, 0, -100]}>
          <planeBufferGeometry></planeBufferGeometry>
          <meshNormalMaterial></meshNormalMaterial>
        </mesh>

        <mesh scale={[100, 100, 1]} position={[0, -50, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <planeBufferGeometry></planeBufferGeometry>
          <meshNormalMaterial side={DoubleSide}></meshNormalMaterial>
        </mesh>
      </Canvas>
      <Logger target={target} links={linksRef} base={base} />
    </div>
  )
}

const knownRangeOfMovement = 1
function learningRate(errorDistance: number): number {
  const relativeDistanceToTarget = MathUtils.clamp(errorDistance / knownRangeOfMovement, 0, 1)
  const cutoff = 0.1

  if (relativeDistanceToTarget > cutoff) {
    return 10e-3
  }

  // result is between 0 and 1
  const remainingDistance = relativeDistanceToTarget / 0.02
  const minimumLearningRate = 10e-4

  return minimumLearningRate + remainingDistance * 10e-5
}

export default SkinnedMesh
