'use client'

import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function LandingAnimations() {
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero entrance
      const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      heroTl
        .from('[data-hero-line-1]', { y: 60, opacity: 0, duration: 1, delay: 0.3 })
        .from('[data-hero-line-2]', { y: 60, opacity: 0, duration: 1 }, '-=0.6')

      // Trust section
      gsap.from('[data-trust-heading]', {
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: { trigger: '[data-trust-heading]', start: 'top 85%', once: true },
      })

      gsap.from('[data-trust-logos] > *', {
        opacity: 0,
        y: 15,
        stagger: 0.1,
        duration: 0.5,
        ease: 'power2.out',
        scrollTrigger: { trigger: '[data-trust-logos]', start: 'top 90%', once: true },
      })

      // Support section
      gsap.from('[data-support-left]', {
        x: -40,
        opacity: 0,
        duration: 0.9,
        ease: 'power2.out',
        scrollTrigger: { trigger: '[data-support-left]', start: 'top 80%', once: true },
      })

      gsap.from('[data-support-right] > *', {
        x: 40,
        opacity: 0,
        stagger: 0.15,
        duration: 0.7,
        ease: 'power2.out',
        scrollTrigger: { trigger: '[data-support-right]', start: 'top 80%', once: true },
      })

      // Features heading
      gsap.from('[data-features-heading]', {
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: { trigger: '[data-features-heading]', start: 'top 85%', once: true },
      })

      // Feature cards
      gsap.from('[data-feature-card]', {
        y: 50,
        opacity: 0,
        scale: 0.95,
        stagger: 0.15,
        duration: 0.7,
        ease: 'power2.out',
        scrollTrigger: { trigger: '[data-feature-card]', start: 'top 85%', once: true },
      })

      // Feature labels
      gsap.from('[data-feature-label]', {
        y: 20,
        opacity: 0,
        stagger: 0.1,
        duration: 0.6,
        ease: 'power2.out',
        scrollTrigger: { trigger: '[data-feature-label]', start: 'top 90%', once: true },
      })

      // Benefits section
      gsap.from('[data-benefits-heading]', {
        x: -30,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: { trigger: '[data-benefits-heading]', start: 'top 80%', once: true },
      })

      gsap.from('[data-benefit-item]', {
        x: -20,
        opacity: 0,
        stagger: 0.1,
        duration: 0.5,
        ease: 'power2.out',
        scrollTrigger: { trigger: '[data-benefit-item]', start: 'top 85%', once: true },
      })

      gsap.from('[data-benefits-mockup]', {
        x: 60,
        opacity: 0,
        duration: 1,
        ease: 'power2.out',
        scrollTrigger: { trigger: '[data-benefits-mockup]', start: 'top 80%', once: true },
      })

      // Pricing section
      gsap.from('[data-pricing-heading]', {
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: { trigger: '[data-pricing-heading]', start: 'top 85%', once: true },
      })

      gsap.from('[data-pricing-card]', {
        y: 40,
        opacity: 0,
        scale: 0.95,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: { trigger: '[data-pricing-card]', start: 'top 85%', once: true },
      })

      // Testimonials
      gsap.from('[data-testimonial-left]', {
        x: -40,
        opacity: 0,
        duration: 0.9,
        ease: 'power2.out',
        scrollTrigger: { trigger: '[data-testimonial-left]', start: 'top 80%', once: true },
      })

      gsap.from('[data-testimonial-right]', {
        x: 40,
        opacity: 0,
        duration: 0.9,
        ease: 'power2.out',
        scrollTrigger: { trigger: '[data-testimonial-right]', start: 'top 80%', once: true },
      })

      // FAQ section
      gsap.from('[data-faq-heading]', {
        y: 30,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: { trigger: '[data-faq-heading]', start: 'top 85%', once: true },
      })

      // Footer columns
      gsap.from('[data-footer-col]', {
        y: 20,
        opacity: 0,
        stagger: 0.1,
        duration: 0.6,
        ease: 'power2.out',
        scrollTrigger: { trigger: '[data-footer]', start: 'top 90%', once: true },
      })
    })

    return () => ctx.revert()
  }, [])

  return null
}
