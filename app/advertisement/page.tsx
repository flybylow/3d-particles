'use client'

import { useState, useEffect, Suspense } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { AdvertisementParticles } from './AdvertisementParticles'
import './advertisement.css'

// Dynamic camera movement
function CameraController() {
  const { camera } = useThree()
  
  useFrame((state) => {
    const time = state.clock.elapsedTime
    // Subtle camera movement for dynamism
    camera.position.x = Math.sin(time * 0.3) * 0.1
    camera.position.y = Math.cos(time * 0.2) * 0.1
    camera.position.z = 5 + Math.sin(time * 0.4) * 0.2
    camera.lookAt(0, 0, 0)
  })
  
  return null
}

const SEQUENCES = [
  {
    id: 'scan' as const,
    title: 'SCAN',
    duration: 2100, // Fast: 2.1 seconds (0.2s explode + 0.4s form + 1.5s hold)
  },
  {
    id: 'verify' as const,
    title: 'VERIFY',
    duration: 2100, // Fast: 2.1 seconds
  },
  {
    id: 'trust' as const,
    title: 'TRUST',
    duration: 2100, // Fast: 2.1 seconds
  },
]

export default function AdvertisementPage() {
  const [currentSequence, setCurrentSequence] = useState(0)
  const [isVisible, setIsVisible] = useState(true)
  const [flash, setFlash] = useState(false)

  useEffect(() => {
    const sequence = SEQUENCES[currentSequence]
    if (!sequence) return

    // Move to next sequence faster
    const nextTimer = setTimeout(() => {
      setIsVisible(false)
      setFlash(true) // Flash on transition
      setTimeout(() => {
        setCurrentSequence((prev) => (prev + 1) % SEQUENCES.length)
        setIsVisible(true)
        setTimeout(() => setFlash(false), 100) // Flash duration
      }, 150) // Quick transition
    }, sequence.duration)

    return () => {
      clearTimeout(nextTimer)
    }
  }, [currentSequence])

  const currentSeq = SEQUENCES[currentSequence]

  return (
    <div className={`advertisement-page ${flash ? 'flash' : ''}`}>
      {/* 3D Particle Canvas */}
      <div className="advertisement-canvas">
        <Canvas
          camera={{ position: [0, 0, 5], fov: 50 }}
          gl={{ 
            antialias: false,
            alpha: true,
            powerPreference: 'high-performance'
          }}
          dpr={1}
        >
          <CameraController />
          <Suspense fallback={null}>
            <AdvertisementParticles
              sequence={currentSeq.id}
              isVisible={isVisible}
            />
          </Suspense>
          <ambientLight intensity={0.5} />
        </Canvas>
      </div>

      {/* Text Overlay - Large and bold */}
      <div className={`advertisement-content ${isVisible ? 'visible' : ''}`}>
        <h1 className="advertisement-title">{currentSeq?.title || 'SCAN'}</h1>
      </div>
    </div>
  )
}
