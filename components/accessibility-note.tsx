"use client"

import { useReducedMotion } from "@/hooks/use-reduced-motion"

export function AccessibilityNote() {
  const prefersReducedMotion = useReducedMotion()

  if (!prefersReducedMotion) {
    return null
  }

  return (
    <div className="sr-only" role="status" aria-live="polite">
      Animations have been disabled based on your system preferences.
    </div>
  )
}
