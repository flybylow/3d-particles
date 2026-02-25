'use client'

import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface Product {
  name: string
  category: string
  co2?: string
  materials?: string[]
  origin?: string
  certifications?: string[]
}

interface ProductInfo3DProps {
  product: Product | null
  productIndex: number
  isVisible: boolean
}

// Generate particle positions for text - creates letter-like patterns
function generateTextPositions(text: string, count: number, position: [number, number, number], scale: number = 0.1): Float32Array {
  const positions: number[] = []
  const [baseX, baseY, baseZ] = position
  
  const chars = text.toUpperCase().replace(/[^A-Z0-9:,\s]/g, '') // Clean text
  const charWidth = 0.12 * scale
  const charHeight = 0.18 * scale
  const charSpacing = 0.08 * scale
  const lineHeight = charHeight * 1.3
  
  // Distribute particles to form letter-like patterns
  const particlesPerChar = Math.max(1, Math.floor(count / Math.max(1, chars.length)))
  
  for (let charIdx = 0; charIdx < chars.length; charIdx++) {
    const char = chars[charIdx]
    if (char === ' ') continue // Skip spaces
    
    const charX = baseX + (charIdx * charSpacing) - ((chars.length * charSpacing) / 2)
    const charY = baseY
    
    // Create letter-like pattern (simplified block letters)
    const particlesForThisChar = charIdx === chars.length - 1 
      ? count - (charIdx * particlesPerChar) // Use remaining particles
      : particlesPerChar
    
    for (let i = 0; i < particlesForThisChar; i++) {
      // Create a pattern that suggests letter shapes
      // Use a grid within character bounds
      const gridX = (i % 5) / 5 // 5 columns
      const gridY = Math.floor(i / 5) / Math.ceil(particlesForThisChar / 5) // Rows
      
      // Add some structure to suggest letters
      const offsetX = (gridX - 0.5) * charWidth
      const offsetY = (0.5 - gridY) * charHeight
      
      // Add slight randomness for organic feel
      const x = charX + offsetX + (Math.random() - 0.5) * 0.02
      const y = charY + offsetY + (Math.random() - 0.5) * 0.02
      const z = baseZ + (Math.random() - 0.5) * 0.03 // Slight depth
      
      positions.push(x, y, z)
    }
  }
  
  // Fill any remaining particles
  while (positions.length < count * 3) {
    const charIdx = Math.floor(Math.random() * chars.length)
    const charX = baseX + (charIdx * charSpacing) - ((chars.length * charSpacing) / 2)
    const x = charX + (Math.random() - 0.5) * charWidth
    const y = baseY + (Math.random() - 0.5) * charHeight
    const z = baseZ + (Math.random() - 0.5) * 0.03
    positions.push(x, y, z)
  }
  
  return new Float32Array(positions.slice(0, count * 3))
}

// Generate 3D card-like structure with particles forming information
function generateInfoCardPositions(
  product: Product,
  pointCount: number
): Float32Array {
  const positions: number[] = []
  
  // Card dimensions in 3D space - positioned on left side
  const cardWidth = 1.4
  const cardHeight = 2.0
  const cardDepth = 0.15
  const cardX = -2.6 // Left side position
  const cardY = 0.3 // Slightly above center
  const cardZ = 3.8 // Closer to camera
  
  let usedParticles = 0
  
  // Title section - "DIGITAL PRODUCT PASSPORT"
  const titleCount = Math.floor(pointCount * 0.12)
  const titlePositions = generateTextPositions(
    'DIGITAL PRODUCT PASSPORT',
    titleCount,
    [cardX, cardY + 0.8, cardZ],
    0.06
  )
  for (let i = 0; i < titlePositions.length; i += 3) {
    positions.push(titlePositions[i], titlePositions[i + 1], titlePositions[i + 2])
    usedParticles++
  }
  
  // Product name - larger, more prominent
  const nameCount = Math.floor(pointCount * 0.18)
  const namePositions = generateTextPositions(
    product.name,
    nameCount,
    [cardX, cardY + 0.4, cardZ],
    0.1
  )
  for (let i = 0; i < namePositions.length; i += 3) {
    positions.push(namePositions[i], namePositions[i + 1], namePositions[i + 2])
    usedParticles++
  }
  
  // Category
  if (product.category) {
    const categoryCount = Math.floor(pointCount * 0.08)
    const categoryPositions = generateTextPositions(
      product.category,
      categoryCount,
      [cardX, cardY + 0.0, cardZ],
      0.07
    )
    for (let i = 0; i < categoryPositions.length; i += 3) {
      positions.push(categoryPositions[i], categoryPositions[i + 1], categoryPositions[i + 2])
      usedParticles++
    }
  }
  
  // Origin
  if (product.origin) {
    const originCount = Math.floor(pointCount * 0.08)
    const originPositions = generateTextPositions(
      `ORIGIN: ${product.origin}`,
      originCount,
      [cardX, cardY - 0.3, cardZ],
      0.07
    )
    for (let i = 0; i < originPositions.length; i += 3) {
      positions.push(originPositions[i], originPositions[i + 1], originPositions[i + 2])
      usedParticles++
    }
  }
  
  // CO2
  if (product.co2) {
    const co2Count = Math.floor(pointCount * 0.08)
    const co2Positions = generateTextPositions(
      `CO₂: ${product.co2}`,
      co2Count,
      [cardX, cardY - 0.6, cardZ],
      0.07
    )
    for (let i = 0; i < co2Positions.length; i += 3) {
      positions.push(co2Positions[i], co2Positions[i + 1], co2Positions[i + 2])
      usedParticles++
    }
  }
  
  // Materials
  if (product.materials && product.materials.length > 0) {
    const materialsText = `MATERIALS: ${product.materials.join(', ')}`
    const materialsCount = Math.floor(pointCount * 0.12)
    const materialsPositions = generateTextPositions(
      materialsText,
      materialsCount,
      [cardX, cardY - 0.9, cardZ],
      0.06
    )
    for (let i = 0; i < materialsPositions.length; i += 3) {
      positions.push(materialsPositions[i], materialsPositions[i + 1], materialsPositions[i + 2])
      usedParticles++
    }
  }
  
  // Certifications
  if (product.certifications && product.certifications.length > 0) {
    const certText = `CERTIFIED: ${product.certifications.join(', ')}`
    const certCount = Math.floor(pointCount * 0.08)
    const certPositions = generateTextPositions(
      certText,
      certCount,
      [cardX, cardY - 1.2, cardZ],
      0.06
    )
    for (let i = 0; i < certPositions.length; i += 3) {
      positions.push(certPositions[i], certPositions[i + 1], certPositions[i + 2])
      usedParticles++
    }
  }
  
  // Fill remaining particles in card background/frame
  const remaining = pointCount - usedParticles
  for (let i = 0; i < remaining; i++) {
    // Create subtle frame/border effect
    const isBorder = Math.random() < 0.3
    let x, y, z
    if (isBorder) {
      // Border particles
      const side = Math.floor(Math.random() * 4)
      if (side === 0) x = cardX - cardWidth/2 // Left
      else if (side === 1) x = cardX + cardWidth/2 // Right
      else x = cardX + (Math.random() - 0.5) * cardWidth
      
      if (side === 2) y = cardY + cardHeight/2 // Top
      else if (side === 3) y = cardY - cardHeight/2 // Bottom
      else y = cardY + (Math.random() - 0.5) * cardHeight
      
      z = cardZ + (Math.random() - 0.5) * 0.05
    } else {
      // Background particles
      x = cardX + (Math.random() - 0.5) * cardWidth * 0.8
      y = cardY + (Math.random() - 0.5) * cardHeight * 0.8
      z = cardZ + (Math.random() - 0.5) * cardDepth
    }
    positions.push(x, y, z)
  }
  
  return new Float32Array(positions.slice(0, pointCount * 3))
}

export function ProductInfo3D({ product, productIndex, isVisible }: ProductInfo3DProps) {
  const pointsRef = useRef<THREE.Points>(null)
  const targetPositionsRef = useRef<Float32Array | null>(null)
  const currentPositionsRef = useRef<Float32Array | null>(null)
  const morphProgress = useRef(0)
  
  // Generate target positions when product changes
  const targetPositions = useMemo(() => {
    if (!product) return new Float32Array(0)
    return generateInfoCardPositions(product, 3000) // More particles for better text formation
  }, [product])
  
  useEffect(() => {
    if (targetPositions.length > 0) {
      targetPositionsRef.current = targetPositions
      // Reset morph and initialize positions when product changes
      currentPositionsRef.current = new Float32Array(targetPositions.length)
      // Start from scattered positions (left side area)
      for (let i = 0; i < targetPositions.length; i += 3) {
        currentPositionsRef.current[i] = -2.5 + (Math.random() - 0.5) * 2
        currentPositionsRef.current[i + 1] = (Math.random() - 0.5) * 2
        currentPositionsRef.current[i + 2] = 3.5 + (Math.random() - 0.5) * 1
      }
      morphProgress.current = 0
      
      // Update geometry immediately
      if (pointsRef.current) {
        const positions = pointsRef.current.geometry.attributes.position
        if (positions) {
          for (let i = 0; i < currentPositionsRef.current.length; i++) {
            positions.array[i] = currentPositionsRef.current[i]
          }
          positions.needsUpdate = true
        }
      }
    }
  }, [targetPositions, product])
  
  useFrame((state, delta) => {
    if (!pointsRef.current || !targetPositionsRef.current || !currentPositionsRef.current) return
    if (!isVisible) return
    
    // Morph from current to target positions
    morphProgress.current = Math.min(morphProgress.current + delta * 2, 1) // 0.5s morph
    
    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array
    const time = state.clock.elapsedTime
    
    // Subtle floating animation
    const floatAmount = Math.sin(time * 0.5) * 0.02
    
    for (let i = 0; i < targetPositionsRef.current.length; i += 3) {
      const currentX = currentPositionsRef.current[i]
      const currentY = currentPositionsRef.current[i + 1]
      const currentZ = currentPositionsRef.current[i + 2]
      
      const targetX = targetPositionsRef.current[i]
      const targetY = targetPositionsRef.current[i + 1] + floatAmount // Subtle float
      const targetZ = targetPositionsRef.current[i + 2]
      
      const t = THREE.MathUtils.smoothstep(morphProgress.current, 0, 1)
      
      positions[i] = THREE.MathUtils.lerp(currentX, targetX, t)
      positions[i + 1] = THREE.MathUtils.lerp(currentY, targetY, t)
      positions[i + 2] = THREE.MathUtils.lerp(currentZ, targetZ, t)
      
      // Update current for next frame
      currentPositionsRef.current[i] = positions[i]
      currentPositionsRef.current[i + 1] = positions[i + 1]
      currentPositionsRef.current[i + 2] = positions[i + 2]
    }
    
    pointsRef.current.geometry.attributes.position.needsUpdate = true
  })
  
  if (!product || !isVisible || targetPositions.length === 0) {
    return null
  }
  
  // Ensure we have valid positions
  const initialPositions = currentPositionsRef.current || new Float32Array(targetPositions.length)
  
  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={initialPositions}
          count={targetPositions.length / 3}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.015}
        color="#F8F8F7"
        sizeAttenuation
        transparent
        opacity={0.85}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
