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
