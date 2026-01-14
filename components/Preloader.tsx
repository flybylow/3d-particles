'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import './Preloader.css'

interface PreloaderProps {
  onComplete: () => void
}

// Small particle system for preloader
function PreloaderParticles() {
  const pointsRef = useRef<THREE.Points>(null)
  const materialRef = useRef<THREE.PointsMaterial>(null)
  const particleCount = 150 // Small number for fast loading
  const radius = 0.3 // Small radius
  
  // Generate small sphere of particles
  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount; i++) {
      const r = radius * (0.5 + Math.random() * 0.5)
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      pos[i * 3 + 2] = r * Math.cos(phi)
    }
    return pos
  }, [particleCount, radius])

  useFrame((state) => {
    if (pointsRef.current) {
      // Gentle rotation
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.3
    }
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={particleCount}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        ref={materialRef}
        size={0.015}
        color="#88927D"
        sizeAttenuation
        transparent
        opacity={0.8}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

export function Preloader({ onComplete }: PreloaderProps) {
  const [progress, setProgress] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    console.log('[Preloader] Started')
    // Fast loading simulation - complete in 0.8-1.2 seconds
    const duration = 800 + Math.random() * 400
    const startTime = Date.now()
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const newProgress = Math.min(elapsed / duration, 1)
      setProgress(newProgress)
      
      if (newProgress >= 1) {
        clearInterval(interval)
        setIsComplete(true)
        console.log('[Preloader] Complete')
        setTimeout(() => {
          onComplete()
        }, 200) // Small delay for smooth transition
      }
    }, 16) // ~60fps updates
    
    return () => clearInterval(interval)
  }, [onComplete])

  if (isComplete) return null

  return (
    <div className="preloader">
      <div className="preloader-content">
        <div className="preloader-canvas">
          <Canvas
            camera={{ position: [0, 0, 1], fov: 50 }}
            gl={{ antialias: true, alpha: true }}
            dpr={[1, 1.5]}
          >
            <PreloaderParticles />
          </Canvas>
        </div>
        <div className="preloader-progress">
          <div 
            className="preloader-progress-bar" 
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}
