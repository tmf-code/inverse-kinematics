import { Canvas } from "@react-three/fiber";
import React, { DependencyList, useEffect, useRef, useState } from "react";
import "./App.css";
import { Base } from "./Base";
import { DebugForwardPass } from "./DebugForwardPass";
import { BoneSequence, distanceToTarget } from "./math/solver";
import { V2 } from "./math/v2";
import { Target } from "./Target";

const bones: BoneSequence = [
  { joint: { angle: 0 }, length: 50 },
  { joint: { angle: 0, constraint: Math.PI / 3 }, length: 50 },
  { joint: { angle: 0, constraint: Math.PI / 3 }, length: 50 },
  { joint: { angle: 0, constraint: Math.PI / 3 }, length: 50 },
  { joint: { angle: 0, constraint: Math.PI / 3 }, length: 50 },
  { joint: { angle: 0, constraint: Math.PI / 3 }, length: 50 },
  { joint: { angle: 0, constraint: Math.PI / 3 }, length: 50 },
  { joint: { angle: 0, constraint: Math.PI / 3 }, length: 50 },
  { joint: { angle: 0, constraint: Math.PI / 3 }, length: 50 },
  { joint: { angle: 0, constraint: Math.PI / 3 }, length: 50 },

  // { joint: { angle: 0 }, length: 200 },
  // { joint: { angle: 3 }, length: 2 },
  // { joint: { angle: 0.2 }, length: 2 },
  // { joint: { angle: 0.4 }, length: 2 },
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

const Logger = ({
  target,
  bones,
  basePosition,
}: {
  target: V2;
  bones: BoneSequence;
  basePosition: V2;
}) => {
  const distanceRef = useRef<HTMLTableCellElement>(null);

  useAnimationFrame(() => {
    if (!distanceRef.current) return;
    distanceRef.current.innerText = distanceToTarget(
      bones,
      basePosition,
      target
    ).toFixed(3);
  }, [target]);

  return (
    <div style={{ position: "absolute", top: 0, left: 0, userSelect: "none" }}>
      <table>
        <tbody>
          <tr>
            <td>Distance</td>
            <td ref={distanceRef}></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

const useAnimationFrame = (
  callback: ({
    time,
    delta: deltaTime,
  }: {
    time: number;
    delta: number;
  }) => void,
  dependencies: DependencyList
): void => {
  const frame = useRef<number>();
  const last = useRef(performance.now());
  const init = useRef(performance.now());

  const animate = () => {
    const now = performance.now();
    const time = (now - init.current) / 1000;
    const delta = (now - last.current) / 1000;
    callback({ time, delta });
    last.current = now;
    frame.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    frame.current = requestAnimationFrame(animate);
    return () => {
      frame.current && cancelAnimationFrame(frame.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
};

export default App;
