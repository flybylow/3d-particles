'use client'

import { useEffect, useState, useRef, Suspense, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useWineBottlePositions } from './WineBottleGeometry'
import { useBatteryPositions } from './BatteryGeometry'
import { useTShirtPositions } from './TShirtGeometry'
import './ProductInfoTile.css'
import './ProductInfoPanel.css'

interface Product {
  name: string
  modelPath: string
  category: string
  co2?: string
  materials?: string[]
  origin?: string
  certifications?: string[]
}

interface ProductInfoTileProps {
  product: Product | null
  phase: string
  productIndex: number
  isTransitioning?: boolean
}

// Particle-based product photo for passport - uses same particles as main animation
function PassportParticlePhoto({ productIndex }: { productIndex: number }) {
  const pointsRef = useRef<THREE.Points>(null)
  const rotationAngle = useRef(0)
  const basePositionsRef = useRef<Float32Array | null>(null)
  
  // Use same particle count as main animation but scaled down for passport
  const passportPointCount = 1000 // Reduced to prevent WebAssembly memory errors
  
  // Load product positions based on index
  const wineBottle = useWineBottlePositions(passportPointCount)
  const battery = useBatteryPositions(passportPointCount)
  const tshirt = useTShirtPositions(passportPointCount)
  
  // Get positions for current product
  const productPositions = useMemo(() => {
    if (productIndex === 0) return wineBottle
    if (productIndex === 1) return battery
    if (productIndex === 2) return tshirt
    return wineBottle
  }, [productIndex, wineBottle, battery, tshirt])
  
  // Transform positions for passport photo (smaller scale, centered) - only when product changes
  const transformedPositions = useMemo(() => {
    if (productPositions.length === 0) return new Float32Array(0)
    
    const positions = new Float32Array(productPositions.length)
    
    // Calculate bounding box
    let minX = Infinity, maxX = -Infinity
    let minY = Infinity, maxY = -Infinity
    let minZ = Infinity, maxZ = -Infinity
    
    for (let i = 0; i < productPositions.length; i += 3) {
      minX = Math.min(minX, productPositions[i])
      maxX = Math.max(maxX, productPositions[i])
      minY = Math.min(minY, productPositions[i + 1])
      maxY = Math.max(maxY, productPositions[i + 1])
      minZ = Math.min(minZ, productPositions[i + 2])
      maxZ = Math.max(maxZ, productPositions[i + 2])
    }
    
    const centerX = (minX + maxX) / 2
    const centerY = (minY + maxY) / 2
    const centerZ = (minZ + maxZ) / 2
    
    const sizeX = maxX - minX
    const sizeY = maxY - minY
    const sizeZ = maxZ - minZ
    const maxDim = Math.max(sizeX, sizeY, sizeZ)
    
    // Scale to fit passport photo (target size ~1.2 units)
    const scale = maxDim > 0 ? 1.2 / maxDim : 1
    
    // Center and scale
    for (let i = 0; i < productPositions.length; i += 3) {
      positions[i] = (productPositions[i] - centerX) * scale
      positions[i + 1] = (productPositions[i + 1] - centerY) * scale
      positions[i + 2] = (productPositions[i + 2] - centerZ) * scale
    }
    
    return positions
  }, [productPositions, productIndex])
  
  // Update base positions when transformed positions change
  useEffect(() => {
    if (transformedPositions.length > 0) {
      // Create a fresh copy of the base positions
      const baseCopy = new Float32Array(transformedPositions.length)
      for (let i = 0; i < transformedPositions.length; i++) {
        baseCopy[i] = transformedPositions[i]
      }
      basePositionsRef.current = baseCopy
      rotationAngle.current = 0 // Reset rotation when product changes
      
      // Also update the geometry positions immediately
      if (pointsRef.current) {
        const positions = pointsRef.current.geometry.attributes.position.array as Float32Array
        for (let i = 0; i < Math.min(baseCopy.length, positions.length); i++) {
          positions[i] = baseCopy[i]
        }
        pointsRef.current.geometry.attributes.position.needsUpdate = true
      }
    }
  }, [transformedPositions])
  
  // Cleanup: dispose geometry and material when component unmounts
  useEffect(() => {
    return () => {
      if (pointsRef.current) {
        if (pointsRef.current.geometry) {
          pointsRef.current.geometry.dispose()
        }
        if (pointsRef.current.material && pointsRef.current.material instanceof THREE.Material) {
          pointsRef.current.material.dispose()
        }
      }
    }
  }, [])
  
  // Animate rotation - same speed as main animation (delta * 0.5)
  useFrame((state, delta) => {
    if (!pointsRef.current || !basePositionsRef.current || basePositionsRef.current.length === 0) {
      return
    }
    
    // Cap delta to prevent large jumps (same as main animation would handle)
    const cappedDelta = Math.min(delta, 0.1)
    
    // Twice the rotation speed of main animation: delta * 1.0 (was 0.5)
    // T-shirt (index 2) has inverted coordinate system, so negate rotation
    const rotationDirection = productIndex === 2 ? -1 : 1
    rotationAngle.current += cappedDelta * 1.0 * rotationDirection
    
    const cos = Math.cos(rotationAngle.current)
    const sin = Math.sin(rotationAngle.current)
    
    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array
    const basePositions = basePositionsRef.current
    
    // Rotate positions around Y axis (exactly same as main animation)
    const length = Math.min(basePositions.length, positions.length)
    for (let i = 0; i < length; i += 3) {
      const x = basePositions[i]
      const z = basePositions[i + 2]
      
      // Rotate around Y axis (same formula as main animation)
      positions[i] = x * cos - z * sin
      positions[i + 1] = basePositions[i + 1] // Y stays the same
      positions[i + 2] = x * sin + z * cos
    }
    
    pointsRef.current.geometry.attributes.position.needsUpdate = true
  })


  if (transformedPositions.length === 0) {
    return null
  }

  return (
    <>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={transformedPositions}
            count={passportPointCount}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.015}
          color="#F8F8F7"
          sizeAttenuation
          transparent
          opacity={0.95}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          wireframe={false} // Ensure wireframe is disabled
        />
      </points>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <directionalLight position={[-5, 3, -5]} intensity={0.4} />
    </>
  )
}

// Image fallback component
function ProductImage({ productName }: { productName: string }) {
  // Generate a simple placeholder or use product name
  const imageMap: Record<string, string> = {
    'Wine Bottle': '🍷',
    '12V Battery': '🔋',
    'T-Shirt': '👕'
  }
  
  return (
    <div className="product-image-fallback">
      <div className="product-emoji">{imageMap[productName] || '📦'}</div>
      <div className="product-name-small">{productName}</div>
    </div>
  )
}

export function ProductInfoTile({ product, phase, productIndex, isTransitioning = false }: ProductInfoTileProps) {
  const [displayProduct, setDisplayProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})
  const prevProductNameRef = useRef<string | null>(null)
  
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  // Show passport card only for battery (preload) and cycling products, NOT during intro
  const shouldShowPassport = product && (phase === 'preload' || phase === 'cycling')
  
  // Update displayProduct ONLY when product name actually changes
  useEffect(() => {
    if (shouldShowPassport && product) {
      const productName = product.name
      if (prevProductNameRef.current !== productName) {
        setIsLoading(true)
        // Small delay to show loading state
        setTimeout(() => {
          setDisplayProduct(product)
          prevProductNameRef.current = productName
          setIsLoading(false)
        }, 200)
      }
    } else {
      if (displayProduct) {
        setDisplayProduct(null)
        prevProductNameRef.current = null
        setIsLoading(false)
      }
    }
  }, [product, shouldShowPassport, displayProduct])

  // Don't render if no product data
  if (!displayProduct || !shouldShowPassport) {
    return null
  }

  return (
    <>
      {/* Tiny ID card - just basic info */}
      <div className="digital-product-passport-container">
        <div className="info-card passport-card-tiny">
          <div className="card-background">
            <div className="card-pattern"></div>
            <div className="card-border"></div>
          </div>
          <div className="card-content">
            {/* Header */}
            <div className="card-header">
              <div className="card-title">Digital Product Passport</div>
              <div className="card-subtitle">{displayProduct.name}</div>
            </div>

            {/* Tiny body: Photo on left, Basic info on right */}
            <div className="passport-body-tiny">
              {/* Left: Photo */}
              <div className="passport-photo-section">
                <div className="photo-frame">
                  <div className="animation-container">
                    <Suspense fallback={<ProductImage productName={displayProduct.name} />}>
                      <Canvas
                        key={`particles-${productIndex}`}
                        camera={{ position: [0, 0, 2.5], fov: 45 }}
                        gl={{ 
                          antialias: false, 
                          alpha: true, 
                          powerPreference: 'high-performance',
                          preserveDrawingBuffer: false // Prevent memory accumulation
                        }}
                        style={{ width: '100%', height: '100%', background: 'transparent' }}
                        dpr={1}
                      >
                        <PassportParticlePhoto productIndex={productIndex} />
                      </Canvas>
                    </Suspense>
                  </div>
                </div>
              </div>

              {/* Right: Basic Info Only */}
              <div className="passport-info-section-tiny">
                <div className="info-line">
                  <span className="info-label">CATEGORY</span>
                  <span className="info-value">{displayProduct.category}</span>
                </div>
                {displayProduct.origin && (
                  <div className="info-line">
                    <span className="info-label">ORIGIN</span>
                    <span className="info-value">{displayProduct.origin}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metadata cloud - positioned in 3D space via MetadataCloud component */}
    </>
  )
}
