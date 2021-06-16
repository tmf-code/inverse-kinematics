import { Canvas } from "@react-three/fiber";
import React from "react";
import "./App.css";
import { Base } from "./Base";
import { BoneSequence } from "./math/solver";
import { V2 } from "./math/v2";

const bones: BoneSequence = [
  { joint: { angle: 0 }, length: 2 },
  { joint: { angle: 1 }, length: 2 },
  { joint: { angle: 2 }, length: 2 },
  { joint: { angle: 3 }, length: 2 },
  { joint: { angle: 0.2 }, length: 2 },
  { joint: { angle: 0.4 }, length: 2 },
];

const base: V2 = [0, 0];

function App() {
  return (
    <div className="App">
      <Canvas
        style={{ width: "100%", height: "100%", position: "absolute" }}
        orthographic
        linear
      >
        <Base position={base} sequence={bones} />
      </Canvas>
    </div>
  );
}

export default App;
