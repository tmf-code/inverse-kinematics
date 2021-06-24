import { Solve2D, V2 } from 'ik'
import React, { useRef } from 'react'
import { useAnimationFrame } from '../../../hooks/useAnimationFrame'

export const Logger = ({
  target,
  links,
  base: base,
}: {
  target: V2
  links: Solve2D.Link[]
  base: Solve2D.JointTransform
}) => {
  const distanceRef = useRef<HTMLTableCellElement>(null)

  useAnimationFrame(1, () => {
    if (!distanceRef.current) return
    distanceRef.current.innerText = Solve2D.getErrorDistance(links, base, target).toFixed(3)
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
