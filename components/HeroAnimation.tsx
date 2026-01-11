import { useRef, useMemo, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useWineBottlePositions } from './WineBottleGeometry'
import { useBatteryPositions } from './BatteryGeometry'
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

// Easing functions
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

function easeInQuad(t: number): number {
  return t * t
}

function easeOutQuad(t: number): number {
  return t * (2 - t)
}

// Generate scattered positions for chaos phase
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
  
  // Barcode dimensions (centered at origin)
  const width = 1.8 // Total width
  const height = 0.9 // Total height
  const barCount = 40 // Number of vertical bars
  const barWidth = width / barCount
  
  // Generate bar widths (varying thickness like real barcode)
  const barWidths: number[] = []
  for (let i = 0; i < barCount; i++) {
    // Random bar width (1x, 2x, 3x, or 4x base width)
    const multiplier = [1, 1, 1, 2, 2, 3, 4][Math.floor(Math.random() * 7)]
    barWidths.push(barWidth * multiplier)
  }
  
  // Calculate total width with varying bar widths
  const totalWidth = barWidths.reduce((sum, w) => sum + w, 0)
  let currentX = -totalWidth / 2
  
  // Distribute points across bars
  for (let barIndex = 0; barIndex < barCount; barIndex++) {
    const barWidth = barWidths[barIndex]
    const barX = currentX + barWidth / 2
    const pointsPerBar = Math.floor((pointCount / barCount) * (barWidth / barWidths[0]))
    
    for (let i = 0; i < pointsPerBar; i++) {
      const x = barX + (Math.random() - 0.5) * barWidth * 0.8
      const y = (Math.random() - 0.5) * height
      const z = (Math.random() - 0.5) * 0.1 // Slight depth
      
      positions.push(x, y, z)
    }
    
    currentX += barWidth
  }
  
  // Fill remaining points if needed
  while (positions.length / 3 < pointCount) {
    const barIndex = Math.floor(Math.random() * barCount)
    const barWidth = barWidths[barIndex]
    const barX = -totalWidth / 2 + barWidths.slice(0, barIndex).reduce((sum, w) => sum + w, 0) + barWidth / 2
    const x = barX + (Math.random() - 0.5) * barWidth * 0.8
    const y = (Math.random() - 0.5) * height
    const z = (Math.random() - 0.5) * 0.1
    
    positions.push(x, y, z)
  }
  
  // Trim to exact point count
  return new Float32Array(positions.slice(0, pointCount * 3))
}

// 5-Act Animation Phases (per spec)
type AnimationPhase = 'chaos' | 'merge' | 'barcode' | 'product' | 'portal'

export function HeroAnimation({
  products,
  pointCount = 18000,
  pointSize = 0.008,
  onPhaseChange
}: HeroAnimationProps) {
  const pointsRef = useRef<THREE.Points>(null)
  const materialRef = useRef<THREE.PointsMaterial>(null)
  const { camera, clock } = useThree()
  
  const [phase, setPhase] = useState<AnimationPhase>('chaos')
  const phaseStartTime = useRef(0)
  
  // Load all product models (we'll use the first one for the final product reveal)
  const wineBottle = useWineBottlePositions(pointCount)
  const battery = useBatteryPositions(pointCount)
  const tshirt = useTShirtPositions(pointCount)
  
  // Generate all position sets
  const positionSets = useMemo(() => {
    const scatter = generateScatterPositions(pointCount)
    const barcode = generateBarcodePositions(pointCount)
    const productPositions = [wineBottle, battery, tshirt]
    
    return { scatter, barcode, products: productPositions }
  }, [pointCount, wineBottle, battery, tshirt])
  
  // Timeline configuration (per spec: 12 seconds total)
  const timeline = {
    chaos: 3.0,    // 0-3s: Chaos of products
    merge: 2.0,    // 3-5s: Merge phase
    barcode: 2.0,  // 5-7s: Barcode formation
    product: 2.5,  // 7-9.5s: Product emergence
    portal: 2.5    // 9.5-12s: Portal/tunnel
  }
  
  // Color states (per spec)
  const colors = {
    chaosWarm: new THREE.Color(0xFF6B35),      // Warm amber
    lightning: new THREE.Color(0x4CC9F0),      // Electric blue
    ignited: new THREE.Color(0x00FFFF),        // Cyan
    verifiedCool: new THREE.Color(0x88927D),   // Sage green
    offWhite: new THREE.Color(0xF8F8F7)        // Clean white
  }
  
  // Camera positions (Three.js uses positive Z for camera distance)
  // Per spec: WIDE (far) → PUSH IN → CLOSE → INTO (very close)
  const cameraPositions = {
    wide: { z: 50, fov: 60 },    // Much further back for wide shot (see all products)
    merge: { z: 30, fov: 50 },   // Pushing in
    barcode: { z: 15, fov: 45 },  // Closer
    product: { z: 10, fov: 40 },  // Close
    portal: { z: 5, fov: 30 }    // Very close (into product)
  }
  
  // Initialize positions
  const currentPositions = useMemo(() => {
    return positionSets.scatter.slice()
  }, [positionSets])
  
  // Phase management
  useEffect(() => {
    phaseStartTime.current = clock.elapsedTime
  }, [phase, clock])
  
  // Main animation loop
  useFrame((state, delta) => {
    if (!pointsRef.current || !materialRef.current) return
    
    const elapsed = state.clock.elapsedTime - phaseStartTime.current
    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array
    
    let target: Float32Array
    let progress = 0
    let particleColor = colors.chaosWarm
    let currentCameraZ = camera.position.z
    let currentFOV = (camera as THREE.PerspectiveCamera).fov
    
    // Phase transitions
    let totalElapsed = 0
    if (phase === 'chaos' && elapsed > timeline.chaos) {
      setPhase('merge')
      onPhaseChange?.('merge', 0)
    } else if (phase === 'merge' && elapsed > timeline.merge) {
      setPhase('barcode')
      onPhaseChange?.('barcode', 0)
    } else if (phase === 'barcode' && elapsed > timeline.barcode) {
      setPhase('product')
      onPhaseChange?.('product', 0)
    } else if (phase === 'product' && elapsed > timeline.product) {
      setPhase('portal')
      onPhaseChange?.('portal', 0)
    }
    
    // Phase-specific logic
    switch (phase) {
      case 'chaos':
        // Act 1: Chaos of products - particles drifting
        target = positionSets.scatter
        progress = 1
        particleColor = colors.chaosWarm
        
        // Camera: WIDE
        currentCameraZ = THREE.MathUtils.lerp(currentCameraZ, cameraPositions.wide.z, delta * 2)
        currentFOV = THREE.MathUtils.lerp(currentFOV, cameraPositions.wide.fov, delta * 2)
        break
        
      case 'merge':
        // Act 2: Products merge toward center
        const mergeProgress = Math.min(elapsed / timeline.merge, 1)
        const mergeEased = easeInQuad(mergeProgress)
        
        // Blend from scatter to barcode (merging)
        target = positionSets.barcode
        progress = mergeEased
        particleColor = new THREE.Color().lerpColors(colors.chaosWarm, colors.lightning, mergeEased)
        
        // Camera: Push IN
        currentCameraZ = THREE.MathUtils.lerp(currentCameraZ, cameraPositions.merge.z, delta * 3)
        currentFOV = THREE.MathUtils.lerp(currentFOV, cameraPositions.merge.fov, delta * 3)
        break
        
      case 'barcode':
        // Act 3: Barcode formation
        const barcodeProgress = Math.min(elapsed / timeline.barcode, 1)
        const barcodeEased = easeInOutCubic(barcodeProgress)
        
        target = positionSets.barcode
        progress = 1 // Barcode is formed
        particleColor = new THREE.Color().lerpColors(colors.lightning, colors.verifiedCool, barcodeEased)
        
        // Camera: Continue pushing IN
        currentCameraZ = THREE.MathUtils.lerp(currentCameraZ, cameraPositions.barcode.z, delta * 3)
        currentFOV = THREE.MathUtils.lerp(currentFOV, cameraPositions.barcode.fov, delta * 3)
        break
        
      case 'product':
        // Act 4: Product emergence (using first product - wine bottle)
        const productProgress = Math.min(elapsed / timeline.product, 1)
        const productEased = easeInOutCubic(productProgress)
        
        target = positionSets.products[0] // Wine bottle
        progress = productEased
        particleColor = new THREE.Color().lerpColors(colors.verifiedCool, colors.offWhite, productEased)
        
        // Camera: CLOSE
        currentCameraZ = THREE.MathUtils.lerp(currentCameraZ, cameraPositions.product.z, delta * 3)
        currentFOV = THREE.MathUtils.lerp(currentFOV, cameraPositions.product.fov, delta * 3)
        break
        
      case 'portal':
        // Act 5: Portal/tunnel effect (simplified for now)
        const portalProgress = Math.min(elapsed / timeline.portal, 1)
        const portalEased = easeInQuad(portalProgress)
        
        // Expand particles outward (tunnel effect)
        target = positionSets.products[0]
        progress = 1
        particleColor = colors.offWhite
        
        // Scale particles outward for tunnel effect
        for (let i = 0; i < positions.length; i += 3) {
          positions[i] *= (1 + portalEased * 2)
          positions[i + 1] *= (1 + portalEased * 2)
          positions[i + 2] *= (1 + portalEased * 3)
        }
        pointsRef.current.geometry.attributes.position.needsUpdate = true
        
        // Camera: INTO product
        currentCameraZ = THREE.MathUtils.lerp(currentCameraZ, cameraPositions.portal.z, delta * 5)
        currentFOV = THREE.MathUtils.lerp(currentFOV, cameraPositions.portal.fov, delta * 5)
        break
        
      default:
        target = positionSets.scatter
        progress = 1
    }
    
    // Update camera
    camera.position.z = currentCameraZ
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = currentFOV
      camera.updateProjectionMatrix()
    }
    
    // Update particle color
    materialRef.current.color.lerp(particleColor, delta * 3)
    
    // Interpolate positions (skip portal phase - handled above)
    if (phase !== 'portal') {
      const productYOffset = -1.2
      
      for (let i = 0; i < positions.length; i += 3) {
        const pointIndex = i / 3
        const stagger = (pointIndex / pointCount) * 0.3
        const localProgress = Math.max(0, Math.min(1, (progress - stagger) / (1 - stagger)))
        
        for (let j = 0; j < 3; j++) {
          const idx = i + j
          let targetValue = target[idx]
          
          // Apply vertical offset for product phase
          if (j === 1 && phase === 'product') {
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
    }
  })
  
  return (
    <>
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
