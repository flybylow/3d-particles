'use client'

import { Canvas } from '@react-three/fiber'
import { ScanShaderExercise } from '@/components/ScanShaderExercise'

export default function ShaderTestPage() {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000000' }}>
      <Canvas
        camera={{ position: [0, 0, 3.5], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={['#0A0A0A']} />
        <ScanShaderExercise />
      </Canvas>
      
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        color: 'white',
        fontFamily: 'monospace',
        fontSize: '14px',
        background: 'rgba(0,0,0,0.5)',
        padding: '10px',
        borderRadius: '4px'
      }}>
        <div>Shader Exercise: Elegant Scan Light</div>
        <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '5px' }}>
          Watch the scan line sweep across particles
        </div>
      </div>
    </div>
  )
}
