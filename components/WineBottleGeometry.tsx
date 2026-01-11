import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { useMemo } from 'react'

/**
 * Hook to extract vertices from the wine bottle GLTF model for particle positioning
 * Wine bottle is centered at its middle point (not bottom) at origin (0,0,0)
 * @param pointCount - Number of particles to distribute across the model
 * @param scale - Scale factor to adjust model size (default 0.08 for good visibility)
 */
export function useWineBottlePositions(pointCount: number, scale: number = 0.25): Float32Array {
  const { scene } = useGLTF('/models/wine-bottle.gltf')
  
  return useMemo(() => {
    const positions = extractModelPositions(scene, pointCount)
    
    // Rotate to make bottle stand upright vertically with cork on top
    const standUpAngle = -Math.PI / 2 // -90 degrees to stand up (cork up)
    const spinAngle = -Math.PI / 2 // -90 degrees to face forward
    
    const cosX = Math.cos(standUpAngle)
    const sinX = Math.sin(standUpAngle)
    const cosY = Math.cos(spinAngle)
    const sinY = Math.sin(spinAngle)
    
    // First pass: Scale and rotate, track bounds
    let minY = Infinity
    let maxY = -Infinity
    
    for (let i = 0; i < positions.length; i += 3) {
      // Scale
      let x = positions[i] * scale
      let y = positions[i + 1] * scale
      let z = positions[i + 2] * scale
      
      // First: Rotate 90° around X axis to stand the bottle upright
      const y1 = y * cosX - z * sinX
      const z1 = y * sinX + z * cosX
      
      // Second: Rotate around Y axis to face forward
      const x2 = x * cosY + z1 * sinY
      const z2 = -x * sinY + z1 * cosY
      
      positions[i] = x2
      positions[i + 1] = y1
      positions[i + 2] = z2
      
      // Track Y bounds
      minY = Math.min(minY, y1)
      maxY = Math.max(maxY, y1)
    }
    
    // Calculate center offset: shift bottle so its middle is at Y=0
    const centerYOffset = (minY + maxY) / 2
    
    // Second pass: Center the bottle vertically
    for (let i = 1; i < positions.length; i += 3) {
      positions[i] -= centerYOffset
    }
    
    return positions
  }, [scene, pointCount, scale])
}

/**
 * Extract model positions from a GLTF scene
 * Samples vertices from all meshes in the scene
 */
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
    // Fallback: generate a simple shape if no verts found
    for (let i = 0; i < pointCount; i++) {
      positions.push(
        (Math.random() - 0.5) * 1,
        (Math.random() - 0.5) * 1,
        (Math.random() - 0.5) * 1
      )
    }
  } else if (allVerts.length >= pointCount) {
    // Sample evenly
    const stride = Math.floor(allVerts.length / pointCount)
    for (let i = 0; i < pointCount; i++) {
      const v = allVerts[Math.min(i * stride, allVerts.length - 1)]
      positions.push(v.x, v.y, v.z)
    }
  } else {
    // Duplicate vertices to reach point count
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

// Preload the wine bottle model
export function preloadWineBottle() {
  useGLTF.preload('/models/wine-bottle.gltf')
}
