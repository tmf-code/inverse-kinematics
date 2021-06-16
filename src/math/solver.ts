import { clamp } from "./math";
import { V2, V2O } from "./v2";

export interface IBone {
  readonly joint: IJoint;
  readonly length: number;
}

interface IJoint {
  angle: number;
  constraint?: number;
}

const deltaAngle = 0.00001;
const learningRate = 0.0001;
const acceptedError = 10;

function adaptLearningRate(baseLearningRate: number, distance: number): number {
  return distance > 100
    ? baseLearningRate
    : baseLearningRate * ((distance + 25) / 125);
}

export function solve(bones: IBone[], basePosition: V2, target: V2) {
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
      joint: {
        angle: bone.joint.angle + deltaAngle,
        constraint: bone.joint.constraint,
      },
    };

    const projectedBones: IBone[] = [
      boneWithDeltaAngle,
      ...bones.slice(index + 1),
    ];

    const boneParentPosition = absolutePositions[index];
    const boneParentRotation = absoluteRotations[index];

    assertDefined(boneParentPosition);
    assertDefined(boneParentRotation);

    const projectedEffectorPosition = forwardPass(
      projectedBones,
      boneParentPosition,
      boneParentRotation
    ).absolutePositions.slice(-1)[0];

    assertDefined(projectedEffectorPosition);

    const projectedError = V2O.euclideanDistanceV2(
      target,
      projectedEffectorPosition
    );

    const gradient = (projectedError - error) / deltaAngle;

    const nextAngle =
      bone.joint.angle -
      gradient * adaptLearningRate(learningRate, projectedError);

    nextAngles.push(nextAngle);
  }

  if (nextAngles.length !== bones.length) {
    throw new Error(
      `Next angles is incorrect length. Should be ${bones.length}, got ${nextAngles.length}`
    );
  }

  for (let index = 0; index < bones.length; index++) {
    const bone = bones[index]!;

    bone.joint.angle = nextAngles[index]!;

    if (bone.joint.constraint !== undefined) {
      bone.joint.angle = clamp(
        bone.joint.angle,
        -bone.joint.constraint / 2,
        bone.joint.constraint / 2
      );
    }
  }
}

function getEffectorPosition(absolutionPositions: V2[]) {
  const result = absolutionPositions.slice(-1)[0];
  assertDefined(result);
  return result;
}

function assertDefined<T extends any>(
  value: T | undefined
): asserts value is T {
  if (value === undefined) {
    throw new Error("Value should be defined");
  }
}

export function distanceToTarget(bones: IBone[], basePosition: V2, target: V2) {
  const { absolutePositions } = forwardPass(bones, basePosition);
  const effectorPosition = getEffectorPosition(absolutePositions);
  return V2O.euclideanDistanceV2(target, effectorPosition);
}

export function forwardPass(
  bones: IBone[],
  parentPosition: V2,
  parentRotation: number = 0
): { absolutePositions: V2[]; absoluteRotations: number[] } {
  const absolutePositions: V2[] = [parentPosition];
  const absoluteRotations: number[] = [parentRotation];

  for (let index = 0; index < bones.length; index++) {
    const currentBone = bones[index]!;
    const parentBonePosition = absolutePositions[index];
    const parentBoneRotation = absoluteRotations[index];

    assertDefined(parentBonePosition);
    assertDefined(parentBoneRotation);

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
