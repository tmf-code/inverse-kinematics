import { useFrame } from "@react-three/fiber";
import React, { useRef } from "react";
import { Group } from "three";
import { IBone, forwardPass } from "src/math/solver";
import { V2 } from "src/math/v2";

export const DebugForwardPass = ({
  bones,
  basePosition,
}: {
  bones: IBone[];
  basePosition: V2;
}) => {
  const ref = useRef<Group>();

  useFrame(() => {
    if (ref.current === undefined) return;
    const jointPositions = forwardPass(bones, basePosition).absolutePositions;
    for (let index = 0; index < ref.current.children.length; index++) {
      const child = ref.current.children[index]!;
      const jointPosition = jointPositions[index];
      if (jointPosition === undefined) {
        throw new Error(`No corresponding child position for index ${index}`);
      }
      child.position.set(...jointPosition, 100);
    }
  });

  return (
    <group ref={ref}>
      {Array.from({ length: bones.length + 1 }).map((_, index) => {
        return (
          <mesh key={index}>
            <boxBufferGeometry args={[12.5, 12.5]} />
            <meshBasicMaterial color={"red"} />
          </mesh>
        );
      })}
    </group>
  );
};
