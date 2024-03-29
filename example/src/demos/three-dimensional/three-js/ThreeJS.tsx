import { OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { MathUtils, QuaternionO, Solve3D, V3, V3O } from 'inverse-kinematics'
import React, { useEffect, useRef, useState } from 'react'
import { Object3D, Quaternion, Vector3 } from 'three'
import { useAnimationFrame } from '../../../hooks/useAnimationFrame'
import { Base } from '../components/Base'
import { JointTransforms } from '../components/JointTransforms'
import { Logger } from '../components/Logger'
import { Target } from '../components/Target'

function ThreeJS() {
  const [target, setTarget] = useState([500, 50, 0] as V3)
  const [links, setLinks] = useState<Solve3D.Link[]>([])
  const [base, setBase] = useState<Solve3D.JointTransform>({
    position: [0, 0, 0],
    rotation: QuaternionO.zeroRotation(),
  })
  const flattennedHierarchy = useRef<Object3D[] | undefined>(undefined)

  const parent = useRef<Object3D>()

  useEffect(() => {
    if (parent.current === undefined) return
    if (flattennedHierarchy.current !== undefined) return

    const hierarchy: Object3D[] = []

    const recurseAndAdd = (current: Object3D) => {
      hierarchy.push(current)
      if (current.children[0]) {
        recurseAndAdd(current.children[0])
      }
    }

    if (parent.current.children[0]) {
      recurseAndAdd(parent.current.children[0])
    }

    const links: Solve3D.Link[] = hierarchy.map((object) => ({
      rotation: QuaternionO.fromObject(object.quaternion),
      position: V3O.fromVector3(object.position),
    }))

    setLinks(links)
    setBase({
      position: V3O.fromVector3(parent.current.getWorldPosition(new Vector3())),
      rotation: QuaternionO.fromObject(parent.current.getWorldQuaternion(new Quaternion())),
    })
    flattennedHierarchy.current = hierarchy
  })

  useAnimationFrame(60, () => {
    if (!flattennedHierarchy.current) return
    const knownRangeOfMovement = links.reduce((acc, cur) => acc + V3O.euclideanLength(cur.position), 0)
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
      method: 'FABRIK',
    }).links

    links.forEach((_, index) => {
      const result = results[index]!
      links[index] = result
      const q = result.rotation!

      const object = flattennedHierarchy.current![index]!
      const length = object?.position.length()
      const position = V3O.rotate([length, 0, 0], q)
      object.position.set(...position)
      object.quaternion.set(...q)
    })
  })

  return (
    <div>
      <Canvas
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          backgroundColor: 'aquamarine',
        }}
        linear
      >
        <OrbitControls />
        <Base base={base} links={links} />
        <JointTransforms links={links} base={base} />
        <Target position={target} setPosition={setTarget} />

        <group position={[0, 0, 0]} ref={parent}>
          <mesh position={[2, 0, 0]}>
            <sphereBufferGeometry args={[0.3]} />
            <meshNormalMaterial wireframe />
            <mesh position={[2, 0, 0]}>
              <sphereBufferGeometry args={[0.3]} />
              <meshNormalMaterial wireframe />
              <mesh position={[2, 0, 0]}>
                <sphereBufferGeometry args={[0.3]} />
                <meshNormalMaterial wireframe />
              </mesh>
            </mesh>
          </mesh>
        </group>
      </Canvas>
      <Logger target={target} links={links} base={base} />
    </div>
  )
}

export default ThreeJS
