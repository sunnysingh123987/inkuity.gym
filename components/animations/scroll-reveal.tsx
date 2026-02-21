'use client'

import { useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

interface ScrollRevealProps {
  children: React.ReactNode
  className?: string
  animation?: 'fadeUp' | 'fadeIn' | 'fadeLeft' | 'fadeRight' | 'scaleUp' | 'stagger'
  delay?: number
  duration?: number
  staggerAmount?: number
}

export function ScrollReveal({
  children,
  className = '',
  animation = 'fadeUp',
  delay = 0,
  duration = 0.8,
  staggerAmount = 0.15,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const animationProps: Record<string, gsap.TweenVars> = {
      fadeUp: { y: 40, opacity: 0 },
      fadeIn: { opacity: 0 },
      fadeLeft: { x: -40, opacity: 0 },
      fadeRight: { x: 40, opacity: 0 },
      scaleUp: { scale: 0.9, opacity: 0 },
      stagger: { y: 30, opacity: 0 },
    }

    const fromVars = animationProps[animation] || animationProps.fadeUp

    if (animation === 'stagger') {
      const children = el.children
      gsap.set(children, fromVars)
      gsap.to(children, {
        y: 0,
        opacity: 1,
        duration,
        delay,
        stagger: staggerAmount,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          once: true,
        },
      })
    } else {
      gsap.set(el, fromVars)
      gsap.to(el, {
        y: 0,
        x: 0,
        scale: 1,
        opacity: 1,
        duration,
        delay,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          once: true,
        },
      })
    }

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => {
        if (trigger.trigger === el || trigger.trigger === el.parentElement) {
          trigger.kill()
        }
      })
    }
  }, [animation, delay, duration, staggerAmount])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
