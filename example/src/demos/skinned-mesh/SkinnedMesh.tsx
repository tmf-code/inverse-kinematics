import { OrbitControls, useGLTF } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { MathUtils, Quaternion, QuaternionO, Solve3D, V3, V3O } from 'ik'
import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Bone, Group, MeshNormalMaterial, Quaternion as ThreeQuaternion, SkinnedMesh, Vector3 } from 'three'
import { useAnimationFrame } from '../../hooks/useAnimationFrame'
import { Background } from './components/Background'
import { Base } from './components/Base'
import { JointTransforms } from './components/JointTransforms'
import { Logger } from './components/Logger'
import { Target } from './components/Target'
import tubeSrc from './tube.gltf?url'

function QFromThreeQ(q: ThreeQuaternion): Quaternion {
  return [q.w, q.x, q.y, q.z]
}
function ThreeQfromQ(q: Quaternion): ThreeQuaternion {
  return new ThreeQuaternion(q[1], q[2], q[3], q[0])
}
function getInitialLinks(linkBones: Bone[]): Solve3D.Link[] {
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
  return initialLinks
}

function SkinnedMeshExample() {
  const { nodes, materials } = useGLTF(tubeSrc) as unknown as {
    nodes: {
      Cylinder: SkinnedMesh
      Bone: Bone
    }
    materials: {}
  }

  const { base, linkBones } = useMemo(() => {
    // get base from nodes
    const baseBone = nodes.Bone as Bone
    const baseRotation: ThreeQuaternion = new ThreeQuaternion()
    baseBone.getWorldQuaternion(baseRotation)
    // console.log(baseRotation)

    const base: Solve3D.JointTransform = {
      position: [0, 0, 0],
      rotation: QFromThreeQ(baseRotation),
    }
    // get link bones from base
    let currentBone = baseBone
    const linkBones: Bone[] = [baseBone]
    while (currentBone.children[0] !== undefined) {
      linkBones.push(currentBone.children[0] as Bone)
      currentBone = currentBone.children[0] as Bone
    }
    return { base, linkBones }
  }, [nodes])

  useEffect(() => {
    ;(window as any).ref = meshRef
  })
  const linksRef = useRef<Solve3D.Link[]>(getInitialLinks(linkBones))
  const [target, setTarget] = useState([500, 50, 0] as V3)
  const meshRef = useRef<SkinnedMesh>()
  console.log(meshRef.current)
  console.log(linkBones.length)

  useAnimationFrame(60, () => {
    const links = getInitialLinks(linkBones)
    linksRef.current = links

    linksRef.current = Solve3D.solve(linksRef.current, base, target, {
      acceptedError: 0.001,
      learningRate,
    }).links

    // update positions of link bones
    linkBones.map((bone, index) => {
      const quaternion = linksRef.current?.[index]?.rotation!
      bone.quaternion.set(quaternion[1], quaternion[2], quaternion[3], quaternion[0])
    })
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
        <Background />
        <Suspense fallback={null}>
          <group dispose={null} scale={[1, 1, 1]}>
            <Base base={base} links={linksRef}></Base>
            <Target position={target} setPosition={setTarget} />
            <JointTransforms base={base} links={linksRef} />
            <group rotation={[0, Math.PI / 2, Math.PI / 2]}>
              <primitive object={nodes.Bone} />
              <skinnedMesh
                ref={meshRef}
                geometry={nodes.Cylinder.geometry}
                material={new MeshNormalMaterial()}
                skeleton={nodes.Cylinder.skeleton}
              ></skinnedMesh>
            </group>
          </group>
        </Suspense>
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

export default SkinnedMeshExample
