import React from "react";
import { V2 } from "./math/v2";

export const Target = ({ position }: { position: V2 }) => {
  return (
    <mesh scale={[50, 50, 1]} position={[...position, 0]}>
      <boxBufferGeometry />
      <meshBasicMaterial color={"hotpink"} />
    </mesh>
  );
};
