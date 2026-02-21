'use client'

import { useRef, useEffect, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

interface CounterProps {
  value: string
  className?: string
  duration?: number
}

export function Counter({ value, className = '', duration = 2 }: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const [displayed, setDisplayed] = useState(value)
  const hasAnimated = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el || hasAnimated.current) return

    // Extract numeric part and suffix
    const match = value.match(/^(\d+\.?\d*)(.*?)$/)
    if (!match) {
      setDisplayed(value)
      return
    }

    const numericValue = parseFloat(match[1])
    const suffix = match[2] || ''
    const hasDecimal = match[1].includes('.')

    gsap.set(el, { opacity: 0, y: 20 })

    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        hasAnimated.current = true
        gsap.to(el, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' })

        const obj = { val: 0 }
        gsap.to(obj, {
          val: numericValue,
          duration,
          ease: 'power2.out',
          onUpdate: () => {
            const current = hasDecimal
              ? obj.val.toFixed(1)
              : Math.round(obj.val).toString()
            setDisplayed(current + suffix)
          },
        })
      },
    })

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => {
        if (trigger.trigger === el) trigger.kill()
      })
    }
  }, [value, duration])

  return (
    <span ref={ref} className={className}>
      {displayed}
    </span>
  )
}
