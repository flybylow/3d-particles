import { useRef, useMemo, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { generateChocolateBarPositions } from './ChocolateBarGeometry'
import { useWineBottlePositions } from './WineBottleGeometry'
import { useBatteryPositions } from './BatteryGeometry'

interface Product {
  name: string
  modelPath: string
  category: string
}

interface HeroAnimationProps {
  products: Product[]
  pointCount?: number
  pointSize?: number
  onPhaseChange?: (phase: string, productIndex: number) => void
}

// Generate scattered positions
function generateScatterPositions(pointCount: number, spread: number = 2.5): Float32Array {
  const positions: number[] = []
  
  for (let i = 0; i < pointCount; i++) {
    const r = spread * (0.3 + Math.random() * 0.7)
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    
    positions.push(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi)
    )
  }
  
  return new Float32Array(positions)
}

// Easing function for smoother animation
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

export function HeroAnimation({
  products,
  pointCount = 18000,
  pointSize = 0.008,
  onPhaseChange
}: HeroAnimationProps) {
  const pointsRef = useRef<THREE.Points>(null)
  const materialRef = useRef<THREE.PointsMaterial>(null)
  const [currentProductIndex, setCurrentProductIndex] = useState(0)
  const [phase, setPhase] = useState<'intro' | 'cycling'>('intro')
  const phaseStartTime = useRef(0)
  const productStartTime = useRef(0) // Track when current product started
  const rotationAngle = useRef(0) // Track rotation angle for center-axis rotation
  const { clock } = useThree()
  
  // Load all product models
  const wineBottle = useWineBottlePositions(pointCount)
  const battery = useBatteryPositions(pointCount)
  
  // Generate all position sets
  const positionSets = useMemo(() => {
    const scatter = generateScatterPositions(pointCount)
    // Map products: wine bottle first, then battery
    const productPositions = products.map((product, index) => {
      if (index === 0) return wineBottle
      if (index === 1) return battery
      return wineBottle // fallback
    })
    
    return { scatter, products: productPositions }
  }, [pointCount, products, wineBottle, battery])
  
  // Timeline configuration (in seconds) - RAPID PRODUCT CYCLING
  // Flow: Chaos background → "Scan any product" → Rapid product cycling
  const timeline = {
    intro: 3.5,              // 0-3.5s: Intro with chaos, text appears
    productDuration: 2.5,    // Time to show each product (transform + display)
    transformDuration: 1.0   // Time to morph between products
  }
  
  // Color states for emotional journey
  const colors = {
    chaosWarm: new THREE.Color(0xFF6B35),      // Warm amber (error state)
    scanLight: new THREE.Color(0x4CC9F0),      // Blue-white (scanning)
    verifiedCool: new THREE.Color(0x88927D),   // Sage green (success)
    offWhite: new THREE.Color(0xF8F8F7)        // Clean white
  }
  
  // Initialize positions - Start with CHAOS
  const currentPositions = useMemo(() => {
    return positionSets.scatter.slice()
  }, [positionSets])
  
  // Phase management
  useEffect(() => {
    phaseStartTime.current = clock.elapsedTime
  }, [phase, clock])
  
  // Main animation loop
  useFrame((state, delta) => {
    if (!pointsRef.current) return
    
    const elapsed = state.clock.elapsedTime - phaseStartTime.current
    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array
    
    // NEW FLOW: Chaos background → Rapid product cycling
    let target: Float32Array
    let progress = 0
    let shouldRotate = false
    let particleColor = colors.offWhite
    let chaosOpacity = 0.4 // Background chaos particles
    let productOpacity = 0 // Center product particles
    
    switch (phase) {
      case 'intro':
        // Intro: Chaos background, then start morphing to first product
        const morphStartTime = timeline.intro - 1.2 // Start morphing 1.2s before end
        
        if (elapsed < morphStartTime) {
          // Pure chaos phase
          target = positionSets.scatter
          progress = 1
          particleColor = colors.chaosWarm
          
          // Gentle floating movement
          if (pointsRef.current) {
            pointsRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.05
          }
        } else {
          // Morphing from chaos to first product
          const morphElapsed = elapsed - morphStartTime
          const morphProgress = easeInOutCubic(Math.min(morphElapsed / 1.2, 1))
          
          target = positionSets.products[0]
          progress = morphProgress
          particleColor = new THREE.Color().lerpColors(
            colors.chaosWarm,
            colors.offWhite,
            morphProgress
          )
          shouldRotate = morphProgress > 0.5 // Start rotating when halfway morphed
        }
        
        if (elapsed > timeline.intro) {
          setPhase('cycling')
          productStartTime.current = clock.elapsedTime
          setCurrentProductIndex(0)
          onPhaseChange?.('cycling', 0)
        }
        break
        
      case 'cycling':
        // Rapid product cycling: Products morph directly into each other
        const productElapsed = clock.elapsedTime - productStartTime.current
        const nextProductIndex = (currentProductIndex + 1) % products.length
        
        // Check if we're in transformation phase (last part of product cycle)
        const isTransforming = productElapsed > (timeline.productDuration - timeline.transformDuration)
        
        // Check if it's time to switch to next product
        if (productElapsed > timeline.productDuration) {
          setCurrentProductIndex(nextProductIndex)
          productStartTime.current = clock.elapsedTime
          onPhaseChange?.('cycling', nextProductIndex)
        }
        
        if (isTransforming) {
          // Morphing from current product to NEXT product
          const transformElapsed = productElapsed - (timeline.productDuration - timeline.transformDuration)
          const morphT = easeInOutCubic(transformElapsed / timeline.transformDuration)
          
          // Blend between current and next product
          const currentTarget = positionSets.products[currentProductIndex]
          const nextTarget = positionSets.products[nextProductIndex]
          
          // Create blended target positions
          target = new Float32Array(pointCount * 3)
          for (let i = 0; i < target.length; i++) {
            target[i] = THREE.MathUtils.lerp(currentTarget[i], nextTarget[i], morphT)
          }
          
          progress = 1 // We're manually blending, so set progress to 1
          particleColor = colors.offWhite
          shouldRotate = true
        } else {
          // Holding current product
          target = positionSets.products[currentProductIndex]
          progress = 1
          particleColor = colors.offWhite
          shouldRotate = true
        }
        break
        
      default:
        target = positionSets.scatter
        progress = 1
    }
    
    // Update particle color
    if (materialRef.current) {
      materialRef.current.color.lerp(particleColor, delta * 3)
      // Update opacity based on phase
      materialRef.current.opacity = phase === 'intro' ? chaosOpacity : 0.92
    }
    
    // Interpolate positions with staggered timing
    // Apply uniform Y offset for products (all objects centered at origin by default)
    const productYOffset = -1.2 // Vertical position adjustment for larger products
    
    for (let i = 0; i < positions.length; i += 3) {
      const pointIndex = i / 3
      const stagger = (pointIndex / pointCount) * 0.3
      const localProgress = Math.max(0, Math.min(1, (progress - stagger) / (1 - stagger)))
      
      for (let j = 0; j < 3; j++) {
        const idx = i + j
        let targetValue = target[idx]
        
        // Apply vertical offset for product phases (Y coordinate)
        if (j === 1 && phase === 'cycling') {
          targetValue += productYOffset
        }
        
        positions[idx] = THREE.MathUtils.lerp(
          positions[idx],
          targetValue,
          localProgress * delta * 8
        )
      }
    }
    
    pointsRef.current.geometry.attributes.position.needsUpdate = true
    
    // Rotation during product cycling - rotate around product's center vertical axis
    if (shouldRotate && phase === 'cycling') {
      // Increment rotation angle
      rotationAngle.current += delta * 0.5 // Faster rotation for dynamic feel
      
      const cos = Math.cos(rotationAngle.current)
      const sin = Math.sin(rotationAngle.current)
      const productYOffset = -1.2 // Same offset as above for consistency
      
      // Apply rotation to target positions (not accumulated positions)
      for (let i = 0; i < positions.length; i += 3) {
        const targetX = target[i]
        const targetZ = target[i + 2]
        
        // Rotate around Y axis (vertical center)
        positions[i] = targetX * cos - targetZ * sin
        positions[i + 1] = target[i + 1] + productYOffset // Apply Y offset
        positions[i + 2] = targetX * sin + targetZ * cos
      }
      
      pointsRef.current.geometry.attributes.position.needsUpdate = true
    } else if (rotationAngle.current !== 0) {
      // Reset rotation when not in product phase
      rotationAngle.current = 0
    }
  })
  
  return (
    <>
      {/* Particle system */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={currentPositions}
            count={pointCount}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          ref={materialRef}
          size={pointSize}
          color="#F8F8F7"
          sizeAttenuation
          transparent
          opacity={0.92}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </>
  )
}


