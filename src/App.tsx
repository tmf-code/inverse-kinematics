import { Canvas } from "@react-three/fiber";
import React from "react";
import "./App.css";
import { Base } from "./Base";
import { V2 } from "./math/v2";

type AtLeastOneOf<T> = [T, ...T[]];
type BoneSequence = AtLeastOneOf<Omit<IBone, "child">>;

const bones: BoneSequence = [
  { joint: { angle: 0 }, length: 2 },
  { joint: { angle: 1 }, length: 2 },
  { joint: { angle: 2 }, length: 2 },
  { joint: { angle: 3 }, length: 2 },
  { joint: { angle: 0.2 }, length: 2 },
  { joint: { angle: 0.4 }, length: 2 },
];

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

const chain = makeChain(bones);

function App() {
  return (
    <div className="App">
      <Canvas
        style={{ width: "100%", height: "100%", position: "absolute" }}
        orthographic
        linear
      >
        <Base position={[0, 0]} child={chain} />
      </Canvas>
    </div>
  );
}

export interface IBase {
  position: V2;
  child: IBone;
}

export interface IBone {
  joint: IJoint;
  length: number;
  child?: IBone;
}

interface IJoint {
  angle: number;
}

export default App;
