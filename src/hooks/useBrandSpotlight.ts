import { useCallback, useEffect, useRef, type RefObject } from 'react'

const DEFAULT_INTERACTIVE = 'button, a, input, label'

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function useBrandSpotlight(
  rootRef: RefObject<HTMLElement | null>,
  interactiveSelector = DEFAULT_INTERACTIVE,
) {
  const activePointer = useRef<number | null>(null)
  const fadeTimer = useRef<number | null>(null)

  const setSpotlight = useCallback((x: number, y: number, strength: number) => {
    const el = rootRef.current
    if (!el) return
    el.style.setProperty('--sx', `${x}px`)
    el.style.setProperty('--sy', `${y}px`)
    el.style.setProperty('--sstrength', String(strength))
  }, [rootRef])

  const fadeOut = useCallback(() => {
    const el = rootRef.current
    if (!el) return
    if (fadeTimer.current) window.clearInterval(fadeTimer.current)
    const start = Number.parseFloat(el.style.getPropertyValue('--sstrength') || '0')
    if (start <= 0.01) {
      setSpotlight(0, 0, 0)
      return
    }
    const startedAt = performance.now()
    const duration = 480
    fadeTimer.current = window.setInterval(() => {
      const tNorm = Math.min(1, (performance.now() - startedAt) / duration)
      const next = start * (1 - tNorm)
      const sx = el.style.getPropertyValue('--sx') || '0px'
      const sy = el.style.getPropertyValue('--sy') || '0px'
      el.style.setProperty('--sstrength', String(next))
      el.style.setProperty('--sx', sx)
      el.style.setProperty('--sy', sy)
      if (tNorm >= 1) {
        if (fadeTimer.current) window.clearInterval(fadeTimer.current)
        fadeTimer.current = null
        setSpotlight(0, 0, 0)
      }
    }, 16)
  }, [rootRef, setSpotlight])

  useEffect(() => {
    const el = rootRef.current
    if (!el || prefersReducedMotion()) return

    const isBlockedTarget = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return true
      return Boolean(target.closest(interactiveSelector))
    }

    const onDown = (event: PointerEvent) => {
      if (isBlockedTarget(event.target)) return
      if (fadeTimer.current) {
        window.clearInterval(fadeTimer.current)
        fadeTimer.current = null
      }
      activePointer.current = event.pointerId
      const rect = el.getBoundingClientRect()
      setSpotlight(event.clientX - rect.left, event.clientY - rect.top, 1)
      try {
        el.setPointerCapture(event.pointerId)
      } catch {
        /* ignore */
      }
    }

    const onMove = (event: PointerEvent) => {
      if (activePointer.current != null && activePointer.current !== event.pointerId) {
        return
      }
      if (activePointer.current == null) {
        if (event.pointerType !== 'mouse' || isBlockedTarget(event.target)) return
        const rect = el.getBoundingClientRect()
        setSpotlight(event.clientX - rect.left, event.clientY - rect.top, 0.72)
        return
      }
      const rect = el.getBoundingClientRect()
      setSpotlight(event.clientX - rect.left, event.clientY - rect.top, 1)
    }

    const onUp = (event: PointerEvent) => {
      if (activePointer.current !== event.pointerId) return
      activePointer.current = null
      try {
        el.releasePointerCapture(event.pointerId)
      } catch {
        /* ignore */
      }
      fadeOut()
    }

    const onLeave = () => {
      if (activePointer.current == null) return
      activePointer.current = null
      fadeOut()
    }

    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerup', onUp)
    el.addEventListener('pointercancel', onUp)
    el.addEventListener('pointerleave', onLeave)

    return () => {
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerup', onUp)
      el.removeEventListener('pointercancel', onUp)
      el.removeEventListener('pointerleave', onLeave)
      if (fadeTimer.current) window.clearInterval(fadeTimer.current)
    }
  }, [fadeOut, interactiveSelector, rootRef, setSpotlight])
}
