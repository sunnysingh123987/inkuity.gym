'use client'

import { useEffect } from 'react'
import { gsap } from 'gsap'

interface PageEntranceProps {
  selector?: string
  stagger?: number
}

export function PageEntrance({ selector = '[data-animate]', stagger = 0.08 }: PageEntranceProps) {
  useEffect(() => {
    const elements = document.querySelectorAll(selector)
    if (elements.length === 0) return

    gsap.set(elements, { y: 20, opacity: 0 })
    gsap.to(elements, {
      y: 0,
      opacity: 1,
      stagger,
      duration: 0.5,
      ease: 'power2.out',
    })
  }, [selector, stagger])

  return null
}
