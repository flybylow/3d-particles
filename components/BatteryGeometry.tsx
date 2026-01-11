import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { useMemo } from 'react'

interface GLTFResult {
  scene: THREE.Group
}

export function preloadBattery() {
  useGLTF.preload('/models/batt2.gltf')
}

export function extractBatteryPositions(pointCount: number): Float32Array {
  const { scene } = useGLTF('/models/batt2.gltf') as GLTFResult
  const allVerts: THREE.Vector3[] = []
  const scale = 0.25 // Even larger scale to make battery recognizable
  const rotationX = -Math.PI / 2 // Rotate 90 degrees around X-axis to stand upright
  const rotationZ = 0 // No Z rotation needed
  const rotationY = 0 // No Y rotation needed
  const yOffset = -0.6 // Adjust vertical position

  scene.traverse((child) => {
    if (child instanceof THREE.Mesh && child.geometry) {
      const pos = child.geometry.attributes.position
      const matrix = child.matrixWorld
      // Sample every Nth vertex to reduce density and make shape clearer
      const step = Math.max(1, Math.floor(pos.count / (pointCount * 1.5)))
      for (let i = 0; i < pos.count; i += step) {
        const vec = new THREE.Vector3().fromBufferAttribute(pos, i)
        vec.applyMatrix4(matrix)
        // Apply scale and initial rotation
        vec.multiplyScalar(scale)
        vec.applyAxisAngle(new THREE.Vector3(1, 0, 0), rotationX) // Stand upright
        vec.applyAxisAngle(new THREE.Vector3(0, 0, 1), rotationZ) // Tilt for side view
        vec.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotationY) // Flip
        allVerts.push(vec.clone())
      }
    }
  })

  if (allVerts.length === 0) {
    console.warn('No vertices found in battery model')
    return new Float32Array(pointCount * 3)
  }

  // Sample or repeat vertices to match pointCount
  const positions = new Float32Array(pointCount * 3)
  for (let i = 0; i < pointCount; i++) {
    const vert = allVerts[i % allVerts.length]
    positions[i * 3] = vert.x
    positions[i * 3 + 1] = vert.y + yOffset // Apply vertical offset
    positions[i * 3 + 2] = vert.z
  }

  return positions
}

export function useBatteryPositions(pointCount: number) {
  return useMemo(() => extractBatteryPositions(pointCount), [pointCount])
}

// Preload the model
preloadBattery()
