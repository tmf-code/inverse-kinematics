import { GizmoHelper, GizmoViewport, OrbitControls, useGLTF } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { MathUtils, QuaternionO, Solve3D, V3O } from 'inverse-kinematics'
import React, { Suspense, useRef, useState } from 'react'
import { Bone, Group, MeshNormalMaterial, Vector3 } from 'three'
import { OrbitControls as ThreeOrbitControls } from 'three-stdlib'
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader'
import { Base } from '../components/Base'
import { JointTransforms } from '../components/JointTransforms'
import { Target } from '../components/Target'
import modelSrc from './arm2.gltf?url'

function SkinnedMeshExample() {
  return (
    <Canvas
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        backgroundColor: 'purple',
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
  const modelRef = useRef<Group>()

  const [target, setTarget] = useState(V3O.zero())
  const [base] = useState<Solve3D.JointTransform>({ position: V3O.zero(), rotation: QuaternionO.zeroRotation() })
  const [debugLinks, setLinks] = useState<Solve3D.Link[]>([])

  const controlsRef = useRef<ThreeOrbitControls>(null)

  useFrame(() => {
    const firstBone = modelRef.current?.children.find((child) => (child as Bone).isBone) as Bone | undefined
    if (!firstBone) return

    const basePosition = V3O.fromVector3(firstBone.position)
    const baseTransform: Solve3D.JointTransform = {
      position: basePosition,
      rotation: QuaternionO.zeroRotation(),
    }

    base.position = baseTransform.position
    base.rotation = baseTransform.rotation

    const bones: Bone[] = getBones(firstBone)

    const links: Solve3D.Link[] = bones.map((bone, index, array) => {
      const nextBone = array[index + 1]
      const rotation = QuaternionO.fromObject(bone.quaternion)

      return {
        position: V3O.fromVector3(nextBone?.position ?? bone.position),
        rotation: rotation,
      }
    })

    const knownRangeOfMovement = links.reduce((acc, cur) => acc + V3O.euclideanLength(cur.position), 0)
    function learningRate(errorDistance: number): number {
      const relativeDistanceToTarget = MathUtils.clamp(errorDistance / knownRangeOfMovement, 0, 1)
      const cutoff = 0.1

      if (relativeDistanceToTarget > cutoff) {
        return 10e-4
      }

      const remainingDistance = relativeDistanceToTarget / 0.02
      const minimumLearningRate = 10e-5

      return minimumLearningRate + remainingDistance * 10e-5
    }

    const results = Solve3D.solve(links, baseTransform, target, {
      learningRate,
      acceptedError: knownRangeOfMovement / 1000,
    }).links

    results.forEach((link, index, array) => {
      const bone = bones[index]!
      bone.quaternion.set(...link.rotation)
    })

    setLinks(results)
  })

  return (
    <>
      <OrbitControls ref={controlsRef} />
      <Target position={target} setPosition={setTarget} />

      <Base base={base} links={debugLinks}></Base>
      <JointTransforms base={base} links={debugLinks} />
      <group ref={modelRef} dispose={null}>
        <primitive object={nodes.shoulder} />
        <skinnedMesh
          geometry={nodes.Cylinder.geometry}
          material={new MeshNormalMaterial()}
          skeleton={nodes.Cylinder.skeleton}
        ></skinnedMesh>
      </group>
      <skeletonHelper args={[nodes.shoulder]} />

      <GizmoHelper
        alignment={'bottom-right'}
        margin={[80, 80]}
        onTarget={() => controlsRef?.current?.target as Vector3}
        onUpdate={() => controlsRef.current?.update!()}
      >
        <GizmoViewport axisColors={['red', 'green', 'blue']} labelColor={'black'} />
      </GizmoHelper>
    </>
  )
}

export default SkinnedMeshExample

function getBones(firstBone: Bone) {
  let currentBone = firstBone
  const bones: Bone[] = [firstBone]
  while (currentBone.children[0] !== undefined) {
    bones.push(currentBone.children[0] as Bone)
    currentBone = currentBone.children[0] as Bone
  }
  return bones
}

type GLTFResult = GLTF & {
  nodes: {
    Cylinder: THREE.SkinnedMesh
    shoulder: THREE.Bone
  }
}

useGLTF.preload(modelSrc)
