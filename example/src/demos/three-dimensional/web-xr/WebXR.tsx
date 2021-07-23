import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { DefaultXRControllers, useController, VRCanvas } from '@react-three/xr'
import { MathUtils, QuaternionO, Solve3D, V3O } from 'inverse-kinematics'
import React, { Suspense, useRef, useState } from 'react'
import * as THREE from 'three'
import { Bone, MeshNormalMaterial, Vector3 } from 'three'
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader'
import { Base } from '../components/Base'
import { JointTransforms } from '../components/JointTransforms'
import modelSrc from './arm2.gltf?url'

type GLTFResult = GLTF & {
  nodes: {
    Cylinder: THREE.SkinnedMesh
    shoulder: THREE.Bone
  }
}

function WebXRExample() {
  return (
    <VRCanvas
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        backgroundColor: 'aquamarine',
      }}
      linear
    >
      <Scene />
    </VRCanvas>
  )
}

function Scene() {
  const { nodes } = useGLTF(modelSrc) as GLTFResult
  const modelRef = useRef<THREE.Group>()

  const [base] = useState<Solve3D.JointTransform>({ position: V3O.zero(), rotation: QuaternionO.zeroRotation() })
  const [debugLinks, setLinks] = useState<Solve3D.Link[]>([])

  const controller = useController('left')

  useFrame(() => {
    // Get base position
    const firstBone = modelRef.current?.children.find((child) => (child as Bone).isBone) as Bone | undefined
    if (!firstBone) return

    const basePosition = V3O.fromVector3(firstBone.getWorldPosition(new Vector3()))
    const baseTransform: Solve3D.JointTransform = {
      position: basePosition,
      rotation: QuaternionO.zeroRotation(),
    }

    base.position = baseTransform.position
    base.rotation = baseTransform.rotation

    const modelScale = V3O.fromVector3(modelRef.current!.getWorldScale(new Vector3()))
    const bones: Bone[] = getBones(firstBone)

    const links: Solve3D.Link[] = bones.map((bone, index, array) => {
      const nextBone = array[index + 1]
      const rotation = QuaternionO.fromObject(bone.quaternion)

      return {
        position: V3O.multiply(V3O.fromVector3(nextBone?.position ?? bone.position), modelScale),
        rotation: rotation,
      }
    })

    const knownRangeOfMovement = links.reduce((acc, cur) => acc + V3O.euclideanLength(cur.position), 0)

    if (controller) {
      const target = V3O.fromVector3(controller?.controller.getWorldPosition(new Vector3()))

      const results = Solve3D.solve(links, baseTransform, target, {
        learningRate: learningRate(knownRangeOfMovement),
        acceptedError: knownRangeOfMovement / 1000,
        method: 'FABRIK',
      }).links

      results.forEach((link, index, array) => {
        const bone = bones[index]!
        bone.quaternion.set(...link.rotation)
      })

      setLinks(results)
    }
  })

  return (
    <>
      <ambientLight />
      <DefaultXRControllers />
      <Base base={base} links={debugLinks} />
      <JointTransforms base={base} links={debugLinks} />
      <Suspense fallback={null}>
        <group dispose={null} scale={[0.2, 0.2, 0.2]} position={[-1, 1.5, -2]}>
          <group ref={modelRef} dispose={null}>
            <primitive object={nodes.shoulder} />
            <skinnedMesh
              geometry={nodes.Cylinder.geometry}
              material={new MeshNormalMaterial({ wireframe: true })}
              skeleton={nodes.Cylinder.skeleton}
            />
          </group>
        </group>
        <skeletonHelper args={[nodes.shoulder]} />
      </Suspense>
    </>
  )
}

export default WebXRExample

function getBones(firstBone: THREE.Bone) {
  let currentBone = firstBone
  const bones: Bone[] = [firstBone]
  while (currentBone.children[0] !== undefined) {
    bones.push(currentBone.children[0] as Bone)
    currentBone = currentBone.children[0] as Bone
  }
  return bones
}

useGLTF.preload(modelSrc)

function learningRate(totalLength: number): (errorDistance: number) => number {
  return (errorDistance: number) => {
    const relativeDistanceToTarget = MathUtils.clamp(errorDistance / totalLength, 0, 1)
    const cutoff = 0.1

    if (relativeDistanceToTarget > cutoff) {
      return 10e-4
    }

    const remainingDistance = relativeDistanceToTarget / 0.02
    const minimumLearningRate = 10e-5

    return minimumLearningRate + remainingDistance * 10e-5
  }
}
