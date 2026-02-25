'use client'

import { useState, Suspense, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import Link from 'next/link'
import { HeroAnimation } from './HeroAnimation'
import { Preloader } from './Preloader'
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

// Preload all models
preloadWineBottle()
preloadBattery()
preloadTShirt()

// Flow: Intro (chaos) → Barcode → Trust → Product cycling
// Copy: "Scan any product." → "Trust the product." → Product labels
const PHASES = {
  intro: {
    headline: 'Scan any product.', // 0-1.2s: Text visible
    subline: ''
  },
  trust: {
    headline: 'Trust the product.', // After scan completes
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
  const [currentProductIndex, setCurrentProductIndex] = useState(0)
  const [showText, setShowText] = useState(true) // Start with text visible
  const [showIntroText, setShowIntroText] = useState(true) // Control "Scan any product" text separately
  const [textPhase, setTextPhase] = useState<'scan' | 'trust' | ''>('scan') // UI text phase
  
  // Manage text phases during intro
  useEffect(() => {
    if (phase === 'intro') {
      // Show "Scan any product." initially
      setTextPhase('scan')
      const hideScanTimer = setTimeout(() => {
        setShowIntroText(false)
      }, 1200) // Hide after 1.2s
      
      // Show "Trust the product." with enough time to read before phase change (intro ends at 3.5s)
      const trustTimer = setTimeout(() => {
        setTextPhase('trust')
      }, 2000) // ~1.5s visible before preload
      
      return () => {
        clearTimeout(hideScanTimer)
        clearTimeout(trustTimer)
      }
    } else {
      setTextPhase('')
      setShowIntroText(false)
    }
  }, [phase])

  const handlePhaseChange = (newPhase: string, productIndex: number) => {
    setPhase(newPhase)
    if (productIndex >= 0 && productIndex < PRODUCTS.length) {
      setCurrentProduct(PRODUCTS[productIndex])
      setCurrentProductIndex(productIndex)
    }
  }

  const handleTransitionStart = () => {
    setIsTransitioning(true)
  }

  const handleTransitionEnd = () => {
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
      
      {/* 3D Canvas */}
      <div className="hero-canvas">
        <Canvas
          camera={{ position: [0, 0, 5.5], fov: 50 }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
            preserveDrawingBuffer: false
          }}
          dpr={[1, 2]}
        >
          <Suspense fallback={null}>
            <HeroAnimation
              products={PRODUCTS}
              pointCount={20000}
              pointSize={0.012}
              onPhaseChange={handlePhaseChange}
              onTransitionStart={handleTransitionStart}
              onTransitionEnd={handleTransitionEnd}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* Text Overlay */}
      <div className={`hero-text ${textPhase !== '' ? 'visible' : ''}`}>
        <h1>
          {textPhase === 'scan' && PHASES.intro.headline}
          {textPhase === 'trust' && PHASES.trust.headline}
        </h1>
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
      {/* CTA - Center, visible during preload and cycling */}
      {(phase === 'cycling' || phase === 'preload') && (
        <div className="hero-cta">
          <div className="cta-content">
            <p className="cta-line-1">Every product has a story.</p>
            <p className="cta-line-3">Digital Product Passports</p>
            <p className="cta-line-4">for the circular economy.</p>
            <div className="cta-buttons">
              <a href="/producer" className="cta-button">I&apos;m a producer.</a>
              <Link href="/consumer" className="cta-button cta-button-secondary">I&apos;m a consumer.</Link>
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
