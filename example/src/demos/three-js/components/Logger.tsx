import { Solve3D, V3 } from 'inverse-kinematics'
import React, { useRef } from 'react'
import { useAnimationFrame } from '../../../hooks/useAnimationFrame'

export const Logger = ({
  target,
  links,
  base: base,
}: {
  target: V3
  links: Solve3D.Link[]
  base: Solve3D.JointTransform
}) => {
  const distanceRef = useRef<HTMLTableCellElement>(null)

  useAnimationFrame(1, () => {
    if (!distanceRef.current) return
    distanceRef.current.innerText = Solve3D.getErrorDistance(links, base, target).toFixed(3)
  })

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, userSelect: 'none' }}>
      <table>
        <tbody>
          <tr>
            <td>Distance</td>
            <td ref={distanceRef}></td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}
