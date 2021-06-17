# IK - Inverse Kinematics

Inverse kinematics for 2D and (soon) 3D applications.

## Quickstart 2D

https://codesandbox.io/s/quickstart-2d-ob7yw?file=/src/index.ts

```ts
import { V2 } from 'inverse-kinematics'
import { euclideanDistance } from 'inverse-kinematics/dist/math/V2O'
import { Link, forwardPass, solve, Transform } from 'inverse-kinematics/dist/solve2d'

// Create a list of 'Links'
// Three Links, of 50 units long, all pointing in the same direction
const Links: Link[] = [
  { rotation: 0, length: 50 },
  { rotation: 0, length: 50 },
  { rotation: 0, length: 50 },
]

// Define the base of the Links
const base: Transform = { position: [0, 0], rotation: 0 }

// Define a target for the 'end effector' or the tip of the last Link to find
const target: V2 = [50, 50]

// Iterate until the error is within acceptable range
const acceptedError = 10
function loop() {
  const { effectorPosition } = forwardPass(Links, base)

  const error = euclideanDistance(target, effectorPosition)

  if (error < acceptedError) return

  solve(links, base.position, target)
  setTimeout(loop, 100)
  console.log(error.toFixed(0))
}
loop()
```

## Examples

Check out https://tmf-code.github.io/inverse-kinematics or find them in the folder /example
