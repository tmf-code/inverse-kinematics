import { useFrame } from "@react-three/fiber";
import React, { useRef } from "react";
import { Group } from "three";
import { BoneSequence, forwardPass } from "./math/solver";
import { V2 } from "./math/v2";

export const DebugForwardPass = ({
  bones, basePosition,
}: {
  bones: BoneSequence;
  basePosition: V2;
}) => {
  const ref = useRef<Group>();

  useFrame(() => {
    if (ref.current === undefined)
      return;
    const jointPositions = forwardPass(bones, basePosition);
    for (let index = 0; index < ref.current.children.length; index++) {
      const child = ref.current.children[index]!;
      const jointPosition = jointPositions[index];
      if (jointPosition === undefined) {
        throw new Error(`No corresponding child position for index ${index}`);
      }
      child.position.set(...jointPosition, 0);
    }
  });

  return (
    <group ref={ref} scale={[50, 50, 1]}>
      {Array.from({ length: bones.length + 1 }).map(() => {
        return (
          <mesh>
            <boxBufferGeometry args={[0.25, 0.25]} />
            <meshBasicMaterial color={"red"} />
          </mesh>
        );
      })}
    </group>
  );
};
