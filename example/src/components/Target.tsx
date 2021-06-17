import React from "react";
import { V2 } from "ik";

export const Target = ({ position }: { position: V2 }) => {
  return (
    <mesh scale={[50, 50, 1]} position={[...position, -1]}>
      <boxBufferGeometry />
      <meshBasicMaterial color={"hotpink"} />
    </mesh>
  );
};
