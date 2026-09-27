'use client'

import { useEffect } from 'react'
import { prefersReducedMotion } from '@/lib/tokens'

// Section titles decode letter by letter and `.rv` rows step into place as they scroll in.
// Everything is readable before this runs; it only adds motion.

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

function decode(el: HTMLElement) {
  const final = el.textContent ?? ''
  let i = 0
  const iv = setInterval(() => {
    el.textContent = [...final]
      .map((ch, k) => (k < i || ch === ' ' ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
      .join('')
    i++
    if (i > final.length) {
      clearInterval(iv)
      el.textContent = final
    }
  }, 38)
}

export default function Reveal() {
  useEffect(() => {
    if (prefersReducedMotion()) {
      document.querySelectorAll('.rv').forEach((el) => el.classList.add('in'))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          const el = e.target as HTMLElement
          if (el.classList.contains('rv')) el.classList.add('in')
          if (el.hasAttribute('data-decode')) decode(el)
          io.unobserve(el)
        }
      },
      { threshold: 0.12 },
    )
    document.querySelectorAll('.rv, [data-decode]').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
  return null
}
