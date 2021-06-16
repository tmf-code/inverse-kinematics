import { Canvas } from "@react-three/fiber";
import React, { useState } from "react";
import { Base } from "./components/Base";
import { DebugForwardPass } from "./components/DebugForwardPass";
import { IBone } from "./math/solver";
import { V2 } from "./math/v2";
import { Target } from "./components/Target";
import { Logger } from "./Logger";

const bones: IBone[] = [
  { joint: { angle: 0 }, length: 50 },
  { joint: { angle: 0, constraint: Math.PI }, length: 200 },
  { joint: { angle: 0, constraint: Math.PI }, length: 200 },
  { joint: { angle: 0, constraint: Math.PI }, length: 200 },
];

const basePosition: V2 = [0, 0];

function App() {
  const [targetPosition, setTargetPosition] = useState([500, 50] as V2);
  return (
    <div
      onClick={(event) => {
        const position = [
          event.clientX - window.innerWidth / 2,
          -event.clientY + window.innerHeight / 2,
        ] as V2;
        setTargetPosition(position);
      }}
    >
      <Canvas
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
          backgroundColor: "aquamarine",
        }}
        orthographic
        linear
        camera={{ near: -1000 }}
      >
        <Base
          position={basePosition}
          sequence={bones}
          target={targetPosition}
        />
        <DebugForwardPass bones={bones} basePosition={basePosition} />
        <Target position={targetPosition} />
      </Canvas>
      <Logger
        target={targetPosition}
        bones={bones}
        basePosition={basePosition}
      />
    </div>
  );
}

export default App;
