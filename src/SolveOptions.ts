export interface SolveFABRIKOptions {
  method: 'FABRIK'
  /**
   * Angle gap taken to calculate the gradient of the error function
   * Usually the default here will do.
   * @default 0.00001
   */
  deltaAngle?: number
  /**
   * Sets the 'speed' at which the algorithm converges on the target.
   * Larger values will cause oscillations, or vibrations about the target
   * Lower values may move too slowly. You should tune this manually
   *
   * Can either be a constant, or a function that returns a learning rate
   * @default 0.0001
   */
  learningRate?: number | ((errorDistance: number) => number)
  /**
   * Useful if there is oscillations or vibration around the target
   * @default 0
   */
  acceptedError?: number
}

export const defaultFABRIKOptions: Required<SolveFABRIKOptions> = {
  method: 'FABRIK',
  deltaAngle: 0.0001,
  learningRate: 0.001,
  acceptedError: 0,
}

export interface SolveCCDOptions {
  method: 'CCD'
  /**
   * Sets the 'speed' at which the algorithm converges on the target.
   * Larger values will cause oscillations, or vibrations about the target
   * Lower values may move too slowly. You should tune this manually
   *
   * Can either be a constant, or a function that returns a learning rate
   * @default 1.0
   */
  learningRate?: number | ((errorDistance: number) => number)
  /**
   * Useful if there is oscillations or vibration around the target
   * @default 0
   */
  acceptedError?: number
}

export const defaultCCDOptions: Required<SolveCCDOptions> = {
  method: 'CCD',
  learningRate: 1,
  acceptedError: 0,
}

export type SolveOptions = SolveFABRIKOptions | SolveCCDOptions
