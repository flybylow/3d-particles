/**
 * Shader Exercise: Elegant Scan Light Effect
 * 
 * This demonstrates:
 * 1. Custom GLSL shaders for smooth gradients
 * 2. Additive blending for glow effects
 * 3. Animated scan line with pulse
 * 4. Particle highlighting as scan passes
 */

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import {
  scanLightVertexShader,
  scanLightFragmentShader,
} from './ScanLightShader'

export function ScanShaderExercise() {
  const scanMeshRef = useRef<THREE.Mesh>(null)
  const scanMaterialRef = useRef<THREE.ShaderMaterial>(null)
  
  // Shader uniforms for scan light
  const scanUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIntensity: { value: 1.0 },
      uColorCore: { value: new THREE.Color(0xFFFFFF) },  // Bright white core
      uColorEdge: { value: new THREE.Color(0x4CC9F0) },  // Blue-cyan edges
      uWidth: { value: 0.3 },
    }),
    []
  )
  
  // Generate test particles
  const testParticles = useMemo(() => {
    const positions: number[] = []
    const count = 3000
    
    for (let i = 0; i < count; i++) {
      positions.push(
        (Math.random() - 0.5) * 4,  // x: -2 to 2
        (Math.random() - 0.5) * 3,  // y: -1.5 to 1.5
        (Math.random() - 0.5) * 0.5 // z: small depth
      )
    }
    
    return new Float32Array(positions)
  }, [])
  
  // Animation loop
  useFrame((state) => {
    const time = state.clock.elapsedTime
    
    // Update scan light uniforms
    if (scanMaterialRef.current) {
      scanMaterialRef.current.uniforms.uTime.value = time
    }
    
    // Move scan light across screen
    if (scanMeshRef.current) {
      const scanProgress = (time % 3.0) / 3.0 // 3 second cycle
      scanMeshRef.current.position.x = -2.5 + (scanProgress * 5) // Sweep -2.5 to 2.5
    }
  })
  
  return (
    <group>
      {/* Background particles - more visible */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={testParticles}
            count={testParticles.length / 3}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.02}
          color="#F8F8F7"
          transparent
          opacity={0.6}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      
      {/* Simple test light first - basic plane */}
      <mesh ref={scanMeshRef} position={[-2.5, 0, 0.2]}>
        <planeGeometry args={[0.15, 2.5]} />
        <meshBasicMaterial
          color="#4CC9F0"
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Glow halo - wider and softer */}
      <mesh ref={scanMeshRef} position={[-2.5, 0, 0.1]}>
        <planeGeometry args={[0.6, 2.8]} />
        <meshBasicMaterial
          color="#4CC9F0"
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}
