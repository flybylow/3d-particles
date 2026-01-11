'use client'

import { useState, useEffect, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { HeroAnimation, preloadProducts } from './HeroAnimation'
import './HomepageHero.css'

interface Product {
  name: string
  modelPath: string
  category: string
}

const PRODUCTS: Product[] = [
  {
    name: 'Chocolate',
    modelPath: '/models/chocolate-bar.glb',
    category: 'Food & Beverage'
  },
  {
    name: 'Battery',
    modelPath: '/models/battery.glb',
    category: 'Electronics'
  },
  {
    name: 'Garment',
    modelPath: '/models/garment.glb',
    category: 'Textiles'
  }
]

// Preload
preloadProducts(PRODUCTS)

const PHASES = {
  barcode: {
    headline: '',
    subline: ''
  },
  scatter: {
    headline: '',
    subline: ''
  },
  forming: {
    headline: '',
    subline: ''
  },
  product: {
    headline: 'Know your product.',
    subline: ''
  },
  hold: {
    headline: 'Know your product.',
    subline: ''
  }
}

export function HomepageHero() {
  const [phase, setPhase] = useState('barcode')
  const [currentProduct, setCurrentProduct] = useState(PRODUCTS[0])
  const [showText, setShowText] = useState(false)
  const [cycleCount, setCycleCount] = useState(0)
  
  const handlePhaseChange = (newPhase: string, productIndex: number) => {
    setPhase(newPhase)
    setCurrentProduct(PRODUCTS[productIndex])
    
    // Show text when product is formed
    if (newPhase === 'product') {
      setShowText(true)
    } else if (newPhase === 'scatter') {
      setShowText(false)
      if (productIndex === 0) {
        setCycleCount(c => c + 1)
      }
    }
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
          <color attach="background" args={['#08080c']} />
          
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
      
      {/* Text Overlay */}
      <div className={`hero-text ${showText ? 'visible' : ''}`}>
        <h1>Know your product.</h1>
      </div>
      
      {/* Product Label */}
      <div className={`product-label ${phase === 'product' || phase === 'hold' ? 'visible' : ''}`}>
        <span className="product-category">{currentProduct.category}</span>
        <span className="product-name">{currentProduct.name}</span>
      </div>
      
      {/* Bottom tagline - appears after first full cycle */}
      <div className={`hero-tagline ${cycleCount > 0 ? 'visible' : ''}`}>
        <p>Digital Product Passports for the EU economy</p>
      </div>
      
      {/* Scroll indicator */}
      <div className="scroll-indicator">
        <div className="scroll-line"></div>
      </div>
    </section>
  )
}

