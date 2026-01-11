import { useRef, useMemo, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { generateChocolateBarPositions } from './ChocolateBarGeometry'
import { useWineBottlePositions } from './WineBottleGeometry'
import { useBatteryPositions } from './BatteryGeometry'
import { useTShirtPositions } from './TShirtGeometry'
import {
  scanLightVertexShader,
  scanLightFragmentShader,
} from './ScanLightShader'

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

// Generate barcode positions
function generateBarcodePositions(pointCount: number): Float32Array {
  const positions: number[] = []
  const width = 1.3  // Reduced from 1.8 to better fit screen width
  const height = 0.9
  const barCount = 40
  
  // First pass: calculate total width needed
  const barWidths: number[] = []
  let totalWidth = 0
  for (let i = 0; i < barCount; i++) {
    const isBar = i % 2 === 0
    const barWidth = isBar 
      ? (0.015 + Math.random() * 0.025)
      : (0.008 + Math.random() * 0.015)
    barWidths.push(barWidth)
    totalWidth += barWidth
  }
  
  // Normalize widths to fit exactly within desired width
  const scale = width / totalWidth
  const bars: { x: number; w: number }[] = []
  let x = -width / 2
  
  for (let i = 0; i < barCount; i++) {
    const isBar = i % 2 === 0
    const barWidth = barWidths[i] * scale
    
    if (isBar) {
      bars.push({ x: x + barWidth / 2, w: barWidth })
    }
    x += barWidth
  }
  
  const pointsPerBar = Math.floor(pointCount / bars.length)
  
  bars.forEach(bar => {
    for (let i = 0; i < pointsPerBar; i++) {
      positions.push(
        bar.x + (Math.random() - 0.5) * bar.w * 0.9,
        (Math.random() - 0.5) * height,
        (Math.random() - 0.5) * 0.02
      )
    }
  })
  
  while (positions.length < pointCount * 3) {
    const randomBar = bars[Math.floor(Math.random() * bars.length)]
    positions.push(
      randomBar.x + (Math.random() - 0.5) * randomBar.w * 0.9,
      (Math.random() - 0.5) * height,
      0
    )
  }
  
  return new Float32Array(positions.slice(0, pointCount * 3))
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
  const scanLightRef = useRef<THREE.Mesh>(null)
  const scanGlowRef = useRef<THREE.Mesh>(null)
  const scanShaderRef = useRef<THREE.ShaderMaterial>(null)
  const lightningFlashRef = useRef<THREE.Mesh>(null) // Flash overlay for lightning effect
  const [currentProductIndex, setCurrentProductIndex] = useState(0)
  const [phase, setPhase] = useState<'chaos' | 'failedScan' | 'scanning' | 'barcode' | 'holding' | 'transforming' | 'product'>('chaos')
  const phaseStartTime = useRef(0)
  const rotationAngle = useRef(0) // Track rotation angle for center-axis rotation
  const failedScanCount = useRef(0) // Track failed scan attempts
  const { clock } = useThree()
  
  // Shader uniforms for elegant scan light
  const scanUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIntensity: { value: 0.8 },  // Less intense overall
      uColorCore: { value: new THREE.Color(0xFFFFFF) },  // Bright white core
      uColorEdge: { value: new THREE.Color(0x4CC9F0) },  // Blue-cyan edges (subtle)
      uWidth: { value: 0.3 },
    }),
    []
  )
  
  // Load all product models
  const wineBottle = useWineBottlePositions(pointCount)
  const battery = useBatteryPositions(pointCount)
  const tshirt = useTShirtPositions(pointCount)
  
  // Generate all position sets
  const positionSets = useMemo(() => {
    const barcode = generateBarcodePositions(pointCount)
    const scatter = generateScatterPositions(pointCount)
    // Map products: wine bottle first, then battery, then t-shirt
    const productPositions = products.map((product, index) => {
      if (index === 0) return wineBottle
      if (index === 1) return battery
      if (index === 2) return tshirt
      return wineBottle // fallback
    })
    
    return { barcode, scatter, products: productPositions }
  }, [pointCount, products, wineBottle, battery, tshirt])
  
  // Timeline configuration (in seconds) - NEW SPEC: Electric Awakening
  // Copy Rhythm: "Scan." → "Any product." → "Verify." → "Trusted."
  const timeline = {
    chaos: 2.0,          // 0-2s: "Scan." - Command with chaos
    failedScan: 2.0,     // 2-4s: "Any product." - Scope, failed scanning
    scanning: 4.0,       // 4-8s: THE AWAKENING - Lightning strikes, chain reaction, barcode forms
    barcode: 0.0,        // Merged into scanning phase
    holding: 1.5,        // 8-9.5s: "Verify." - Process confirmed ⚠️ CRITICAL
    transforming: 2.0,   // 9.5-11.5s: Product transformation
    product: 1.5         // 11.5-13s: "Trusted." - Outcome, resolution
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
    
    // PERSUASION SEQUENCE: Anxiety → Relief → Delight
    let target: Float32Array
    let progress = 0
    let shouldRotate = false
    let particleColor = colors.offWhite
    let scanLightPosition = -3 // Off-screen left
    let scanLightVisible = false
    let lightningFlashOpacity = 0 // Flash overlay opacity
    
    switch (phase) {
      case 'chaos':
        // ACT 1: Chaos - warm error colors, jittery movement
        target = positionSets.scatter
        progress = Math.min(elapsed / 1.0, 1)
        particleColor = colors.chaosWarm
        // Jittery rotation to suggest system failure
        if (pointsRef.current) {
          pointsRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 2) * 0.08
        }
        if (elapsed > timeline.chaos) {
          failedScanCount.current = 0
          setPhase('failedScan')
          onPhaseChange?.('failedScan', currentProductIndex)
        }
        break
        
      case 'failedScan':
        // Failed scanning attempts (2-3 times)
        target = positionSets.scatter
        progress = 1
        particleColor = colors.chaosWarm
        scanLightVisible = true
        // Scan line passes but doesn't align particles
        const scanProgress = (elapsed % timeline.failedScan) / timeline.failedScan
        scanLightPosition = -2 + (scanProgress * 4) // Sweep across
        
        if (elapsed > timeline.failedScan) {
          failedScanCount.current++
          if (failedScanCount.current >= 2) {
            // After 2 failed scans, move to successful scan
            setPhase('scanning')
            onPhaseChange?.('scanning', currentProductIndex)
          } else {
            // Reset for another failed scan attempt
            phaseStartTime.current = clock.elapsedTime
          }
        }
        break
        
      case 'scanning':
        // ACT 2: THE AWAKENING - Electric lightning strike & particle ignition
        target = positionSets.barcode
        const awakeningT = Math.min(elapsed / timeline.scanning, 1)
        
        // PHASE 1: Lightning Strike (0-1s) - Instant flash
        if (elapsed < 1.0) {
          const flashT = elapsed / 1.0
          // Bright electric blue-white flash
          particleColor = new THREE.Color(0xFFFFFF) // Pure white flash
          scanLightVisible = true
          scanLightPosition = Math.sin(flashT * Math.PI * 4) * 2 // Zigzag lightning path
          progress = flashT * 0.3 // Particles start reacting
          
          // Screen flash - bright at start, fades quickly
          lightningFlashOpacity = Math.max(0, 0.6 - (flashT * 0.6)) * Math.sin(flashT * 15)
          
          // Pulsing size for energy burst
          if (materialRef.current) {
            materialRef.current.size = pointSize * (1 + Math.sin(flashT * 20) * 0.5)
          }
        }
        // PHASE 2: Chain Reaction (1-2.5s) - Energy spreads
        else if (elapsed < 2.5) {
          const chainT = (elapsed - 1.0) / 1.5
          // Electric blue color
          particleColor = new THREE.Color(0x4CC9F0)
          progress = 0.3 + (chainT * 0.4) // Particles moving toward barcode
          scanLightVisible = false
          lightningFlashOpacity = 0
          
          // Rapid pulsing as energy spreads
          if (materialRef.current) {
            materialRef.current.size = pointSize * (1 + Math.sin(chainT * 30) * 0.3)
          }
        }
        // PHASE 3: Formation (2.5-4s) - Barcode locks in
        else {
          const formT = (elapsed - 2.5) / 1.5
          particleColor = new THREE.Color().lerpColors(
            new THREE.Color(0x4CC9F0),
            colors.verifiedCool,
            formT
          )
          progress = 0.7 + (formT * 0.3) // Final alignment
          scanLightVisible = false
          lightningFlashOpacity = 0
          
          // Size stabilizes
          if (materialRef.current) {
            materialRef.current.size = pointSize * (1 + (1 - formT) * 0.2)
          }
        }
        
        if (elapsed > timeline.scanning) {
          setPhase('barcode')
          onPhaseChange?.('barcode', currentProductIndex)
        }
        break
        
      case 'barcode':
        // Barcode formed, brief hold before verification moment
        target = positionSets.barcode
        progress = 1
        particleColor = colors.scanLight
        // Reset particle size to normal
        if (materialRef.current) {
          materialRef.current.size = pointSize
        }
        if (elapsed > timeline.barcode) {
          setPhase('holding')
          onPhaseChange?.('holding', currentProductIndex)
        }
        break
        
      case 'holding':
        // ⚠️ CRITICAL: Hold + verify moment - "One scan." appears
        target = positionSets.barcode
        progress = 1
        particleColor = colors.verifiedCool
        // Subtle pulse for verification
        const pulseT = (elapsed / 2.0) * Math.PI * 2
        const pulseScale = 1.0 + (Math.sin(pulseT) * 0.02)
        if (pointsRef.current) {
          pointsRef.current.scale.setScalar(pulseScale)
        }
        if (elapsed > timeline.holding) {
          if (pointsRef.current) pointsRef.current.scale.setScalar(1.0)
          setPhase('transforming')
          onPhaseChange?.('transforming', currentProductIndex)
        }
        break
        
      case 'transforming':
        // Product transformation - barcode → product
        target = positionSets.products[currentProductIndex]
        progress = easeInOutCubic(Math.min(elapsed / timeline.transforming, 1))
        particleColor = colors.verifiedCool
        if (elapsed > timeline.transforming) {
          setPhase('product')
          onPhaseChange?.('product', currentProductIndex)
        }
        break
        
      case 'product':
        // ACT 3: Verified state - cool colors, stable
        target = positionSets.products[currentProductIndex]
        progress = 1
        shouldRotate = true
        particleColor = colors.offWhite
        if (elapsed > timeline.product) {
          // Cycle to next product or loop
          const nextProductIndex = (currentProductIndex + 1) % products.length
          if (nextProductIndex !== 0) {
            setCurrentProductIndex(nextProductIndex)
            setPhase('transforming')
            onPhaseChange?.('transforming', nextProductIndex)
          } else {
            setCurrentProductIndex(0)
            setPhase('chaos')
            onPhaseChange?.('chaos', 0)
          }
        }
        break
        
      default:
        target = positionSets.scatter
        progress = 1
    }
    
    // Update particle color
    if (materialRef.current) {
      materialRef.current.color.lerp(particleColor, delta * 3)
    }
    
    // Update shader time uniform for animation
    if (scanShaderRef.current) {
      scanShaderRef.current.uniforms.uTime.value = state.clock.elapsedTime
    }
    
    // Update scan light position and visibility with elegant movement
    if (scanLightRef.current && scanGlowRef.current) {
      scanLightRef.current.visible = scanLightVisible
      scanGlowRef.current.visible = scanLightVisible
      scanLightRef.current.position.x = scanLightPosition
      scanGlowRef.current.position.x = scanLightPosition
      
      // Vary intensity during failed scans vs successful scan
      if (scanShaderRef.current) {
        if (phase === 'failedScan') {
          // Weaker, flickering during failed scans
          const flicker = 0.4 + Math.random() * 0.2
          scanShaderRef.current.uniforms.uIntensity.value = flicker
        } else if (phase === 'scanning') {
          // Bright but not overwhelming during successful scan
          scanShaderRef.current.uniforms.uIntensity.value = 0.85
        }
      }
    }
    
    // Update lightning flash overlay
    if (lightningFlashRef.current) {
      const flashMaterial = lightningFlashRef.current.material as THREE.MeshBasicMaterial
      flashMaterial.opacity = lightningFlashOpacity
      lightningFlashRef.current.visible = lightningFlashOpacity > 0
    }
    
    // Interpolate positions with staggered timing
    // Apply uniform Y offset for products (all objects centered at origin by default)
    const productYOffset = -0.5 // Vertical position adjustment for products
    
    for (let i = 0; i < positions.length; i += 3) {
      const pointIndex = i / 3
      const stagger = (pointIndex / pointCount) * 0.3
      const localProgress = Math.max(0, Math.min(1, (progress - stagger) / (1 - stagger)))
      
      for (let j = 0; j < 3; j++) {
        const idx = i + j
        let targetValue = target[idx]
        
        // Apply vertical offset for product phases (Y coordinate)
        if (j === 1 && (phase === 'transforming' || phase === 'product')) {
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
    
    // Rotation during product phase - rotate around bottle's center vertical axis
    if (shouldRotate && phase === 'product') {
      // Increment rotation angle
      rotationAngle.current += delta * 0.3
      
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
      
      {/* Scan light - THE HERO MOMENT - Elegant shader-based */}
      <mesh ref={scanLightRef} visible={false} position={[0, 0, 0.2]}>
        <planeGeometry args={[0.25, 2.8]} />
        <shaderMaterial
          ref={scanShaderRef}
          vertexShader={scanLightVertexShader}
          fragmentShader={scanLightFragmentShader}
          uniforms={scanUniforms}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Scan glow halo - extremely subtle, almost invisible */}
      <mesh ref={scanGlowRef} visible={false} position={[0, 0, 0.1]}>
        <planeGeometry args={[0.3, 3.0]} />
        <meshBasicMaterial
          color="#4CC9F0"
          transparent
          opacity={0.02}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Lightning Flash Overlay - Full-screen flash during awakening */}
      <mesh ref={lightningFlashRef} visible={false} position={[0, 0, 2]}>
        <planeGeometry args={[10, 10]} />
        <meshBasicMaterial
          color="#FFFFFF"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </>
  )
}


