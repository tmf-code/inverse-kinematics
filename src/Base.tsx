import { useFrame } from "@react-three/fiber";
import React, { useRef } from "react";
import { BoxBufferGeometry, Mesh, MeshNormalMaterial } from "three";
import { Bone } from "./Bone";
import { IBase } from "./App";

export const Base = ({ position, child }: IBase) => {
  const ref = useRef<Mesh<BoxBufferGeometry, MeshNormalMaterial>>();

  useFrame(() => {
    if (!ref.current) return;
    ref.current.position.set(...position, 0);
  });

  return (
    <mesh ref={ref} scale={[50, 50, 1]}>
      <boxBufferGeometry />
      <meshNormalMaterial />
      <Bone {...child} />
    </mesh>
  );
};
