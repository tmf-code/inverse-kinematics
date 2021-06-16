import { useFrame } from "@react-three/fiber";
import React, { useMemo, useRef } from "react";
import { BoxBufferGeometry, Mesh, MeshNormalMaterial } from "three";
import { Bone } from "./Bone";
import { BoneSequence, IBone, solve } from "./math/solver";
import { V2 } from "./math/v2";
import { useAnimationFrame } from "./useAnimationFrame";

export const Base = ({
  position,
  sequence,
  target,
}: {
  sequence: BoneSequence;
  position: V2;
  target: V2;
}) => {
  const ref = useRef<Mesh<BoxBufferGeometry, MeshNormalMaterial>>();
  const chain = useMemo(() => makeChain(sequence), [sequence]);

  useFrame(() => {
    if (!ref.current) return;
    ref.current.position.set(...position, 0);
    solve(sequence, position, target);
  });

  return (
    <mesh ref={ref}>
      <boxBufferGeometry args={[50, 50]} />
      <meshNormalMaterial />
      <Bone {...chain} />
    </mesh>
  );
};

function makeChain(bones: BoneSequence): IBone {
  let chain: IBone | undefined;
  for (let index = bones.length - 1; index >= 0; index--) {
    const bone = { ...bones[index]! };

    // Is first element
    if (chain === undefined) {
      chain = bone;
      continue;
    }

    chain = { ...bone, child: chain };
  }

  if (chain === undefined) {
    throw new Error(`Did not construct chain from bones ${bones}`);
  }

  return chain;
}
