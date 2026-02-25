'use client'

import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface AdvertisementParticlesProps {
  sequence: 'scan' | 'verify' | 'trust'
  isVisible: boolean
}

// Generate particle positions for text formation
function generateTextParticles(text: string, count: number): Float32Array {
  const positions = new Float32Array(count * 3)
  const chars = text.toUpperCase()
  const charWidth = 0.15
  const charHeight = 0.2
  const spacing = 0.12
  
  for (let i = 0; i < count; i++) {
    const charIndex = Math.floor((i / count) * chars.length)
    const charX = (charIndex * spacing) - ((chars.length * spacing) / 2)
    
    // Create letter-like patterns
    const gridX = (i % 8) / 8
    const gridY = Math.floor((i % 64) / 8) / 8
    
    positions[i * 3] = charX + (gridX - 0.5) * charWidth
    positions[i * 3 + 1] = (0.5 - gridY) * charHeight
    positions[i * 3 + 2] = (Math.random() - 0.5) * 0.1
  }
  
  return positions
}

// Generate scatter positions (explosion effect)
function generateScatter(count: number, spread: number = 3): Float32Array {
  const positions = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(Math.random() * 2 - 1)
    const r = Math.random() * spread
    
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
    positions[i * 3 + 2] = r * Math.cos(phi)
  }
  return positions
}

export function AdvertisementParticles({ sequence, isVisible }: AdvertisementParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null)
  const targetPositionsRef = useRef<Float32Array | null>(null)
  const currentPositionsRef = useRef<Float32Array | null>(null)
  const morphProgress = useRef(0)
  const animationPhase = useRef<'scatter' | 'forming' | 'hold'>('scatter')
  const phaseTime = useRef(0)
  
  const pointCount = 5000
  
  // Generate target positions based on sequence
  const targetPositions = useMemo(() => {
    const text = sequence.toUpperCase()
    return generateTextParticles(text, pointCount)
  }, [sequence])
  
  const scatterPositionsRef = useRef<Float32Array | null>(null)
  
  // Initialize scatter positions once
  if (!scatterPositionsRef.current) {
    scatterPositionsRef.current = generateScatter(pointCount, 4)
  }
  
  // Reset animation when sequence changes
  useEffect(() => {
    if (!currentPositionsRef.current) {
      currentPositionsRef.current = new Float32Array(pointCount * 3)
    }
    
    // Start from scatter
    if (scatterPositionsRef.current) {
      for (let i = 0; i < pointCount * 3; i += 3) {
        currentPositionsRef.current[i] = scatterPositionsRef.current[i]
        currentPositionsRef.current[i + 1] = scatterPositionsRef.current[i + 1]
        currentPositionsRef.current[i + 2] = scatterPositionsRef.current[i + 2]
      }
    }
    
    targetPositionsRef.current = targetPositions
    morphProgress.current = 0
    animationPhase.current = 'scatter'
    phaseTime.current = 0
  }, [sequence, targetPositions, pointCount])
  
  useFrame((state, delta) => {
    if (!pointsRef.current || !targetPositionsRef.current || !currentPositionsRef.current) return
    if (!isVisible) return
    
    phaseTime.current += delta
    
    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array
    
    // Animation phases: scatter → forming → hold → scatter (loop)
    if (!scatterPositionsRef.current) return
    
    if (animationPhase.current === 'scatter') {
      // Fast explosion outward
      if (phaseTime.current < 0.2) {
        const t = phaseTime.current / 0.2
        for (let i = 0; i < pointCount * 3; i += 3) {
          const scatterX = scatterPositionsRef.current[i]
          const scatterY = scatterPositionsRef.current[i + 1]
          const scatterZ = scatterPositionsRef.current[i + 2]
          
          // Fast explosion from center
          const explodeT = 1 - Math.pow(1 - t, 2) // Quadratic ease out
          positions[i] = scatterX * (1 + explodeT * 3)
          positions[i + 1] = scatterY * (1 + explodeT * 3)
          positions[i + 2] = scatterZ * (1 + explodeT * 3)
        }
      } else {
        animationPhase.current = 'forming'
        phaseTime.current = 0
      }
    } else if (animationPhase.current === 'forming') {
      // Fast form into text
      if (phaseTime.current < 0.4) {
        morphProgress.current = Math.min(phaseTime.current / 0.4, 1)
        const t = THREE.MathUtils.easeOutCubic(morphProgress.current)
        
        for (let i = 0; i < pointCount * 3; i += 3) {
          const scatterX = scatterPositionsRef.current[i]
          const scatterY = scatterPositionsRef.current[i + 1]
          const scatterZ = scatterPositionsRef.current[i + 2]
          
          const targetX = targetPositionsRef.current[i]
          const targetY = targetPositionsRef.current[i + 1]
          const targetZ = targetPositionsRef.current[i + 2]
          
          positions[i] = THREE.MathUtils.lerp(scatterX, targetX, t)
          positions[i + 1] = THREE.MathUtils.lerp(scatterY, targetY, t)
          positions[i + 2] = THREE.MathUtils.lerp(scatterZ, targetZ, t)
        }
      } else {
        animationPhase.current = 'hold'
        phaseTime.current = 0
      }
    } else if (animationPhase.current === 'hold') {
      // Hold text with energetic movement
      const time = state.clock.elapsedTime
      for (let i = 0; i < pointCount * 3; i += 3) {
        const baseX = targetPositionsRef.current[i]
        const baseY = targetPositionsRef.current[i + 1]
        const baseZ = targetPositionsRef.current[i + 2]
        
        // More energetic floating/pulsing
        positions[i] = baseX + Math.sin(time * 3 + i * 0.1) * 0.02
        positions[i + 1] = baseY + Math.cos(time * 2.5 + i * 0.1) * 0.02
        positions[i + 2] = baseZ + Math.sin(time * 4 + i * 0.1) * 0.015
      }
      
      // After 1.5 seconds, explode for next sequence
      if (phaseTime.current > 1.5) {
        animationPhase.current = 'scatter'
        phaseTime.current = 0
      }
    }
    
    // Update current positions
    for (let i = 0; i < pointCount * 3; i += 3) {
      currentPositionsRef.current[i] = positions[i]
      currentPositionsRef.current[i + 1] = positions[i + 1]
      currentPositionsRef.current[i + 2] = positions[i + 2]
    }
    
    pointsRef.current.geometry.attributes.position.needsUpdate = true
  })
  
  if (!isVisible) return null
  
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={currentPositionsRef.current || new Float32Array(0)}
          count={pointCount}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        color="#FFFFFF"
        sizeAttenuation
        transparent
        opacity={1.0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
