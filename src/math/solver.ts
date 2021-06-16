import { V2, V2O } from "./v2";

type AtLeastOneOf<T> = [T, ...T[]];
export type BoneSequence = AtLeastOneOf<Omit<IBone, "child">>;

export interface IBone {
  joint: IJoint;
  length: number;
  child?: IBone;
}
interface IJoint {
  angle: number;
}

export function solve(bones: BoneSequence, basePosition: V2) {
  for (let index = 0; index < bones.length; index++) {
    bones[index]!.joint.angle += 0.001;
  }
}

export function forwardPass(bones: BoneSequence, basePosition: V2): V2[] {
  const jointPositions: V2[] = [basePosition];
  const jointRotations: number[] = [0];

  for (let index = 0; index < bones.length; index++) {
    const currentBone = bones[index]!;
    const parentBonePosition = jointPositions[index]!;
    const parentBoneRotation = jointRotations[index]!;
    const absoluteRotation = currentBone.joint.angle + parentBoneRotation;
    const relativePosition = V2O.fromPolar(
      currentBone.length,
      absoluteRotation
    );
    const absolutePosition = V2O.add(relativePosition, parentBonePosition);
    jointPositions.push(absolutePosition);
    jointRotations.push(absoluteRotation);
  }
  return jointPositions;
}
