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

// Persuasion Sequence: Anxiety → Relief → Delight
// Copy Rhythm: "Scan." → "Any product." → "Verify." → "Trusted."
const PHASES = {
  chaos: {
    headline: 'Scan.', // 0s - The command
    subline: ''
  },
  failedScan: {
    headline: 'Any product.', // 2s - The scope (over chaos)
    subline: ''
  },
  scanning: {
    headline: 'Any product.', // Maintain during lightning awakening
    subline: ''
  },
  barcode: {
    headline: '', // Formation - let visuals speak
    subline: ''
  },
  holding: {
    headline: 'Verify.', // 8s - Process confirmed
    subline: ''
  },
  transforming: {
    headline: 'Verify.', // Maintain during transformation
    subline: ''
  },
  product: {
    headline: 'Trusted.', // 11.5s - Outcome, resolution
    subline: ''
  }
}

export function HomepageHero() {
  const [phase, setPhase] = useState('chaos')
  const [currentProduct, setCurrentProduct] = useState(PRODUCTS[0])
  const [productCycle, setProductCycle] = useState(0) // Track which cycle we're on
  const [showText, setShowText] = useState(true) // Start with text visible
  
  const handlePhaseChange = (newPhase: string, productIndex: number) => {
    setPhase(newPhase)
    setCurrentProduct(PRODUCTS[productIndex])
    
    // Track product cycles
    if (newPhase === 'product' && productIndex !== 0) {
      setProductCycle(prev => prev + 1)
    } else if (newPhase === 'chaos' && productIndex === 0) {
      setProductCycle(0) // Reset on loop back to first product
    }
    
    // Text is always visible, content changes based on phase
    setShowText(true)
  }
  
  // Get the appropriate copy based on phase and cycle
  const getCurrentHeadline = () => {
    if (phase === 'product' && productCycle > 0) {
      // Alternate text for subsequent products
      return 'Verified.'
    }
    return PHASES[phase as keyof typeof PHASES]?.headline || ''
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
        <h1>{getCurrentHeadline()}</h1>
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

