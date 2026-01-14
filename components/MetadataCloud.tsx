'use client'

import { useRef, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

interface MetadataCloudProps {
  product: {
    co2?: string
    materials?: string[]
    certifications?: string[]
  } | null
  productIndex: number
}

export function MetadataCloud({ product, productIndex }: MetadataCloudProps) {
  if (!product) return null
  
  // 3D positions for metadata panels (relative to passport card at -2.8, 0, 4.8)
  const co2Pos = new THREE.Vector3(-2.8 + 0.4, 0.3, 4.8 - 0.2)
  const materialsPos = new THREE.Vector3(-2.8 - 0.3, 0.25, 4.8 - 0.15)
  const certsPos = new THREE.Vector3(-2.8, 0.35, 4.8 - 0.1)
  
  return (
    <>
      {product.co2 && (
        <Html position={co2Pos} center transform occlude>
          <div className="metadata-cloud-item metadata-co2">
            <div className="metadata-icon">🌍</div>
            <div className="metadata-content">
              <div className="metadata-label">CO₂ Footprint</div>
              <div className="metadata-value">{product.co2}</div>
            </div>
          </div>
        </Html>
      )}
      
      {product.materials && product.materials.length > 0 && (
        <Html position={materialsPos} center transform occlude>
          <div className="metadata-cloud-item metadata-materials">
            <div className="metadata-icon">🧵</div>
            <div className="metadata-content">
              <div className="metadata-label">Materials</div>
              <div className="materials-list">
                {product.materials.map((material, idx) => (
                  <div key={`material-${idx}`} className="material-tag">
                    {material}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Html>
      )}
      
      {product.certifications && product.certifications.length > 0 && (
        <Html position={certsPos} center transform occlude>
          <div className="metadata-cloud-item metadata-certifications">
            <div className="metadata-icon">✓</div>
            <div className="metadata-content">
              <div className="metadata-label">Certifications</div>
              <div className="certifications-list">
                {product.certifications.map((cert, idx) => (
                  <div key={`cert-${idx}`} className="certification-item">
                    <span className="cert-label">{cert}</span>
                    <span className="cert-status">Valid</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Html>
      )}
    </>
  )
}
