import { useRef, useMemo, useEffect, useState } from 'react'
import { useFrame, useThree, extend } from '@react-three/fiber'
import { shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { generateChocolateBarPositions } from './ChocolateBarGeometry'
import { useWineBottlePositions } from './WineBottleGeometry'
import { useBatteryPositions } from './BatteryGeometry'
import {
  scanLightVertexShader,
  scanLightFragmentShader
} from './ScanLightShader'
import { useTShirtPositions } from './TShirtGeometry'

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

// Generate barcode positions (vertical bars) - DETERMINISTIC pattern
function generateBarcodePositions(pointCount: number): Float32Array {
  const positions: number[] = []
  
  // Barcode dimensions (centered at origin)
  const width = 1.8 // Total width
  const height = 0.9 // Total height
  const barCount = 40 // Number of vertical bars
  const barWidth = width / barCount
  
  // DETERMINISTIC bar pattern (same every time) - alternating widths like real barcode
  const barWidths: number[] = []
  const pattern = [1, 2, 1, 1, 3, 2, 1, 4, 2, 1, 1, 3, 1, 2, 1, 4, 1, 2, 3, 1, 2, 1, 1, 3, 2, 1, 4, 1, 2, 1, 3, 2, 1, 1, 4, 2, 1, 3, 1, 2]
  for (let i = 0; i < barCount; i++) {
    barWidths.push(barWidth * pattern[i % pattern.length])
  }
  
  // Calculate total width with varying bar widths
  const totalWidth = barWidths.reduce((sum, w) => sum + w, 0)
  let currentX = -totalWidth / 2
  
  // Distribute points across bars - SHARP, DEFINED bars
  for (let barIndex = 0; barIndex < barCount; barIndex++) {
    const barWidth = barWidths[barIndex]
    const barX = currentX + barWidth / 2
    const pointsPerBar = Math.floor((pointCount / barCount) * (barWidth / barWidths[0]))
    
    // Create sharp, defined bars (less random distribution, more uniform)
    for (let i = 0; i < pointsPerBar; i++) {
      // More uniform distribution for sharper bars
      const u = i / pointsPerBar // 0 to 1
      const v = (i % 10) / 10 // For vertical distribution
      
      const x = barX + (u - 0.5) * barWidth * 0.6 // Tighter distribution (0.6 instead of 0.8)
      const y = (v - 0.5) * height * 0.9 // More organized vertical distribution
      const z = (Math.random() - 0.5) * 0.05 // Less depth for sharper look
      
      positions.push(x, y, z)
    }
    
    currentX += barWidth
  }
  
  // Fill remaining points if needed
  while (positions.length / 3 < pointCount) {
    const barIndex = Math.floor((positions.length / 3) % barCount)
    const barWidth = barWidths[barIndex]
    const barX = -totalWidth / 2 + barWidths.slice(0, barIndex).reduce((sum, w) => sum + w, 0) + barWidth / 2
    
    const u = Math.random()
    const v = Math.random()
    const x = barX + (u - 0.5) * barWidth * 0.6
    const y = (v - 0.5) * height * 0.9
    const z = (Math.random() - 0.5) * 0.05
    
    positions.push(x, y, z)
  }
  
  // Trim to exact point count
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
  const barcodePointsRef = useRef<THREE.Points>(null) // Barcode particles (foreground, already formed)
  const barcodeMaterialRef = useRef<THREE.PointsMaterial>(null)
  const scanLineRef = useRef<THREE.Mesh>(null)
  const scanMaterialRef = useRef<THREE.ShaderMaterial>(null)
  
  // Create shader material uniforms
  const scanUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIntensity: { value: 1.0 },
      uColorCore: { value: new THREE.Color(0xFFFFFF) },
      uColorEdge: { value: new THREE.Color(0x4CC9F0) },
      uWidth: { value: 0.3 }
    }),
    []
  )
  const [currentProductIndex, setCurrentProductIndex] = useState(0)
  const [phase, setPhase] = useState<'intro' | 'barcode' | 'cycling'>('intro')
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
  
  // Timeline configuration (in seconds)
  // Flow: Intro (chaos) → Barcode → Product cycling
  const timeline = {
    intro: 3.5,              // 0-3.5s: Intro with chaos, scan line, text appears
    barcode: 2.0,            // 3.5-5.5s: Barcode formation and hold
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
  
  // Barcode positions (already formed, static from start)
  const barcodePositions = useMemo(() => {
    return positionSets.barcode.slice()
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
    
    // Calculate scan line position (for barcode evolution)
    let scanLineX = 0
    if ((phase === 'intro' || phase === 'barcode') && scanLineRef.current && scanMaterialRef.current) {
      // Scan line sweeps across barcode (continuous sweep)
      const scanProgress = (state.clock.elapsedTime % 2.5) / 2.5 // 2.5 second sweep cycle
      scanLineX = -3 + (scanProgress * 6) // Sweep from -3 to 3
      scanLineRef.current.position.x = scanLineX
      scanLineRef.current.visible = true
      
      // Update shader uniforms
      scanMaterialRef.current.uniforms.uTime.value = state.clock.elapsedTime
      
      // Update barcode particle opacity based on scan line position
      // Particles appear/evolve as scan line approaches, fade after it passes
      if (barcodePointsRef.current && barcodeMaterialRef.current) {
        const barcodePositions = barcodePointsRef.current.geometry.attributes.position.array as Float32Array
        const scanWidth = 0.8 // Width of scan effect
        const fadeWidth = 0.4 // Fade distance after scan
        
        // Calculate opacity for each particle based on distance from scan line
        let maxOpacity = 0
        for (let i = 0; i < barcodePositions.length; i += 3) {
          const particleX = barcodePositions[i]
          const distFromScan = Math.abs(particleX - scanLineX)
          
          if (distFromScan < scanWidth) {
            // Particle is near scan line - full opacity
            maxOpacity = Math.max(maxOpacity, 1.0)
          } else if (distFromScan < scanWidth + fadeWidth) {
            // Particle is fading after scan passed
            const fadeProgress = (distFromScan - scanWidth) / fadeWidth
            maxOpacity = Math.max(maxOpacity, 1.0 - fadeProgress)
          }
        }
        
        // Smooth opacity transition
        const targetOpacity = Math.max(0.3, maxOpacity * 0.85) // Minimum 30% opacity, max 85%
        barcodeMaterialRef.current.opacity = THREE.MathUtils.lerp(
          barcodeMaterialRef.current.opacity,
          targetOpacity,
          delta * 5
        )
      }
    } else if (scanLineRef.current) {
      scanLineRef.current.visible = false
      // Hide barcode particles when scan line is hidden
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
        }
        
        if (elapsed > timeline.intro) {
          setPhase('barcode')
          onPhaseChange?.('barcode', 0)
        }
        break
        
      case 'barcode':
        // Barcode phase: Barcode already formed, wait for scan
        // Barcode particles are static (already visible from start)
        target = positionSets.scatter // Keep chaos particles as background
        progress = 1
        particleColor = colors.chaosWarm
        
        // Hide scan line after barcode phase completes
        if (elapsed > timeline.barcode) {
          if (scanLineRef.current) {
            scanLineRef.current.visible = false
          }
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
      {/* Chaos particles (background) */}
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
          opacity={0.4}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      
      {/* Barcode particles (foreground, already formed from start) */}
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
          size={pointSize * 1.2}
          color={colors.scanLight}
          sizeAttenuation
          transparent
          opacity={0.85}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      
      {/* Shader-based scan line during intro phase */}
      <mesh ref={scanLineRef} position={[-3, 0, 0.2]}>
        <planeGeometry args={[0.3, 4]} />
        <shaderMaterial
          ref={scanMaterialRef}
          uniforms={scanUniforms}
          vertexShader={scanLightVertexShader}
          fragmentShader={scanLightFragmentShader}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </>
  )
}


