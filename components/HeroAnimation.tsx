import { useRef, useMemo, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { generateChocolateBarPositions } from './ChocolateBarGeometry'
import { useWineBottlePositions } from './WineBottleGeometry'

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
  
  const bars: { x: number; w: number }[] = []
  let x = -width / 2
  
  for (let i = 0; i < barCount; i++) {
    const isBar = i % 2 === 0
    const barWidth = isBar 
      ? (0.015 + Math.random() * 0.025) * width
      : (0.008 + Math.random() * 0.015) * width
    
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
  const [currentProductIndex, setCurrentProductIndex] = useState(0)
  const [phase, setPhase] = useState<'chaos' | 'coalescing' | 'barcode' | 'transforming' | 'product'>('chaos')
  const phaseStartTime = useRef(0)
  const rotationAngle = useRef(0) // Track rotation angle for center-axis rotation
  const { clock } = useThree()
  
  // Load wine bottle model positions
  const wineBottle = useWineBottlePositions(pointCount)
  
  // Generate all position sets
  const positionSets = useMemo(() => {
    const barcode = generateBarcodePositions(pointCount)
    const scatter = generateScatterPositions(pointCount)
    const productPositions = products.map(() => wineBottle)
    
    return { barcode, scatter, products: productPositions }
  }, [pointCount, products, wineBottle])
  
  // Timeline configuration (in seconds) - Three Act Structure
  const timeline = {
    chaos: 3.0,          // ACT 1: Particle storm (0-3s)
    coalescing: 2.0,     // Particles gravitate and pull together (3-5s)
    barcode: 2.0,        // ACT 2: Barcode formation complete (5-7s)
    transforming: 2.0,   // Barcode transforms to product (7-9s)
    product: 5.0         // ACT 3: Product reveal with text (9-14s) - longer rotation
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
    
    // THREE ACT STRUCTURE: Chaos → Clarity → Revelation
    let target: Float32Array
    let progress = 0
    let shouldRotate = false
    
    switch (phase) {
      case 'chaos':
        // ACT 1: Particle storm - gentle drift
        target = positionSets.scatter
        progress = Math.min(elapsed / 1.0, 1)
        // Add subtle drift animation
        if (pointsRef.current) {
          pointsRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.05
        }
        if (elapsed > timeline.chaos) {
          setPhase('coalescing')
          onPhaseChange?.('coalescing', currentProductIndex)
        }
        break
        
      case 'coalescing':
        // Particles gravitate toward barcode formation - accelerating
        target = positionSets.barcode
        // Use power easing for acceleration effect
        const t = Math.min(elapsed / timeline.coalescing, 1)
        progress = t * t * t // Cubic easing for acceleration
        if (elapsed > timeline.coalescing) {
          setPhase('barcode')
          onPhaseChange?.('barcode', currentProductIndex)
        }
        break
        
      case 'barcode':
        // ACT 2: Clean barcode - breathing room
        target = positionSets.barcode
        progress = 1
        if (elapsed > timeline.barcode) {
          setPhase('transforming')
          onPhaseChange?.('transforming', currentProductIndex)
        }
        break
        
      case 'transforming':
        // Barcode explodes/morphs into product
        target = positionSets.products[currentProductIndex]
        progress = easeInOutCubic(Math.min(elapsed / timeline.transforming, 1))
        if (elapsed > timeline.transforming) {
          setPhase('product')
          onPhaseChange?.('product', currentProductIndex)
        }
        break
        
      case 'product':
        // ACT 3: Product reveal with gentle rotation
        target = positionSets.products[currentProductIndex]
        progress = 1
        shouldRotate = true
        if (elapsed > timeline.product) {
          // Loop back to chaos
          setPhase('chaos')
          onPhaseChange?.('chaos', currentProductIndex)
        }
        break
        
      default:
        target = positionSets.scatter
        progress = 1
    }
    
    // Interpolate positions with staggered timing
    for (let i = 0; i < positions.length; i += 3) {
      const pointIndex = i / 3
      const stagger = (pointIndex / pointCount) * 0.3
      const localProgress = Math.max(0, Math.min(1, (progress - stagger) / (1 - stagger)))
      
      for (let j = 0; j < 3; j++) {
        const idx = i + j
        positions[idx] = THREE.MathUtils.lerp(
          positions[idx],
          target[idx],
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
      
      // Apply rotation to target positions (not accumulated positions)
      for (let i = 0; i < positions.length; i += 3) {
        const targetX = target[i]
        const targetZ = target[i + 2]
        
        // Rotate around Y axis (vertical center)
        positions[i] = targetX * cos - targetZ * sin
        positions[i + 1] = target[i + 1] // Keep Y unchanged
        positions[i + 2] = targetX * sin + targetZ * cos
      }
      
      pointsRef.current.geometry.attributes.position.needsUpdate = true
    } else if (rotationAngle.current !== 0) {
      // Reset rotation when not in product phase
      rotationAngle.current = 0
    }
  })
  
  return (
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
  )
}


