import { OrbitControls, useGLTF } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { MathUtils, QuaternionO, Solve3D, V3, V3O } from 'inverse-kinematics'
import React, { Suspense, useMemo, useRef, useState } from 'react'
import { Bone, MeshNormalMaterial, Quaternion as ThreeQuaternion, SkinnedMesh, Vector3 } from 'three'
import { useAnimationFrame } from '../../../hooks/useAnimationFrame'
import { JointTransforms } from '../components/JointTransforms'
import { Logger } from '../components/Logger'
import { Target } from '../components/Target'
import { Background } from './components/Background'
import tubeSrc from './tube.gltf?url'

function SkinnedMeshExample() {
  const { nodes } = useGLTF(tubeSrc) as unknown as {
    nodes: {
      Cylinder: SkinnedMesh
      Bone: Bone
    }
  }

  const { base, bones, links } = useMemo(() => {
    // get base from nodes
    const baseBone = nodes.Bone as Bone

    const base: Solve3D.JointTransform = {
      position: V3O.fromVector3(baseBone.getWorldPosition(new Vector3())),
      rotation: QuaternionO.fromObject(baseBone.getWorldQuaternion(new ThreeQuaternion())),
    }

    // get link bones from base
    let currentBone = baseBone
    const bones: Bone[] = [baseBone]
    while (currentBone.children[0] !== undefined) {
      bones.push(currentBone.children[0] as Bone)
      currentBone = currentBone.children[0] as Bone
    }

    const links: Solve3D.Link[] = bones.map((object, index, array) => {
      const nextBone = array[index + 1]?.getWorldPosition(new Vector3())

      if (nextBone) {
        const euclideanDistance = V3O.euclideanDistance(
          V3O.fromVector3(nextBone),
          V3O.fromVector3(object.getWorldPosition(new Vector3())),
        )

        return {
          rotation: QuaternionO.fromObject(object.quaternion),
          length: euclideanDistance,
        }
      }

      return {
        rotation: QuaternionO.fromObject(object.quaternion),
        length: 0.0,
      }
    })

    return { base, bones, links }
  }, [nodes])

  const [target, setTarget] = useState([500, 50, 0] as V3)
  const meshRef = useRef<SkinnedMesh>()

  useAnimationFrame(60, () => {
    const knownRangeOfMovement = links.reduce((acc, cur) => acc + cur.length, 0)
    function learningRate(errorDistance: number): number {
      const relativeDistanceToTarget = MathUtils.clamp(errorDistance / knownRangeOfMovement, 0, 1)
      const cutoff = 0.1

      if (relativeDistanceToTarget > cutoff) {
        return 10e-3
      }

      // result is between 0 and 1
      const remainingDistance = relativeDistanceToTarget / 0.02
      const minimumLearningRate = 10e-4

      return minimumLearningRate + remainingDistance * 10e-4
    }

    const results = Solve3D.solve(links, base, target, {
      learningRate,
      acceptedError: knownRangeOfMovement / 1000,
    }).links

    links.forEach((_, index) => {
      const result = results[index]!
      links[index] = result
      const rotation = result.rotation!

      const object = bones![index]!
      object.quaternion.set(...rotation)
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
            {/* <Base base={base} links={links}></Base> */}
            <Target position={target} setPosition={setTarget} />
            <JointTransforms base={base} links={links} />
            <group rotation={[Math.PI / 2, Math.PI / 2, 0]}>
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
      <Logger target={target} links={links} base={base} />
    </div>
  )
}

export default SkinnedMeshExample
