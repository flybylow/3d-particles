import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

/**
 * Extract vertices from the wine bottle GLTF model for particle positioning
 */
export function extractWineBottlePositions(pointCount: number): Float32Array {
  const { scene } = useGLTF('/models/wine-bottle.gltf')
  return extractModelPositions(scene, pointCount)
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
