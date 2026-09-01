import { useEffect, type RefObject } from 'react'

export function useDismissable<T extends HTMLElement>(
  ref: RefObject<T>,
  open: boolean,
  onDismiss: () => void,
) {
  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: PointerEvent) => {
      const node = ref.current
      if (node && !node.contains(event.target as Node)) onDismiss()
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onDismiss()
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onDismiss, ref])
}
