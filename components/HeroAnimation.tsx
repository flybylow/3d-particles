import { useRef, useMemo, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { generateChocolateBarPositions } from './ChocolateBarGeometry'
import { useWineBottlePositions } from './WineBottleGeometry'
import { useBatteryPositions } from './BatteryGeometry'
import { useTShirtPositions } from './TShirtGeometry'
import { ElectricScanMaterial } from './ElectricScanShader'

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

// Generate barcode positions (vertical bars)
function generateBarcodePositions(pointCount: number): Float32Array {
  const positions: number[] = []
  
  // Barcode dimensions (centered at origin) - larger and clearer
  const width = 2.4 // Increased total width for better visibility
  const height = 1.2 // Increased height for better proportions
  const barCount = 25 // Fewer bars for cleaner look (was 30)
  const baseBarWidth = width / barCount
  
  // Simple alternating pattern - thin/thick bars like real barcode
  const barWidths: number[] = []
  for (let i = 0; i < barCount; i++) {
    // More distinct pattern: thin (1x) and thick (2x) bars
    const barWidth = (i % 3 === 0) ? baseBarWidth * 2.0 : baseBarWidth * 1.0
    barWidths.push(barWidth)
  }
  
  // Calculate total width
  const totalWidth = barWidths.reduce((sum, w) => sum + w, 0)
  let currentX = -totalWidth / 2
  
  // Distribute points across bars - tighter distribution for sharper bars
  for (let barIndex = 0; barIndex < barCount; barIndex++) {
    const barWidth = barWidths[barIndex]
    const barX = currentX + barWidth / 2
    const pointsPerBar = Math.floor(pointCount / barCount)
    
    // Create clean, uniform bars with tighter distribution
    for (let i = 0; i < pointsPerBar; i++) {
      // Tighter X distribution (0.6 instead of 0.8) for sharper bars
      const x = barX + (Math.random() - 0.5) * barWidth * 0.6
      // Full height coverage
      const y = (Math.random() - 0.5) * height * 0.95
      const z = 0 // Flat barcode
      
      positions.push(x, y, z)
    }
    
    currentX += barWidth
  }
  
  // Fill remaining points
  while (positions.length / 3 < pointCount) {
    const barIndex = Math.floor((positions.length / 3) % barCount)
    const barWidth = barWidths[barIndex]
    const barX = -totalWidth / 2 + barWidths.slice(0, barIndex).reduce((sum, w) => sum + w, 0) + barWidth / 2
    
    const x = barX + (Math.random() - 0.5) * barWidth * 0.6
    const y = (Math.random() - 0.5) * height * 0.95
    const z = 0
    
    positions.push(x, y, z)
  }
  
  return new Float32Array(positions.slice(0, pointCount * 3))
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
  const pointsRef = useRef<THREE.Points>(null) // Chaos particles (background)
  const materialRef = useRef<THREE.PointsMaterial>(null)
  const barcodePointsRef = useRef<THREE.Points>(null) // Barcode particles (foreground, on top)
  const barcodeMaterialRef = useRef<THREE.PointsMaterial>(null)
  const scanLineRef = useRef<THREE.Group>(null)
  const scanMaterialRef = useRef<InstanceType<typeof ElectricScanMaterial>>(null)
  const [currentProductIndex, setCurrentProductIndex] = useState(0)
  const [phase, setPhase] = useState<'intro' | 'cycling'>('intro')
  const phaseStartTime = useRef(0)
  const productStartTime = useRef(0) // Track when current product started
  const rotationAngle = useRef(0) // Track rotation angle for center-axis rotation
  const { clock } = useThree()
  
  // Load all product models
  const wineBottle = useWineBottlePositions(pointCount)
  const battery = useBatteryPositions(pointCount)
  const tshirt = useTShirtPositions(pointCount)
  
  // Generate all position sets
  const positionSets = useMemo(() => {
    const scatter = generateScatterPositions(pointCount)
    const barcode = generateBarcodePositions(pointCount)
    // Map products: wine bottle first, then battery, then t-shirt
    const productPositions = products.map((product, index) => {
      if (index === 0) return wineBottle
      if (index === 1) return battery
      if (index === 2) return tshirt
      return wineBottle // fallback
    })
    
    return { scatter, barcode, products: productPositions }
  }, [pointCount, products, wineBottle, battery, tshirt])
  
  // Barcode positions (static, visible from start)
  const barcodePositions = useMemo(() => {
    return positionSets.barcode.slice()
  }, [positionSets])
  
  // Bar count constant (matches generateBarcodePositions)
  const BAR_COUNT = 25
  
  // Map particles to their bar index (for per-bar scaling animation)
  const barcodeBarIndices = useMemo(() => {
    const indices: number[] = []
    const pointsPerBar = Math.floor(pointCount / BAR_COUNT)
    for (let i = 0; i < pointCount; i++) {
      indices.push(Math.min(Math.floor(i / pointsPerBar), BAR_COUNT - 1))
    }
    return indices
  }, [pointCount])
  
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
    
    // Update scan line position during intro phase and barcode bar scaling
    let scanLineX = 0
    if (phase === 'intro' && scanLineRef.current) {
      const morphStartTime = timeline.intro - 1.2
      if (elapsed < morphStartTime) {
        // Scan line sweeps across during chaos phase
        const scanProgress = (elapsed % 2.5) / 2.5 // 2.5 second sweep cycle
        scanLineX = -3 + (scanProgress * 6) // Sweep from -3 to 3
        scanLineRef.current.position.x = scanLineX
        scanLineRef.current.visible = true
        
        // Update shader uniforms for electric effect
        if (scanMaterialRef.current) {
          scanMaterialRef.current.uniforms.uTime.value = state.clock.elapsedTime
          scanMaterialRef.current.uniforms.uIntensity.value = 1.0
        }
        
        // Calculate barcode dimensions for bar mapping
        const barcodeWidth = 2.4
        const barcodeBarWidth = barcodeWidth / BAR_COUNT
        const barcodeLeft = -barcodeWidth / 2
        
        // Scale bars as scan line passes (bars grow one-by-one by expanding positions)
        if (barcodePointsRef.current && barcodeMaterialRef.current) {
          const barcodeGeometry = barcodePointsRef.current.geometry
          const barcodePosArray = barcodeGeometry.attributes.position.array as Float32Array
          
          // Store original positions if not already stored
          if (!barcodeGeometry.userData.originalPositions) {
            barcodeGeometry.userData.originalPositions = new Float32Array(barcodePositions)
          }
          const originalPositions = barcodeGeometry.userData.originalPositions
          
          // Update positions to scale bars as scan line passes
          for (let i = 0; i < pointCount; i++) {
            const barIndex = barcodeBarIndices[i]
            const barLeft = barcodeLeft + (barIndex * barcodeBarWidth)
            const barRight = barLeft + barcodeBarWidth
            const barCenter = (barLeft + barRight) / 2
            
            // Distance from scan line to bar center
            const distFromScan = Math.abs(scanLineX - barCenter)
            const barWidth = barcodeBarWidth
            
            // Grow bar when scan line is near (expand horizontally)
            if (distFromScan < barWidth * 2.0) {
              // Scale factor: max when scan line is at bar center, falls off with distance
              const scaleFactor = 1.0 - (distFromScan / (barWidth * 2.0))
              const scale = 1.0 + (scaleFactor * 2.0) // Grow up to 3x width
              
              // Scale particle X position around bar center
              const origX = originalPositions[i * 3]
              const offsetX = origX - barCenter
              barcodePosArray[i * 3] = barCenter + offsetX * scale
              
              // Also scale Y slightly for vertical growth effect
              const origY = originalPositions[i * 3 + 1]
              barcodePosArray[i * 3 + 1] = origY * (1.0 + scaleFactor * 0.5)
            } else {
              // Reset to original position
              barcodePosArray[i * 3] = originalPositions[i * 3]
              barcodePosArray[i * 3 + 1] = originalPositions[i * 3 + 1]
            }
            // Z stays the same
            barcodePosArray[i * 3 + 2] = originalPositions[i * 3 + 2]
          }
          
          barcodeGeometry.attributes.position.needsUpdate = true
          
          // Keep barcode visible during scaling
          barcodeMaterialRef.current.opacity = 0.92
        }
      } else {
        // Hide scan line when morphing to product
        scanLineRef.current.visible = false
        // Hide barcode
        if (barcodeMaterialRef.current) {
          barcodeMaterialRef.current.opacity = 0
        }
      }
    } else {
      // Hide scan line and barcode in other phases
      if (scanLineRef.current) {
        scanLineRef.current.visible = false
      }
      if (barcodeMaterialRef.current) {
        barcodeMaterialRef.current.opacity = 0
      }
    }
    
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
          // Pure chaos phase - nervous/jittery particles
          target = positionSets.scatter
          progress = 1
          particleColor = colors.chaosWarm
          
          // Continuous rotation and drift for nervous movement
          if (pointsRef.current) {
            pointsRef.current.rotation.y = state.clock.elapsedTime * 0.1
            pointsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.05
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
          // Apply Y offset during morphing too to prevent jump
          // The Y offset will be applied in the interpolation loop
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
    const productYOffset = -0.5 // Vertical position adjustment for larger products (moved up from -1.2 to -1.0 to -0.5)
    
    for (let i = 0; i < positions.length; i += 3) {
      const pointIndex = i / 3
      const stagger = (pointIndex / pointCount) * 0.3
      const localProgress = Math.max(0, Math.min(1, (progress - stagger) / (1 - stagger)))
      
      for (let j = 0; j < 3; j++) {
        const idx = i + j
        let targetValue = target[idx]
        
        // Apply vertical offset for product phases (Y coordinate)
        // Apply during intro morphing too to prevent jump when transitioning to cycling
        if (j === 1 && (phase === 'cycling' || (phase === 'intro' && elapsed > timeline.intro - 1.2))) {
          targetValue += productYOffset
        }
        
        // Add nervous/jittery drift to particles during intro chaos phase
        if (phase === 'intro' && elapsed < timeline.intro - 1.2) {
          const driftSpeed = 0.5 + (pointIndex % 3) * 0.2 // Vary speed per particle
          const driftAmount = Math.sin(state.clock.elapsedTime * driftSpeed + pointIndex * 0.1) * 0.03
          targetValue += driftAmount
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
      const productYOffset = -0.5 // Same offset as above for consistency
      
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
      {/* Chaos particles (background - orange) */}
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
      
      {/* Barcode particles (foreground - on top, visible from start) */}
      <points ref={barcodePointsRef} position={[0, 0, 0.1]}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={barcodePositions}
            count={pointCount}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          ref={barcodeMaterialRef}
          size={pointSize}
          color="#F8F8F7"
          sizeAttenuation
          transparent
          opacity={0.92}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      
      {/* Scan line during intro phase */}
      <group ref={scanLineRef}>
        {/* Main electric scan line */}
        <mesh position={[0, 0, 0.2]}>
          <planeGeometry args={[0.15, 4]} />
          <primitive
            object={new ElectricScanMaterial()}
            ref={scanMaterialRef}
            transparent
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    </>
  )
}


