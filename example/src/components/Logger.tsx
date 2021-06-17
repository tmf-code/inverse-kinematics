import React, { useRef } from "react";
import { useAnimationFrame } from "src/hooks/useAnimationFrame";
import { forwardPass, IBone, V2, V2O } from "ik";

export const Logger = ({
  target,
  bones,
  basePosition,
}: {
  target: V2;
  bones: IBone[];
  basePosition: V2;
}) => {
  const distanceRef = useRef<HTMLTableCellElement>(null);

  useAnimationFrame(1, () => {
    if (!distanceRef.current) return;
    distanceRef.current.innerText = distanceToTarget(
      bones,
      basePosition,
      target
    ).toFixed(3);
  });

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

export function distanceToTarget(bones: IBone[], basePosition: V2, target: V2) {
  const { effectorPosition } = forwardPass(bones, {
    position: basePosition,
    rotation: 0,
  });
  return V2O.euclideanDistanceV2(target, effectorPosition);
}
