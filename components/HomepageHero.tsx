'use client'

import { useState, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { HeroAnimation } from './HeroAnimation'
import { preloadWineBottle } from './WineBottleGeometry'
import { preloadBattery } from './BatteryGeometry'
import './HomepageHero.css'

interface Product {
  name: string
  modelPath: string
  category: string
}

// Two products: wine bottle and battery
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
  }
]

// Preload both models
preloadWineBottle()
preloadBattery()

// Three Act Narrative Structure
const PHASES = {
  chaos: {
    headline: 'too much product info',
    subline: ''
  },
  coalescing: {
    headline: 'too much product info',
    subline: ''
  },
  barcode: {
    headline: 'One scan.',
    subline: ''
  },
  transforming: {
    headline: 'One scan.',
    subline: ''
  },
  product: {
    headline: 'Know your product.',
    subline: ''
  }
}

export function HomepageHero() {
  const [phase, setPhase] = useState('chaos')
  const [currentProduct, setCurrentProduct] = useState(PRODUCTS[0])
  const [showText, setShowText] = useState(true) // Start with text visible
  
  const handlePhaseChange = (newPhase: string, productIndex: number) => {
    setPhase(newPhase)
    setCurrentProduct(PRODUCTS[productIndex])
    
    // Text is always visible, content changes based on phase
    setShowText(true)
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
      
      {/* Text Overlay - Three Act Narrative */}
      <div className={`hero-text ${showText ? 'visible' : ''}`}>
        <h1>{PHASES[phase as keyof typeof PHASES]?.headline || 'Know your product.'}</h1>
      </div>
      
      {/* Product Label - Only show in product phase */}
      <div className={`product-label ${phase === 'product' ? 'visible' : ''}`}>
        <span className="product-category">{currentProduct.category}</span>
        <span className="product-name">{currentProduct.name}</span>
      </div>
      
      {/* Bottom tagline */}
      <div className={`hero-tagline ${phase === 'product' ? 'visible' : ''}`}>
        <p>Digital Product Passports for the EU economy</p>
      </div>
      
      {/* Scroll indicator */}
      <div className="scroll-indicator">
        <div className="scroll-line"></div>
      </div>
    </section>
  )
}

