'use client'

import { useEffect, useRef } from 'react'
import './FlowBackground.css'

interface FlowBackgroundProps {
  productIndex: number
  isVisible: boolean
}

export function FlowBackground({ productIndex, isVisible }: FlowBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Product-specific color themes
  const colorThemes = [
    // Wine Bottle - Earthy greens and browns
    {
      primary: '#A8B09F', // Lighter sage
      secondary: '#D4A574', // Warmer copper
      accent: '#7A95B3', // Softer blue
    },
    // Battery - Cool blues and silvers
    {
      primary: '#7A95B3', // Brighter blue
      secondary: '#A8B09F', // Sage accent
      accent: '#D4A574', // Warm accent
    },
    // T-Shirt - Warm oranges and sages
    {
      primary: '#D4A574', // Bright copper
      secondary: '#A8B09F', // Light sage
      accent: '#7A95B3', // Cool accent
    }
  ]

  const currentTheme = colorThemes[productIndex] || colorThemes[0]

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size - positioned behind product info tile
    canvas.width = 400
    canvas.height = 500

    // Flowing particles system - smoother and more vibrant
    const particles: Array<{
      x: number
      y: number
      vx: number
      vy: number
      size: number
      color: string
      life: number
      maxLife: number
    }> = []

    const createParticle = (x: number, y: number) => {
      const colors = [currentTheme.primary, currentTheme.secondary, currentTheme.accent]
      return {
        x,
        y,
        vx: (Math.random() - 0.5) * 1.5, // Slower horizontal movement
        vy: -Math.random() * 0.8 - 0.3, // Gentler upward flow
        size: Math.random() * 4 + 2, // Larger particles (2-6px)
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 0,
        maxLife: 90 + Math.random() * 60 // Longer life (1.5-2.5 seconds at 60fps)
      }
    }

    let animationId: number
    let lastTime = 0

    const animate = (currentTime: number) => {
      if (!isVisible) return

      // Ensure consistent timing (target 60fps)
      const deltaTime = Math.min(currentTime - lastTime, 16.67) // Cap at ~60fps
      lastTime = currentTime

      // Clear canvas with very subtle background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.02)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Update and draw particles with smoother animation
      for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i]

        // Update particle with time-based movement for consistency
        particle.x += particle.vx * (deltaTime / 16.67) // Normalize to 60fps
        particle.y += particle.vy * (deltaTime / 16.67)
        particle.life += deltaTime / 16.67 // Frame-rate independent life

        // Remove dead particles
        if (particle.life >= particle.maxLife) {
          particles.splice(i, 1)
          continue
        }

        // Draw particle with smoother fade and glow effect
        const lifeRatio = particle.life / particle.maxLife
        const alpha = Math.max(0, 1 - Math.pow(lifeRatio, 0.8)) // Smoother fade curve

        // Add subtle glow effect
        ctx.shadowColor = particle.color
        ctx.shadowBlur = particle.size * 2
        ctx.globalAlpha = alpha * 0.6

        ctx.fillStyle = particle.color
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size * (1 + lifeRatio * 0.3), 0, Math.PI * 2)
        ctx.fill()

        // Reset shadow for next particle
        ctx.shadowBlur = 0
      }

      // Add new particles more frequently for denser flow
      if (Math.random() < 0.4) { // 40% chance per frame
        const startX = Math.random() * canvas.width
        const startY = canvas.height + 5
        particles.push(createParticle(startX, startY))
      }

      // Allow more particles for richer effect
      if (particles.length > 150) {
        particles.splice(0, particles.length - 150)
      }

      ctx.globalAlpha = 1
      animationId = requestAnimationFrame(animate)
    }

    if (isVisible) {
      animate(0)
    }

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [productIndex, currentTheme, isVisible])

  if (!isVisible) return null

  return (
    <div className="flow-background-wrapper">
      <canvas ref={canvasRef} className="flow-background-canvas" />
    </div>
  )
}