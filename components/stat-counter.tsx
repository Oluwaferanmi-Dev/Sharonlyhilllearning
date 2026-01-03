"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"

interface StatCounterProps {
  end: number
  label: string
  suffix?: string
}

export function StatCounter({ end, label, suffix = "" }: StatCounterProps) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const duration = 2000 // 2 seconds
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
  }, [end])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
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
