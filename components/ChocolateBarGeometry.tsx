import * as THREE from 'three'

/**
 * Generate vertices for a simple chocolate bar geometry
 * Returns an array of Vector3 positions suitable for particle positioning
 */
export function generateChocolateBarPositions(pointCount: number): Float32Array {
  const positions: number[] = []
  
  // Chocolate bar dimensions
  const width = 1.2
  const height = 0.6
  const depth = 0.15
  
  // Number of segments (like a real chocolate bar)
  const segmentsX = 6
  const segmentsY = 2
  
  const segmentWidth = width / segmentsX
  const segmentHeight = height / segmentsY
  
  // Generate points on the surface and inside the chocolate bar
  for (let i = 0; i < pointCount; i++) {
    // Randomly choose surface or interior
    const isSurface = Math.random() < 0.7 // 70% on surface for better definition
    
    if (isSurface) {
      // Generate points on the surface
      const face = Math.floor(Math.random() * 6) // 6 faces of the bar
      let x, y, z
      
      switch (face) {
        case 0: // Front face
          x = (Math.random() - 0.5) * width
          y = (Math.random() - 0.5) * height
          z = depth / 2
          break
        case 1: // Back face
          x = (Math.random() - 0.5) * width
          y = (Math.random() - 0.5) * height
          z = -depth / 2
          break
        case 2: // Top face
          x = (Math.random() - 0.5) * width
          y = height / 2
          z = (Math.random() - 0.5) * depth
          break
        case 3: // Bottom face
          x = (Math.random() - 0.5) * width
          y = -height / 2
          z = (Math.random() - 0.5) * depth
          break
        case 4: // Right face
          x = width / 2
          y = (Math.random() - 0.5) * height
          z = (Math.random() - 0.5) * depth
          break
        case 5: // Left face
        default:
          x = -width / 2
          y = (Math.random() - 0.5) * height
          z = (Math.random() - 0.5) * depth
          break
      }
      
      // Add slight segment grooves for chocolate bar detail
      const segX = Math.floor((x + width / 2) / segmentWidth)
      const segY = Math.floor((y + height / 2) / segmentHeight)
      const grooveDepth = 0.015
      
      // Add groove depth on front and back faces
      if (face === 0 || face === 1) {
        const inGrooveX = Math.abs((x + width / 2) % segmentWidth - segmentWidth / 2) < 0.02
        const inGrooveY = Math.abs((y + height / 2) % segmentHeight - segmentHeight / 2) < 0.02
        
        if (inGrooveX || inGrooveY) {
          z += (face === 0 ? -grooveDepth : grooveDepth)
        }
      }
      
      positions.push(x, y, z)
    } else {
      // Interior points
      positions.push(
        (Math.random() - 0.5) * width,
        (Math.random() - 0.5) * height,
        (Math.random() - 0.5) * depth
      )
    }
  }
  
  return new Float32Array(positions)
}

/**
 * Create a THREE.js mesh for preview/debugging
 */
export function createChocolateBarMesh(): THREE.Mesh {
  const width = 1.2
  const height = 0.6
  const depth = 0.15
  
  const geometry = new THREE.BoxGeometry(width, height, depth)
  const material = new THREE.MeshStandardMaterial({
    color: '#5D3A1A',
    metalness: 0.1,
    roughness: 0.7
  })
  
  return new THREE.Mesh(geometry, material)
}
