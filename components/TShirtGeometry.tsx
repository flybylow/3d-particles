import { useGLTF } from '@react-three/drei'
import { useMemo } from 'react'
import * as THREE from 'three'

export function preloadTShirt() {
  useGLTF.preload('/models/scene.gltf')
}

export function useTShirtPositions(count: number) {
  const gltf = useGLTF('/models/scene.gltf')
  
  return useMemo(() => {
    const positions: number[] = []
    
    // Calculate bounding box for centering
    const boundingBox = new THREE.Box3()
    
    gltf.scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        const geometry = child.geometry.clone()
        
        // Apply the mesh's world transform to the geometry
        child.updateWorldMatrix(true, false)
        geometry.applyMatrix4(child.matrixWorld)
        
        // Expand bounding box
        geometry.computeBoundingBox()
        if (geometry.boundingBox) {
          boundingBox.expandByObject(child)
        }
        
        // Get vertex positions
        const positionAttribute = geometry.attributes.position
        if (positionAttribute) {
          for (let i = 0; i < positionAttribute.count; i++) {
            positions.push(
              positionAttribute.getX(i),
              positionAttribute.getY(i),
              positionAttribute.getZ(i)
            )
          }
        }
      }
    })
    
    // Calculate center offset to move geometry to origin
    const center = new THREE.Vector3()
    boundingBox.getCenter(center)
    
    // Calculate size for appropriate scaling
    const size = new THREE.Vector3()
    boundingBox.getSize(size)
    const maxDimension = Math.max(size.x, size.y, size.z)
    
    // Target size - SCALED UP TO FILL SCREEN
    const targetSize = 3.5
    const scale = targetSize / maxDimension
    
    // Center and scale all positions
    for (let i = 0; i < positions.length; i += 3) {
      // Center
      positions[i] -= center.x
      positions[i + 1] -= center.y
      positions[i + 2] -= center.z
      
      // Scale
      positions[i] *= scale
      positions[i + 1] *= scale
      positions[i + 2] *= scale
    }
    
    // Sample positions to match particle count
    const sampledPositions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const sourceIndex = Math.floor(Math.random() * (positions.length / 3)) * 3
      sampledPositions[i * 3] = positions[sourceIndex]
      sampledPositions[i * 3 + 1] = positions[sourceIndex + 1]
      sampledPositions[i * 3 + 2] = positions[sourceIndex + 2]
    }
    
    return sampledPositions
  }, [gltf, count])
}
