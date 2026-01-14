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
  onTransitionStart?: () => void
  onTransitionEnd?: () => void
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
  
  const width = 2.4
  const height = 1.2
  const barCount = 25
  const baseBarWidth = width / barCount
  
  const barWidths: number[] = []
  for (let i = 0; i < barCount; i++) {
    const barWidth = (i % 3 === 0) ? baseBarWidth * 2.0 : baseBarWidth * 1.0
    barWidths.push(barWidth)
  }
  
  const totalWidth = barWidths.reduce((sum, w) => sum + w, 0)
  let currentX = -totalWidth / 2
  
  for (let barIndex = 0; barIndex < barCount; barIndex++) {
    const barWidth = barWidths[barIndex]
    const barX = currentX + barWidth / 2
    const pointsPerBar = Math.floor(pointCount / barCount)
    
    for (let i = 0; i < pointsPerBar; i++) {
      const x = barX + (Math.random() - 0.5) * barWidth * 0.6
      const y = (Math.random() - 0.5) * height * 0.95
      const z = 0
      
      positions.push(x, y, z)
    }
    
    currentX += barWidth
  }
  
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
  onPhaseChange,
  onTransitionStart,
  onTransitionEnd
}: HeroAnimationProps) {
  const pointsRef = useRef<THREE.Points>(null) // Single particle system
  const materialRef = useRef<THREE.PointsMaterial>(null)
  const scanLineRef = useRef<THREE.Group>(null)
  const scanMaterialRef = useRef<InstanceType<typeof ElectricScanMaterial>>(null)
  const [currentProductIndex, setCurrentProductIndex] = useState(0)
  const [phase, setPhase] = useState<'intro' | 'preload' | 'cycling'>('intro')
  const phaseStartTime = useRef(0)
  const productStartTime = useRef(0) // Track when current product started
  const rotationAngle = useRef(0) // Track rotation angle for products
  const { camera, clock } = useThree()
  
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
  
  // Track which bar each particle belongs to (for bar-by-bar animation)
  const barIndices = useMemo(() => {
    const indices = new Uint8Array(pointCount)
    const barCount = 25
    const pointsPerBar = Math.floor(pointCount / barCount)
    
    for (let barIndex = 0; barIndex < barCount; barIndex++) {
      const startIdx = barIndex * pointsPerBar
      const endIdx = Math.min(startIdx + pointsPerBar, pointCount)
      for (let i = startIdx; i < endIdx; i++) {
        indices[i] = barIndex
      }
    }
    // Fill remaining particles
    for (let i = barCount * pointsPerBar; i < pointCount; i++) {
      indices[i] = Math.floor((i / pointsPerBar) % barCount)
    }
    return indices
  }, [pointCount])
  
  // Calculate barcode width for scanline positioning
  const barcodeWidth = useMemo(() => {
    const width = 2.4
    const barCount = 25
    const baseBarWidth = width / barCount
    const barWidths: number[] = []
    for (let i = 0; i < barCount; i++) {
      const barWidth = (i % 3 === 0) ? baseBarWidth * 2.0 : baseBarWidth * 1.0
      barWidths.push(barWidth)
    }
    return barWidths.reduce((sum, w) => sum + w, 0)
  }, [])
  
  // Create electric scan material instance (once)
  const electricScanMaterial = useMemo(() => {
    const material = new ElectricScanMaterial()
    return material
  }, [])
  
  // Timeline configuration (in seconds)
  const timeline = {
    intro: 3.5,                    // Intro: orange particles, scan moves
    scanMoveTime: 2.0,              // Time for scan to move
    preload: 4.0,                   // Show first product with panels
    productDuration: 6.0,           // Show each product
    transformDuration: 1.5          // Morph between products
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
    if (scanLineRef.current) {
      scanLineRef.current.position.set(-barcodeWidth / 2, 0, 0)
      scanLineRef.current.visible = phase === 'intro' || phase === 'preload'
    }
    // Reset camera position on phase change
    if (phase === 'intro') {
      camera.position.z = 5.5
      camera.updateProjectionMatrix()
    }
  }, [phase, clock, camera, barcodeWidth])
  
  // Auto-transition from loading to intro
  useEffect(() => {
    if (phase === 'loading') {
      const timer = setTimeout(() => {
        setPhase('intro')
        phaseStartTime.current = clock.elapsedTime
      }, timeline.loading * 1000)
      return () => clearTimeout(timer)
    }
  }, [phase, clock, timeline.loading])
  
  // Main animation loop
  useFrame((state, delta) => {
    if (!pointsRef.current) return
    
    const elapsed = state.clock.elapsedTime - phaseStartTime.current
    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array
    
    // No camera zoom - keep camera position fixed
    
    // Update scan line position - moves across barcode width, fades out after scanning
    if (phase === 'intro' && scanLineRef.current) {
      const holdTime = 0.3 // Hold briefly after reaching end
      const fadeOutStart = timeline.scanMoveTime + holdTime // Start fading after brief hold
      const fadeOutDuration = 0.6 // Fade duration
      const fadeOutEnd = fadeOutStart + fadeOutDuration
      
      if (elapsed < timeline.scanMoveTime) {
        // Scan line moves from left edge to right edge of barcode
        const scanProgress = easeInOutCubic(elapsed / timeline.scanMoveTime)
        const barcodeLeft = -barcodeWidth / 2
        const barcodeRight = barcodeWidth / 2
        const scanLineX = barcodeLeft + (scanProgress * (barcodeRight - barcodeLeft))
        scanLineRef.current.position.set(scanLineX, 0, 0)
        scanLineRef.current.visible = true
        
        if (scanMaterialRef.current) {
          scanMaterialRef.current.uniforms.uTime.value = state.clock.elapsedTime
          scanMaterialRef.current.uniforms.uIntensity.value = 1.0
        }
      } else if (elapsed < fadeOutStart) {
        // Scan line stops at right edge of barcode, hold briefly
        scanLineRef.current.position.set(barcodeWidth / 2, 0, 0)
        scanLineRef.current.visible = true
        
        if (scanMaterialRef.current) {
          scanMaterialRef.current.uniforms.uTime.value = state.clock.elapsedTime
          scanMaterialRef.current.uniforms.uIntensity.value = 1.0
        }
      } else if (elapsed < fadeOutEnd) {
        // Fade out scanline completely
        const fadeProgress = (elapsed - fadeOutStart) / fadeOutDuration
        scanLineRef.current.position.set(barcodeWidth / 2, 0, 0)
        scanLineRef.current.visible = true
        
        if (scanMaterialRef.current) {
          scanMaterialRef.current.uniforms.uTime.value = state.clock.elapsedTime
          scanMaterialRef.current.uniforms.uIntensity.value = 1.0 * (1 - fadeProgress) // Fade from 1.0 to 0
        }
      } else {
        // Completely hidden after fade out
        scanLineRef.current.visible = false
        if (scanMaterialRef.current) {
          scanMaterialRef.current.uniforms.uIntensity.value = 0
        }
      }
    } else {
      // Hide scanline in all other phases
      if (scanLineRef.current) {
        scanLineRef.current.visible = false
        if (scanMaterialRef.current) {
          scanMaterialRef.current.uniforms.uIntensity.value = 0
        }
      }
    }
    
    // Simple flow: Orange particles → Scanline → Products
    let target: Float32Array = positionSets.scatter
    let progress = 0
    let shouldRotate = false
    let particleColor = colors.chaosWarm
    let chaosOpacity = 0.6
    
    switch (phase) {
      case 'intro':
        // Intro: Bars fly in one by one from scatter, scanline animates over barcode, then morphs to product
        // Scanline completes at timeline.scanMoveTime (2.0s), then holds briefly, then fades out
        // Product morph starts after scanline finishes
        const barFlyInDuration = 1.2 // Time for all bars to fly in
        const scanCompleteTime = timeline.scanMoveTime + 0.3 // Scan completes + brief hold
        const productMorphStart = scanCompleteTime + 0.2 // Start morphing after scanline completes
        const productMorphDuration = Math.max(0.1, timeline.intro - productMorphStart)
        
        if (elapsed < productMorphStart) {
          // Bars fly in one by one from scatter to barcode positions
          // Each bar animates individually with staggered timing
          target = positionSets.barcode
          // Progress will be handled per-bar in the interpolation loop
          progress = 1 // Base progress - bars will animate individually
          particleColor = colors.offWhite
          chaosOpacity = 0.92
        } else {
          // Bar-by-bar explosion from barcode to product (after scanline completes)
          // Each bar explodes individually into product positions
          target = (positionSets.products && positionSets.products[0]) ? positionSets.products[0] : positionSets.barcode
          progress = 1 // Base progress - bars will explode individually
          particleColor = colors.offWhite
          chaosOpacity = 0.92
          shouldRotate = false // No rotation during explosion
        }
        
        if (elapsed > timeline.intro) {
          setPhase('preload')
          phaseStartTime.current = clock.elapsedTime
          setCurrentProductIndex(0)
          onPhaseChange?.('preload', 0)
        }
        break
        
      case 'preload':
        // Preload: Show bottle, then morph to battery
        const bottleHoldTime = 2.0
        const batteryMorphDuration = timeline.preload - bottleHoldTime
        
        if (elapsed < bottleHoldTime) {
          // Hold bottle
          target = (positionSets.products && positionSets.products[0]) ? positionSets.products[0] : positionSets.scatter
          progress = 1
          particleColor = colors.offWhite
          chaosOpacity = 0.92
          shouldRotate = true
        } else {
          // Morph bottle to battery - trigger transition start
          if (elapsed - bottleHoldTime < 0.1) {
            onTransitionStart?.()
          }
          
          const batteryMorphElapsed = elapsed - bottleHoldTime
          const batteryMorphProgress = easeInOutCubic(Math.min(batteryMorphElapsed / batteryMorphDuration, 1))
          
          const bottleTarget = (positionSets.products && positionSets.products[0]) ? positionSets.products[0] : positionSets.scatter
          const batteryTarget = (positionSets.products && positionSets.products[1]) ? positionSets.products[1] : positionSets.scatter
          
          target = new Float32Array(pointCount * 3)
          for (let i = 0; i < target.length; i++) {
            target[i] = THREE.MathUtils.lerp(bottleTarget[i] ?? 0, batteryTarget[i] ?? 0, batteryMorphProgress)
          }
          progress = 1
          particleColor = colors.offWhite
          chaosOpacity = 0.92
          shouldRotate = true
          
          // Trigger transition end when morph completes
          if (batteryMorphProgress >= 0.95) {
            onTransitionEnd?.()
          }
        }
        
        if (elapsed > timeline.preload) {
          setPhase('cycling')
          productStartTime.current = clock.elapsedTime
          setCurrentProductIndex(1) // Now showing battery
          onPhaseChange?.('cycling', 1)
        }
        break
        
      case 'cycling':
        // Cycling: Cycle through products
        const productElapsed = clock.elapsedTime - productStartTime.current
        const nextProductIndex = (currentProductIndex + 1) % products.length
        const isTransforming = productElapsed > (timeline.productDuration - timeline.transformDuration)
        
        if (productElapsed > timeline.productDuration) {
          setCurrentProductIndex(nextProductIndex)
          productStartTime.current = clock.elapsedTime
          onPhaseChange?.('cycling', nextProductIndex)
        }
        
        if (isTransforming) {
          // Trigger transition start when morphing begins
          const transformElapsed = productElapsed - (timeline.productDuration - timeline.transformDuration)
          if (transformElapsed < 0.1) {
            onTransitionStart?.()
          }
          
          const morphT = easeInOutCubic(transformElapsed / timeline.transformDuration)
          const currentTarget = (positionSets.products && positionSets.products[currentProductIndex]) ? positionSets.products[currentProductIndex] : positionSets.scatter
          const nextTarget = (positionSets.products && positionSets.products[nextProductIndex]) ? positionSets.products[nextProductIndex] : positionSets.scatter
          target = new Float32Array(pointCount * 3)
          for (let i = 0; i < target.length; i++) {
            target[i] = THREE.MathUtils.lerp(currentTarget[i] ?? 0, nextTarget[i] ?? 0, morphT)
          }
          progress = 1
          particleColor = colors.offWhite
          chaosOpacity = 0.92
          shouldRotate = true
          
          // Trigger transition end when morph completes
          if (morphT >= 0.95) {
            onTransitionEnd?.()
          }
        } else {
          target = (positionSets.products && positionSets.products[currentProductIndex]) ? positionSets.products[currentProductIndex] : positionSets.scatter
          progress = 1
          particleColor = colors.offWhite
          chaosOpacity = 0.92
          shouldRotate = true
        }
        break
        
      default:
        target = positionSets.scatter
        progress = 1
    }
    
    // Update particle color and opacity
    if (materialRef.current) {
      materialRef.current.color.lerp(particleColor, delta * 3)
      materialRef.current.opacity = chaosOpacity
    }
    
    // Interpolate positions with staggered timing
    // Apply uniform Y offset and scale for products (all objects centered at origin by default)
    const productYOffset = -0.3 // Vertical position adjustment (moved up)
    const productScale = 0.85 // Scale for products (increased since camera is further away)
    
    // Safety check: ensure target is defined and has correct length
    if (!target || target.length !== positions.length) {
      target = positionSets.scatter
    }
    
    // Bar-by-bar animation for intro phase
    const barFlyInDuration = 1.2
    const barCount = 25
    const barDelay = barFlyInDuration / barCount // Delay between each bar
    
    // Calculate explosion timing (outside loop for efficiency)
    const scanCompleteTime = timeline.scanMoveTime + 0.3
    const productMorphStart = scanCompleteTime + 0.2
    const explosionDuration = 1.0 // Time for all bars to explode
    const barExplosionDelay = explosionDuration / barCount // Delay between each bar explosion
    
    for (let i = 0; i < positions.length; i += 3) {
      const pointIndex = i / 3
      const barIndex = barIndices[pointIndex]
      
      let localProgress = progress
      let barMorphProgress = 1.0 // Progress for morphing this bar
      let barExplosionProgress = 0.0 // Progress for exploding bar from barcode to product
      
      // Bar-by-bar fly-in animation during intro (before product morph)
      if (phase === 'intro' && elapsed < timeline.intro - 1.2) {
        const barStartTime = barIndex * barDelay
        const barEndTime = barStartTime + 0.2 // Time for each bar to morph in
        if (elapsed < barStartTime) {
          barMorphProgress = 0 // Bar not started yet - stay at scatter
        } else if (elapsed < barEndTime) {
          const barProgress = (elapsed - barStartTime) / 0.2
          barMorphProgress = easeInOutCubic(Math.min(barProgress, 1)) // Morph from 0 to 1
        } else {
          barMorphProgress = 1 // Bar fully morphed to barcode position
        }
      }
      
      // Bar-by-bar explosion from barcode to product (after scan completes)
      if (phase === 'intro' && elapsed >= productMorphStart) {
        const explosionElapsed = elapsed - productMorphStart
        const barExplosionStart = barIndex * barExplosionDelay
        const barExplosionEnd = barExplosionStart + 0.15 // Time for each bar to explode
        
        if (explosionElapsed < barExplosionStart) {
          barExplosionProgress = 0 // Bar still at barcode position
        } else if (explosionElapsed < barExplosionEnd) {
          const barProgress = (explosionElapsed - barExplosionStart) / 0.15
          barExplosionProgress = easeInOutCubic(Math.min(barProgress, 1)) // Progress from 0 to 1
        } else {
          barExplosionProgress = 1 // Bar fully morphed to product position
        }
      }
      
      const stagger = (pointIndex / pointCount) * 0.3
      localProgress = Math.max(0, Math.min(1, (progress - stagger) / (1 - stagger)))
      
      for (let j = 0; j < 3; j++) {
        const idx = i + j
        let targetValue = target[idx] ?? 0 // Fallback to 0 if undefined
        
        // For bar-by-bar animation, interpolate between scatter and barcode positions
        if (phase === 'intro' && elapsed < timeline.intro - 1.2) {
          const scatterValue = positionSets.scatter[idx] ?? 0
          const barcodeValue = positionSets.barcode[idx] ?? 0
          // Morph from scatter to barcode based on bar's individual progress
          targetValue = THREE.MathUtils.lerp(scatterValue, barcodeValue, barMorphProgress)
        }
        
        // Bar-by-bar explosion from barcode to product (use already calculated barExplosionProgress)
        if (phase === 'intro' && elapsed >= productMorphStart) {
          const barcodeValue = positionSets.barcode[idx] ?? 0
          let productValue = target[idx] ?? 0
          // Apply scale to product during explosion so it matches barcode size
          productValue *= productScale
          if (j === 1) {
            productValue += productYOffset
          }
          // Morph from barcode to product based on bar's explosion progress
          targetValue = THREE.MathUtils.lerp(barcodeValue, productValue, barExplosionProgress)
        }
        
        // Apply scale and vertical offset for product phases (only after morph completes)
        // Don't apply during intro phase to avoid scaling down barcode
        if (phase === 'preload' || phase === 'cycling') {
          // Scale all dimensions
          targetValue *= productScale
          // Apply vertical offset for Y coordinate
          if (j === 1) {
            targetValue += productYOffset
          }
        }
        
        // No drift - chaos particles stay in place
        
        positions[idx] = THREE.MathUtils.lerp(
          positions[idx],
          targetValue,
          localProgress * delta * 8
        )
      }
    }
    
    pointsRef.current.geometry.attributes.position.needsUpdate = true
    
    // Rotation during product phases
    if (shouldRotate && (phase === 'preload' || phase === 'cycling')) {
      rotationAngle.current += delta * 0.5
      const cos = Math.cos(rotationAngle.current)
      const sin = Math.sin(rotationAngle.current)
      const productYOffset = -0.3
      const productScale = 0.85
      
      for (let i = 0; i < positions.length; i += 3) {
        const targetX = (target[i] ?? 0) * productScale
        const targetY = ((target[i + 1] ?? 0) * productScale) + productYOffset
        const targetZ = (target[i + 2] ?? 0) * productScale
        
        positions[i] = targetX * cos - targetZ * sin
        positions[i + 1] = targetY
        positions[i + 2] = targetX * sin + targetZ * cos
      }
      
      pointsRef.current.geometry.attributes.position.needsUpdate = true
    } else if (rotationAngle.current !== 0 && !shouldRotate) {
      rotationAngle.current = 0
    }
  })
  
  return (
    <>
      {/* Single particle system */}
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
      
      {/* Scan line */}
      <group ref={scanLineRef} visible={phase === 'intro' || phase === 'preload'}>
        <mesh position={[0, 0, 0.2]}>
          <planeGeometry args={[0.15, 2.5]} />
          <primitive object={electricScanMaterial} ref={scanMaterialRef} />
        </mesh>
      </group>
    </>
  )
}


