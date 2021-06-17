import { useCallback, useEffect, useRef } from 'react'

export const useAnimationFrame = (frameRate: number, callback: (deltaTime: number) => void | Promise<void>) => {
  const requestRef = useRef<number>()
  const previousTimeRef = useRef<number>()

  const animate = useCallback(
    async (time: number) => {
      if (previousTimeRef.current === undefined) {
        previousTimeRef.current = time
      }
      const deltaTime = time - previousTimeRef.current
      if (deltaTime > 1000 / frameRate) {
        await callback(deltaTime)
        previousTimeRef.current = time
      }
      requestRef.current = requestAnimationFrame(animate)
    },
    [callback, frameRate],
  )

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate)
    return () => {
      requestRef.current && cancelAnimationFrame(requestRef.current)
    }
  }, [animate]) // Make sure the effect runs only once
}
