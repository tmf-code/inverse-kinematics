import { OrbitControls, useGLTF } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { MathUtils, QuaternionO, Solve3D, V3, V3O } from 'inverse-kinematics'
import React, { Suspense, useRef, useState } from 'react'
import * as THREE from 'three'
import { Bone, MeshNormalMaterial, Vector3 } from 'three'
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader'
import { Base } from '../components/Base'
import { JointTransforms } from '../components/JointTransforms'
import { Target } from '../components/Target'
import { useCircularMotion } from '../moving-ends/useCircularMotion'
import modelSrc from './arm2.gltf?url'

type GLTFResult = GLTF & {
  nodes: {
    Cylinder: THREE.SkinnedMesh
    shoulder: THREE.Bone
  }
}

function MovingBaseExample() {
  return (
    <Canvas
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        backgroundColor: 'aquamarine',
      }}
      linear
    >
      <Suspense fallback={null}>
        <Scene />
      </Suspense>
    </Canvas>
  )
}

function Scene() {
  const { nodes } = useGLTF(modelSrc) as GLTFResult
  const modelRef = useRef<THREE.Group>()

  const [base] = useState<Solve3D.JointTransform>({ position: V3O.zero(), rotation: QuaternionO.zeroRotation() })
  const [debugLinks, setLinks] = useState<Solve3D.Link[]>([])
  const [target, setTarget] = useState<V3>([0, 0, 0])

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
        constraints: {
          roll: { min: -Math.PI / 4, max: Math.PI / 4 },
          pitch: { min: -Math.PI / 4, max: Math.PI / 4 },
          yaw: { min: -Math.PI / 4, max: Math.PI / 4 },
        },
      }
    })

    const knownRangeOfMovement = links.reduce((acc, cur) => acc + V3O.euclideanLength(cur.position), 0)

    const results = Solve3D.solve(links, baseTransform, target, {
      method: 'FABRIK',
      learningRate: learningRate(knownRangeOfMovement),
      acceptedError: knownRangeOfMovement / 100,
    }).links

    results.forEach((link, index, array) => {
      const bone = bones[index]!
      bone.quaternion.set(...link.rotation)
    })

    setLinks(results)
  })

  useCircularMotion(modelRef, 5, 1 / 3)

  return (
    <>
      <Target setPosition={setTarget} position={target} />
      <OrbitControls />
      <Base base={base} links={debugLinks} />
      <JointTransforms base={base} links={debugLinks} />

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
    </>
  )
}

export default MovingBaseExample

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
      return 10e-3
    }

    const remainingDistance = relativeDistanceToTarget / 0.02
    const minimumLearningRate = 10e-4

    return minimumLearningRate + remainingDistance * 10e-4
  }
}
