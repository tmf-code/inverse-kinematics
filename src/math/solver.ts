import { V2, V2O } from "./v2";

type AtLeastOneOf<T> = [T, ...T[]];
export type BoneSequence = AtLeastOneOf<Omit<IBone, "child">>;

export interface IBone {
  readonly joint: IJoint;
  readonly length: number;
  readonly child?: IBone;
}
interface IJoint {
  angle: number;
}

const deltaAngle = 0.00001;
const learningRate = 0.0001;
const acceptedError = 10;

function adaptLearningRate(baseLearningRate: number, distance: number): number {
  return distance > 100
    ? baseLearningRate
    : baseLearningRate * ((distance + 25) / 125);
}

export function solve(bones: BoneSequence, basePosition: V2, target: V2) {
  const { absolutePositions, absoluteRotations } = forwardPass(
    bones,
    basePosition
  );
  const effectorPosition = getEffectorPosition(absolutePositions);
  const error = V2O.euclideanDistanceV2(target, effectorPosition);

  if (error < acceptedError) return;

  const nextAngles: number[] = [];

  for (let index = 0; index < bones.length; index++) {
    const bone = bones[index]!;

    const boneWithDeltaAngle: Omit<IBone, "child"> = {
      ...bone,
      joint: { angle: bone.joint.angle + deltaAngle },
    };

    const projectedBones: BoneSequence = [
      boneWithDeltaAngle,
      ...bones.slice(index + 1),
    ];

    const boneParentPosition = absolutePositions[index];
    const boneParentRotation = absoluteRotations[index];

    // assertUndefined(boneParentPosition);

    if (boneParentPosition === undefined) {
      throw new Error(`Could not get bone parent for index ${index}`);
    }
    if (boneParentRotation === undefined) {
      throw new Error(`Could not get bone parent for index ${index}`);
    }

    const projectedEffectorPosition = forwardPass(
      projectedBones,
      boneParentPosition,
      boneParentRotation
    ).absolutePositions.slice(-1)[0];

    if (projectedEffectorPosition === undefined) {
      throw new Error(
        `Could not get projected effector position for index ${index}`
      );
    }

    const projectedError = V2O.euclideanDistanceV2(
      target,
      projectedEffectorPosition
    );

    const gradient = (projectedError - error) / deltaAngle;
    bone.joint.angle -=
      gradient * adaptLearningRate(learningRate, projectedError);
    // const nextAngle = bone.joint.angle - gradient * learningRate;
    // nextAngles.push(nextAngle);
  }

  // if (nextAngles.length !== bones.length) {
  //   throw new Error(
  //     `Next angles is incorrect length. Should be ${bones.length}, got ${nextAngles.length}`
  //   );
  // }

  // for (let index = 0; index < bones.length; index++) {
  //   bones[index]!.joint.angle = nextAngles[index]!;
  // }
}

function getEffectorPosition(absolutionPositions: V2[]) {
  const result = absolutionPositions.slice(-1)[0];

  if (result === undefined) {
    throw new Error(
      "Could not get effector position from absolute positions. Array is possibly empty"
    );
  }

  return result;
}

function assertUndefined<T extends any>(value: T | undefined): value is T {
  if (value === undefined) {
    throw new Error("Value should be defined");
  }

  return true;
}

export function distanceToTarget(
  bones: BoneSequence,
  basePosition: V2,
  target: V2
) {
  const { absolutePositions } = forwardPass(bones, basePosition);
  const effectorPosition = getEffectorPosition(absolutePositions);
  return V2O.euclideanDistanceV2(target, effectorPosition);
}

export function forwardPass(
  bones: BoneSequence,
  parentPosition: V2,
  parentRotation: number = 0
): { absolutePositions: V2[]; absoluteRotations: number[] } {
  const absolutePositions: V2[] = [parentPosition];
  const absoluteRotations: number[] = [parentRotation];

  for (let index = 0; index < bones.length; index++) {
    const currentBone = bones[index]!;
    const parentBonePosition = absolutePositions[index];
    const parentBoneRotation = absoluteRotations[index];

    if (parentBonePosition === undefined) {
      throw new Error(`Could not get parent bone position for index ${index}`);
    }
    if (parentBoneRotation === undefined) {
      throw new Error(`Could not get parent bone rotation for index ${index}`);
    }

    const absoluteRotation = currentBone.joint.angle + parentBoneRotation;
    const relativePosition = V2O.fromPolar(
      currentBone.length,
      absoluteRotation
    );
    const absolutePosition = V2O.add(relativePosition, parentBonePosition);
    absolutePositions.push(absolutePosition);
    absoluteRotations.push(absoluteRotation);
  }
  return { absolutePositions, absoluteRotations };
}
