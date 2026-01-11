'use client'

import { useState, Suspense } from 'react'
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

// NEW FLOW: Chaos background → Rapid product cycling
// Copy: "Scan any product." → Product labels (check, check, check!)
const PHASES = {
  intro: {
    headline: 'Scan any product.', // 0-2.5s: Intro with chaos background
    subline: ''
  },
  cycling: {
    headline: '', // Let product labels speak
    subline: ''
  }
}

export function HomepageHero() {
  const [phase, setPhase] = useState('intro')
  const [currentProduct, setCurrentProduct] = useState(PRODUCTS[0])
  const [showText, setShowText] = useState(true) // Start with text visible
  
  const handlePhaseChange = (newPhase: string, productIndex: number) => {
    setPhase(newPhase)
    setCurrentProduct(PRODUCTS[productIndex])
  }
  
  return (
    <section className="homepage-hero">
      {/* 3D Canvas */}
      <div className="hero-canvas">
        <Canvas
          camera={{ position: [0, 0, 3.5], fov: 50 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          dpr={[1, 2]}
        >
          <color attach="background" args={['#1A1A1A']} />
          
          <Suspense fallback={null}>
            <HeroAnimation
              products={PRODUCTS}
              pointCount={20000}
              pointSize={0.006}
              onPhaseChange={handlePhaseChange}
            />
          </Suspense>
        </Canvas>
      </div>
      
      {/* Text Overlay - "Scan any product." */}
      <div className={`hero-text ${phase === 'intro' ? 'visible' : ''}`}>
        <h1>{PHASES[phase as keyof typeof PHASES]?.headline || ''}</h1>
      </div>
      
      {/* Product Label - Show during rapid cycling (check, check, check!) */}
      <div className={`product-label ${phase === 'cycling' ? 'visible' : ''}`}>
        <span className="product-category">{currentProduct.category}</span>
        <span className="product-name">{currentProduct.name}</span>
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

