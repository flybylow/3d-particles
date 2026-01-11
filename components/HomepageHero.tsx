'use client'

import { useState, Suspense, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { HeroAnimation } from './HeroAnimation'
import { preloadWineBottle } from './WineBottleGeometry'
import { preloadBattery } from './BatteryGeometry'
import { preloadTShirt } from './TShirtGeometry'
import './HomepageHero.css'

interface Product {
  name: string
  modelPath: string
  category: string
}

// Three products: wine bottle, battery, and t-shirt
const PRODUCTS: Product[] = [
  {
    name: 'Wine Bottle',
    modelPath: '/models/wine-bottle.gltf',
    category: 'Food & Beverage'
  },
  {
    name: '12V Battery',
    modelPath: '/models/batt2.gltf',
    category: 'Automotive'
  },
  {
    name: 'T-Shirt',
    modelPath: '/models/scene.gltf',
    category: 'Fashion & Apparel'
  }
]

// Preload all models
preloadWineBottle()
preloadBattery()
preloadTShirt()

// 5-Act Structure (per spec)
// Copy timing:
// "Scan." (0s) → "Any product." (1.5s) → "Verify." (5s) → "Trusted." (7.5s)
export function HomepageHero() {
  const [phase, setPhase] = useState('chaos')
  const [headline, setHeadline] = useState('')
  const [showHeadline, setShowHeadline] = useState(false)
  
  const handlePhaseChange = (newPhase: string, productIndex: number) => {
    setPhase(newPhase)
    
    // Update headline based on phase (per spec timing)
    switch (newPhase) {
      case 'chaos':
        setHeadline('Scan.')
        setShowHeadline(true)
        break
      case 'barcode':
        setHeadline('Verify.')
        setShowHeadline(true)
        break
      case 'product':
        setHeadline('Trusted.')
        setShowHeadline(true)
        break
      case 'merge':
      case 'portal':
        setShowHeadline(false)
        break
      default:
        setShowHeadline(false)
    }
  }
  
  // Initial "Scan." text, then "Any product." at 1.5s (per spec)
  useEffect(() => {
    setHeadline('Scan.')
    setShowHeadline(true)
    
    const timer1 = setTimeout(() => {
      setHeadline('Any product.')
    }, 1500)
    
    return () => {
      clearTimeout(timer1)
    }
  }, [])
  
  return (
    <section className="homepage-hero">
      {/* 3D Canvas */}
      <div className="hero-canvas">
        <Canvas
          camera={{ position: [0, 0, -50], fov: 60 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          dpr={[1, 2]}
        >
          <color attach="background" args={['#1A1A1A']} />
          
          <Suspense fallback={null}>
            <HeroAnimation
              products={PRODUCTS}
              pointCount={20000}
              pointSize={0.012}
              onPhaseChange={handlePhaseChange}
            />
          </Suspense>
        </Canvas>
      </div>
      
      {/* Text Overlay - Per spec copy timing */}
      <div className={`hero-text ${showHeadline ? 'visible' : ''}`}>
        <h1>{headline}</h1>
      </div>
      
      {/* Bottom tagline - Always visible */}
      <div className={`hero-tagline visible`}>
        <p>Digital Product Passports for the EU economy</p>
      </div>
      
      {/* Scroll indicator */}
      <div className="scroll-indicator">
        <div className="scroll-line"></div>
      </div>
    </section>
  )
}
