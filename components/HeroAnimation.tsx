import { useRef, useMemo, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

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
  const width = 1.8
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

// Extract model positions
function extractModelPositions(scene: THREE.Object3D, pointCount: number): Float32Array {
  const allVerts: THREE.Vector3[] = []
  
  scene.updateMatrixWorld(true)
  
  scene.traverse((child) => {
    if (child instanceof THREE.Mesh && child.geometry) {
      const pos = child.geometry.attributes.position
      const matrix = child.matrixWorld
      
      for (let i = 0; i < pos.count; i++) {
        const vec = new THREE.Vector3()
        vec.fromBufferAttribute(pos, i)
        vec.applyMatrix4(matrix)
        allVerts.push(vec.clone())
      }
    }
  })
  
  const positions: number[] = []
  
  if (allVerts.length === 0) {
    // Fallback: generate a cube if no verts found
    for (let i = 0; i < pointCount; i++) {
      positions.push(
        (Math.random() - 0.5) * 1,
        (Math.random() - 0.5) * 1,
        (Math.random() - 0.5) * 1
      )
    }
  } else if (allVerts.length >= pointCount) {
    const stride = Math.floor(allVerts.length / pointCount)
    for (let i = 0; i < pointCount; i++) {
      const v = allVerts[Math.min(i * stride, allVerts.length - 1)]
      positions.push(v.x, v.y, v.z)
    }
  } else {
    for (let i = 0; i < pointCount; i++) {
      const v = allVerts[i % allVerts.length]
      const offset = i >= allVerts.length ? 0.002 : 0
      positions.push(
        v.x + (Math.random() - 0.5) * offset,
        v.y + (Math.random() - 0.5) * offset,
        v.z + (Math.random() - 0.5) * offset
      )
    }
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
  const [phase, setPhase] = useState<'barcode' | 'scatter' | 'forming' | 'product' | 'hold'>('barcode')
  const phaseStartTime = useRef(0)
  const { clock } = useThree()
  
  // Load all product models
  const productScenes = products.map(p => {
    try {
      const { scene } = useGLTF(p.modelPath)
      return scene
    } catch {
      return null
    }
  })
  
  // Generate all position sets
  const positionSets = useMemo(() => {
    const barcode = generateBarcodePositions(pointCount)
    const scatter = generateScatterPositions(pointCount)
    const productPositions = productScenes.map(scene => 
      scene ? extractModelPositions(scene, pointCount) : scatter
    )
    
    return { barcode, scatter, products: productPositions }
  }, [pointCount, productScenes])
  
  // Timeline configuration (in seconds)
  const timeline = {
    barcode: 1.5,      // Show barcode
    scatter: 1.0,      // Dissolve to scatter
    forming: 1.2,      // Form into product
    product: 0.8,      // Show product (with rotation)
    hold: 2.0          // Hold before next cycle
  }
  
  // Initialize positions
  const currentPositions = useMemo(() => {
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
    
    // Determine target and progress based on phase
    let target: Float32Array
    let progress = 0
    let shouldRotate = false
    
    switch (phase) {
      case 'barcode':
        target = positionSets.barcode
        progress = Math.min(elapsed / 0.5, 1)
        if (elapsed > timeline.barcode) {
          setPhase('scatter')
          onPhaseChange?.('scatter', currentProductIndex)
        }
        break
        
      case 'scatter':
        target = positionSets.scatter
        progress = easeInOutCubic(Math.min(elapsed / timeline.scatter, 1))
        if (elapsed > timeline.scatter) {
          setPhase('forming')
          onPhaseChange?.('forming', currentProductIndex)
        }
        break
        
      case 'forming':
        target = positionSets.products[currentProductIndex]
        progress = easeInOutCubic(Math.min(elapsed / timeline.forming, 1))
        if (elapsed > timeline.forming) {
          setPhase('product')
          onPhaseChange?.('product', currentProductIndex)
        }
        break
        
      case 'product':
        target = positionSets.products[currentProductIndex]
        progress = 1
        shouldRotate = true
        if (elapsed > timeline.product) {
          setPhase('hold')
          onPhaseChange?.('hold', currentProductIndex)
        }
        break
        
      case 'hold':
        target = positionSets.products[currentProductIndex]
        progress = 1
        shouldRotate = true
        if (elapsed > timeline.hold) {
          // Move to next product
          const nextIndex = (currentProductIndex + 1) % products.length
          setCurrentProductIndex(nextIndex)
          setPhase('scatter')
          onPhaseChange?.('scatter', nextIndex)
        }
        break
        
      default:
        target = positionSets.barcode
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
    
    // Rotation during product phase
    if (shouldRotate) {
      pointsRef.current.rotation.y += delta * 0.15
    } else {
      // Smoothly return to front-facing
      pointsRef.current.rotation.y *= 0.95
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
        color="#ffffff"
        sizeAttenuation
        transparent
        opacity={0.92}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

// Preload models
export function preloadProducts(products: Product[]) {
  products.forEach(p => useGLTF.preload(p.modelPath))
}

