import { Canvas } from "@react-three/fiber";
import React, { useEffect, useState } from "react";
import "./App.css";
import { Base } from "./Base";
import { DebugForwardPass } from "./DebugForwardPass";
import { BoneSequence } from "./math/solver";
import { V2 } from "./math/v2";
import { Target } from "./Target";

const bones: BoneSequence = [
  { joint: { angle: 0 }, length: 2 },
  { joint: { angle: 1 }, length: 2 },
  { joint: { angle: 0 }, length: 2 },
  { joint: { angle: 3 }, length: 2 },
  { joint: { angle: 0.2 }, length: 2 },
  { joint: { angle: 0.4 }, length: 2 },
];

const basePosition: V2 = [0, 0];

function App() {
  const [targetPosition, setTargetPosition] = useState([500, 50] as V2);
  return (
    <div
      className="App"
      onClick={(event) => {
        const position = [
          event.clientX - window.innerWidth / 2,
          -event.clientY + window.innerHeight / 2,
        ] as V2;
        setTargetPosition(position);
      }}
    >
      <Canvas
        style={{ width: "100%", height: "100%", position: "absolute" }}
        orthographic
        linear
      >
        <Base
          position={basePosition}
          sequence={bones}
          target={targetPosition}
        />
        <DebugForwardPass bones={bones} basePosition={basePosition} />
        <Target position={targetPosition} />
      </Canvas>
    </div>
  );
}

export default App;
