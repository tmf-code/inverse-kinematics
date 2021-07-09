# Inverse Kinematics

[![Version](https://img.shields.io/npm/v/inverse-kinematics)](https://npmjs.com/package/inverse-kinematics)
[![Downloads](https://img.shields.io/npm/dt/inverse-kinematics.svg)](https://npmjs.com/package/inverse-kinematics)

A typescript/javascript library for calculating inverse kinematics. Supports 2D and 3D applications.

## Install

```bash
npm install inverse-kinematics
```

## Quickstart 2D

https://codesandbox.io/s/quickstart-2d-ob7yw?file=/src/index.ts

```ts
import { V2, Solve2D } from 'inverse-kinematics'

// Create a list of 'links'
// Three links, of 50 units long, all pointing in the same direction
let links: Solve2D.Link[] = [
  { position: [50, 0], rotation: 0 },
  { position: [50, 0], rotation: 0 },
  { position: [50, 0], rotation: 0 },
]

// Define the base of the links
const base: Solve2D.JointTransform = { position: [0, 0], rotation: 0 }

// Define a target for the 'end effector' or the tip of the last link to move to
const target: V2 = [50, 50]

// Iterate until the error is within acceptable range
const acceptedError = 10
function loop() {
  const result = Solve2D.solve(links, base, target)
  const error = result.getErrorDistance()
  links = result.links
  if (error < acceptedError) return
  setTimeout(loop, 100)
  console.log(error.toFixed(0))
}
loop()
```

## Quickstart 3D

https://codesandbox.io/s/quickstart-3d-25xy6?file=/src/index.ts

```ts
import { V3, Solve3D, QuaternionO } from 'inverse-kinematics'

// Create a list of 'links'
// Three links, of 50 units long, all pointing in the same direction
let links: Solve3D.Link[] = [
  { position: [50, 0, 0], rotation: QuaternionO.zeroRotation() },
  { position: [50, 0, 0], rotation: QuaternionO.zeroRotation() },
  { position: [50, 0, 0], rotation: QuaternionO.zeroRotation() },
]

// Define the base of the links
const base: Solve3D.JointTransform = {
  position: [0, 0, 0],
  rotation: QuaternionO.zeroRotation(),
}

// Define a target for the 'end effector' or the tip of the last link to move to
const target: V3 = [50, 50, 50]

// Iterate until the error is within acceptable range
const acceptedError = 10
function loop() {
  const result = Solve3D.solve(links, base, target)
  const error = result.getErrorDistance()
  links = result.links
  if (error < acceptedError) return
  setTimeout(loop, 100)
  console.log(error.toFixed(0))
}
loop()
```

## Examples

Check out https://tmf-code.github.io/inverse-kinematics or find them in the folder /example

## Terminology

### Base

The starting point of the link chain

### Link

A `Link` can be thought of as a connecting bar, that extends from it's joint, to the joint of the next link in the chain.

### Joint

Occurs at the tip of the preceding link, and at the base of the following link. We've chosen to consider ownership of the joint to the following link. So that itself can be considered a `Base` to the remaining links.

### Visulization of terminology

You could visualize a link chain like so:

```
Base
  -> rotate(link_1.rotation) [joint_1] -> translate(link_1.position)
  -> rotate(link_2.rotation) [joint_2] -> translate(link_2.position)
```

## Constraints

There are a number of ways in which you can limit the movement of a joint, from the default ball and socket configuration. For both 3d and 2d you can supply either:

- A single value per axis, this specifies half of the rotational range either direction from the direction vector of the previous link
- A range with values `min` and `max`.
- An exact rotation in the local coordinate system
- An exact rotation in the bases coordinate system

### 2D

```ts
interface Link {
  /**
   * The rotation at the base of the link
   */
  rotation: number

  /**
   * undefined: No constraint
   *
   * Range: minimum angle, maximum angle (radians), positive is anticlockwise from previous Link's direction vector
   *
   * ExactRotation: Either a global, or local rotation which the Link is locked to
   */
  constraints?: Constraints
  position: V2
}

type Constraints = number | Range | ExactRotation

interface ExactRotation {
  value: number
  /**
   * 'local': Relative to previous links direction vector
   *
   * 'global': Relative to the baseJoints world transform
   */
  type: 'global' | 'local'
}
```

### 3D

```ts
interface Link {
  /**
   * The rotation at the base of the link
   */
  rotation: Quaternion

  /**
   * undefined: No constraint
   *
   * {pitch, yaw, roll}: Range | Number
   *
   * Range: minimum angle, maximum angle (radians), positive is anticlockwise from previous Link's direction vector
   *
   * number: the range of rotation (radian) about the previous links direction vector. A rotation of 90 deg would be 45 deg either direction
   *
   * ExactRotation: Either a global, or local rotation which the Link is locked to
   */
  constraints?: Constraints
  position: V3
}

type Constraints = EulerConstraint | ExactRotation

interface EulerConstraint {
  /**
   * Rotation about X
   */
  pitch?: number | Range
  /**
   * Rotation about Y
   */
  yaw?: number | Range
  /**
   * Rotation about Z
   */
  roll?: number | Range
}

interface ExactRotation {
  value: Quaternion
  type: 'global' | 'local'
}
```

## Tuning & Algorithm

Currently this package supports gradient descent. Soon it will also support a CCD approach.

The algorithm is quite simple. You can find it in `src/Solve2D.ts`, or `src/Solve3D.ts`. Available parameters to tune with are:

```ts
interface SolveOptions {
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
```

For good results manually tune the accepted error and the learning rate.

The learning rate can either be a constant or a function. An example learning rate function could be

```ts
const knownRangeOfMovement = 200
function learningRate(errorDistance: number): number {
  const relativeDistanceToTarget = clamp(errorDistance / knownRangeOfMovement, 0, 1)
  const cutoff = 0.02

  if (relativeDistanceToTarget > cutoff) {
    return 10e-4
  }

  // result is between 0 and 1
  const remainingDistance = relativeDistanceToTarget / 0.02
  const minimumLearningRate = 10e-5

  return minimumLearningRate + remainingDistance * minimumLearningRate
}
```
