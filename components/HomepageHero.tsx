'use client'

import { useState, Suspense, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { HeroAnimation } from './HeroAnimation'
import { ProductInfoTile } from './ProductInfoTile'
import { Preloader } from './Preloader'
import { MetadataCloud } from './MetadataCloud'
import { ProductDetailsFlow } from './ProductDetailsFlow'
import { FlowBackground } from './FlowBackground'
import { preloadWineBottle } from './WineBottleGeometry'
import { preloadBattery } from './BatteryGeometry'
import { preloadTShirt } from './TShirtGeometry'
import './HomepageHero.css'

interface Product {
  name: string
  modelPath: string
  category: string
  co2?: string
  materials?: string[]
  origin?: string
  certifications?: string[]
}

// Three products: wine bottle, battery, and t-shirt
const PRODUCTS: Product[] = [
  {
    name: 'Wine Bottle',
    modelPath: '/models/wine-bottle.gltf',
    category: 'Food & Beverage',
    co2: '0.8 kg CO₂',
    materials: ['Glass', 'Cork', 'Label Paper'],
    origin: 'France',
    certifications: ['Organic', 'Fair Trade']
  },
  {
    name: '12V Battery',
    modelPath: '/models/batt2.gltf',
    category: 'Automotive',
    co2: '12.5 kg CO₂',
    materials: ['Lead', 'Sulfuric Acid', 'Polypropylene'],
    origin: 'Germany',
    certifications: ['Recyclable', 'EU Compliant']
  },
  {
    name: 'T-Shirt',
    modelPath: '/models/scene.gltf',
    category: 'Fashion & Apparel',
    co2: '2.1 kg CO₂',
    materials: ['Organic Cotton', 'Polyester'],
    origin: 'Portugal',
    certifications: ['GOTS', 'OEKO-TEX']
  }
]

// Preload models sequentially to reduce memory pressure
// Load wine bottle immediately, others with delay
preloadWineBottle()
if (typeof window !== 'undefined') {
  setTimeout(() => preloadBattery(), 500)
  setTimeout(() => preloadTShirt(), 1000)
}

// Flow: Intro (chaos) → Barcode → Product cycling
// Copy: "Scan any product." → "Verify." → Product labels
const PHASES = {
  intro: {
    headline: 'Scan any product.', // 0-1.2s: Text visible, scanning continues to 3.5s
    subline: ''
  },
  barcode: {
    headline: 'Verify.', // 3.5-5.5s: Barcode formation
    subline: ''
  },
  cycling: {
    headline: '', // Let product labels speak
    subline: ''
  }
}

export function HomepageHero() {
  // Only show preloader on initial load, not on every reload
  const [isLoading, setIsLoading] = useState(true)
  const [phase, setPhase] = useState('intro')
  const [isTransitioning, setIsTransitioning] = useState(false)
  
  // Check sessionStorage after mount to avoid hydration mismatch
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasSeenPreloader = sessionStorage.getItem('preloader-shown')
      if (hasSeenPreloader) {
        setIsLoading(false)
      }
    }
  }, [])
  const [currentProduct, setCurrentProduct] = useState(PRODUCTS[0])
  const [showText, setShowText] = useState(true) // Start with text visible
  const [showIntroText, setShowIntroText] = useState(true) // Control "Scan any product" text separately
  
  // Hide "Scan any product" text after 1.2s, but keep animation running
  useEffect(() => {
    if (phase === 'intro') {
      const timer = setTimeout(() => {
        setShowIntroText(false)
      }, 1200) // Hide text after 1.2s
      return () => clearTimeout(timer)
    } else {
      setShowIntroText(false) // Keep hidden in other phases
    }
  }, [phase])
  
  const handlePhaseChange = (newPhase: string, productIndex: number) => {
    const productName = PRODUCTS[productIndex]?.name || 'unknown'
    console.log(`[HomepageHero] Phase: ${newPhase}, Product: ${productName} (${productIndex})`)
    setPhase(newPhase)
    if (productIndex >= 0 && productIndex < PRODUCTS.length) {
      setCurrentProduct(PRODUCTS[productIndex])
    }
  }
  
  const handleTransitionStart = () => {
    console.log('[HomepageHero] Transition START')
    setIsTransitioning(true)
  }
  
  const handleTransitionEnd = () => {
    console.log('[HomepageHero] Transition END')
    setIsTransitioning(false)
  }
  
  const handlePreloaderComplete = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('preloader-shown', 'true')
    }
    setIsLoading(false)
  }
  
  if (isLoading) {
    return <Preloader onComplete={handlePreloaderComplete} />
  }
  
  return (
    <section className="homepage-hero">
      {/* Flowing Background Animation */}
      <FlowBackground
        productIndex={PRODUCTS.findIndex(p => p.name === currentProduct.name)}
        isVisible={phase === 'preload' || phase === 'cycling' || isTransitioning}
      />

      {/* Product Info Panels - Multiple panels with information */}
      <ProductInfoTile
        product={(phase === 'preload' || phase === 'cycling' || isTransitioning) ? currentProduct : null}
        phase={phase}
        productIndex={PRODUCTS.findIndex(p => p.name === currentProduct.name)}
        isTransitioning={isTransitioning}
      />

      {/* Detailed Product Information Flow - Only show after main panel */}
      <ProductDetailsFlow
        product={(phase === 'cycling') ? currentProduct : null}
        productIndex={PRODUCTS.findIndex(p => p.name === currentProduct.name)}
      />
      
      {/* 3D Canvas */}
      <div className="hero-canvas">
        <Canvas
          camera={{ position: [0, 0, 5.5], fov: 50 }}
          gl={{ 
            antialias: false, // Disabled to save memory
            alpha: true, 
            powerPreference: 'high-performance',
            preserveDrawingBuffer: false
          }}
          dpr={1} // Fixed DPR to 1 to save memory
        >
          <Suspense fallback={null}>
            <HeroAnimation
              products={PRODUCTS}
              pointCount={4000} // Reduced to 4000 to prevent WebAssembly memory errors
              pointSize={0.012}
              onPhaseChange={handlePhaseChange}
              onTransitionStart={handleTransitionStart}
              onTransitionEnd={handleTransitionEnd}
            />
            {/* Metadata cloud - COMPLETELY DISABLED to fix huge lines vectors */}
            {/* {(phase === 'preload' || phase === 'cycling') && currentProduct && (
              <MetadataCloud
                product={currentProduct}
                productIndex={PRODUCTS.findIndex(p => p.name === currentProduct.name)}
              />
            )} */}
          </Suspense>
        </Canvas>
      </div>
      
      {/* Text Overlay */}
      <div className={`hero-text ${(phase === 'intro' && showIntroText) || phase === 'barcode' ? 'visible' : ''}`}>
        <h1>{PHASES[phase as keyof typeof PHASES]?.headline || ''}</h1>
      </div>
      
      {/* Bottom tagline - Shows product info during cycling, otherwise main tagline */}
      <div className={`hero-tagline visible`}>
        {phase === 'cycling' ? (
          <div className="product-tag">
            <span className="product-category">{currentProduct.category}</span>
            <span className="product-name">{currentProduct.name}</span>
          </div>
        ) : (
          <p>Digital Product Passports</p>
        )}
      </div>
      
      {/* CTA - Right side */}
      {(phase === 'cycling' || phase === 'preload') && (
        <div className="hero-cta">
          <div className="cta-content">
            <p className="cta-line-1">Every product has a story.</p>
            <p className="cta-line-2">Now you can trace it.</p>
            <p className="cta-line-3">Digital Product Passports</p>
            <p className="cta-line-4">for the circular economy.</p>
            <div className="cta-buttons">
              <a href="#" className="cta-button">I'm a producer.</a>
              <a href="#" className="cta-button cta-button-secondary">I'm a consumer.</a>
            </div>
          </div>
        </div>
      )}
      
      {/* Scroll indicator */}
      <div className="scroll-indicator">
        <div className="scroll-line"></div>
      </div>
    </section>
  )
}

