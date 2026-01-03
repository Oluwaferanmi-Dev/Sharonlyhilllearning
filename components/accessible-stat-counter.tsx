"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useReducedMotion } from "@/hooks/use-reduced-motion"

interface AccessibleStatCounterProps {
  end: number
  label: string
  suffix?: string
}

export function AccessibleStatCounter({ end, label, suffix = "" }: AccessibleStatCounterProps) {
  const [count, setCount] = useState(0)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    // If user prefers reduced motion, skip animation
    if (prefersReducedMotion) {
      setCount(end)
      return
    }

    const duration = 2000
    const steps = 60
    const stepDuration = duration / steps
    let currentStep = 0

    const timer = setInterval(() => {
      currentStep++
      const progress = currentStep / steps
      setCount(Math.floor(end * progress))

      if (currentStep === steps) {
        clearInterval(timer)
        setCount(end)
      }
    }, stepDuration)

    return () => clearInterval(timer)
  }, [end, prefersReducedMotion])

  return (
    <motion.div
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: prefersReducedMotion ? 0.1 : 0.6 }}
      className="text-center"
    >
      <p className="text-2xl md:text-3xl font-bold text-slate-900">
        {count.toLocaleString()}
        {suffix}
      </p>
      <p className="text-sm text-slate-600 mt-2">{label}</p>
    </motion.div>
  )
}
