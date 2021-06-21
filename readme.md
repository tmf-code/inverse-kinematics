# IK - Inverse Kinematics

A typescript/javascript library for calculating inverse kinematics. Supports 2D and (soon) 3D applications.

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
const bones: Solve2D.Link[] = [
  { rotation: 0, length: 50 },
  { rotation: 0, length: 50 },
  { rotation: 0, length: 50 },
]

// Define the base of the links
const base: Solve2D.JointTransform = { position: [0, 0], rotation: 0 }

// Define a target for the 'end effector' or the tip of the last link to move to
const target: V2 = [50, 50]

// Iterate until the error is within acceptable range
const acceptedError = 10
function loop() {
  const error = Solve2D.getErrorDistance(bones, base, target)
  if (error < acceptedError) return

  Solve2D.solve(bones, base.position, target)
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
const bones: Solve3D.Link[] = [
  { rotation: QuaternionO.zeroRotation(), length: 50 },
  { rotation: QuaternionO.zeroRotation(), length: 50 },
  { rotation: QuaternionO.zeroRotation(), length: 50 },
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
  const error = Solve3D.getErrorDistance(bones, base, target)
  if (error < acceptedError) return

  Solve3D.solve(bones, base.position, target)
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
  -> rotate(link_1.rotation) [joint_1] -> translate(link_1.length)
  -> rotate(link_2.rotation) [joint_2] -> translate(link_2.length)
```

## Tuning & Algorithm

Currently this package supports gradient descent. Soon it will also support a CCD approach.

The algorithm is quite simple. You can find it in `src/Solve2D.ts`. Available parameters to tune with are:

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

  return minimumLearningRate + remainingDistance * errorDistance
}
```
