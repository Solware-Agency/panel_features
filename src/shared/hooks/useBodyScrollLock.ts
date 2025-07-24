import { useEffect } from 'react'

/**
 * Bloquea el scroll del body cuando `isLocked` es true.
 * Úsalo en sidebars, modals, menús, etc.
 */
export function useBodyScrollLock(isLocked: boolean) {
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow
    if (isLocked) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = originalStyle
    }
    // Limpieza: restaurar el scroll al desmontar o cambiar isLocked
    return () => {
      document.body.style.overflow = originalStyle
    }
  }, [isLocked])
}