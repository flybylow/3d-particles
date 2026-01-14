'use client'

import { useEffect, useState } from 'react'
import './ProductDetailsFlow.css'

interface Product {
  name: string
  modelPath: string
  category: string
  co2?: string
  materials?: string[]
  origin?: string
  certifications?: string[]
}

interface ProductDetailsFlowProps {
  product: Product | null
  productIndex: number
}

export function ProductDetailsFlow({ product, productIndex }: ProductDetailsFlowProps) {
  const [isVisible, setIsVisible] = useState(false)

  // Control visibility based on product
  useEffect(() => {
    if (product) {
      setIsVisible(true)
    } else {
      setIsVisible(false)
    }
  }, [product])

  if (!product || !isVisible) {
    return null
  }

  return (
    <div className="product-details-flow">
      <div className="card-background">
        <div className="card-pattern"></div>
        <div className="card-border"></div>
      </div>
      <div className="flow-content">
        <div className="details-grid">
          {/* Materials */}
          {product.materials && product.materials.length > 0 && (
            <div className="info-line">
              <span className="info-label">MATERIALS</span>
              <span className="info-value">
                {product.materials.join(', ')}
              </span>
            </div>
          )}

          {/* CO2 Impact */}
          {product.co2 && (
            <div className="info-line">
              <span className="info-label">CARBON</span>
              <span className="info-value">{product.co2}</span>
            </div>
          )}

          {/* Certifications */}
          {product.certifications && product.certifications.length > 0 && (
            <div className="info-line">
              <span className="info-label">CERTIFIED</span>
              <span className="info-value">{product.certifications[0]}</span>
            </div>
          )}

          {/* Origin */}
          {product.origin && (
            <div className="info-line">
              <span className="info-label">ORIGIN</span>
              <span className="info-value">{product.origin}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}