'use client'

import { useEffect, useState, useRef } from 'react'
import './ProductInfoPanel.css'

interface Product {
  name: string
  modelPath: string
  category: string
  co2?: string
  materials?: string[]
  origin?: string
  certifications?: string[]
}

interface ProductInfoTileProps {
  product: Product | null
  phase: string
  productIndex: number
  isTransitioning?: boolean
}

export function ProductInfoTile({ product, phase, isTransitioning = false }: ProductInfoTileProps) {
  const [displayProduct, setDisplayProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const prevProductName = useRef<string | null>(null)

  // Only show panel when in preload or cycling phase
  const shouldShow = phase === 'preload' || phase === 'cycling'

  // Handle product changes with loading state
  useEffect(() => {
    if (!shouldShow || !product) {
      setDisplayProduct(null)
      setIsLoading(false)
      prevProductName.current = null
      return
    }

    // If product name changed, show loading state
    if (prevProductName.current !== product.name) {
      setIsLoading(true)

      // Brief loading delay, then show new product
      const timer = setTimeout(() => {
        setDisplayProduct(product)
        setIsLoading(false)
        prevProductName.current = product.name
      }, 400) // Match the 3D transition timing

      return () => clearTimeout(timer)
    }
  }, [product, shouldShow])

  // Also trigger loading when isTransitioning becomes true
  useEffect(() => {
    if (isTransitioning && displayProduct) {
      setIsLoading(true)
    }
  }, [isTransitioning, displayProduct])

  if (!shouldShow) {
    return null
  }

  return (
    <div className={`product-info-panel-simple ${isLoading ? 'loading' : ''}`}>
      <div className="panel-header">
        <span className="panel-label">Digital Product Passport</span>
        <h2 className="panel-title">
          {isLoading ? (
            <span className="loading-text">Loading...</span>
          ) : (
            displayProduct?.name || '—'
          )}
        </h2>
      </div>

      <div className="panel-body">
        <div className="info-row">
          <span className="info-label">Category</span>
          <span className="info-value">
            {isLoading ? <span className="loading-bar"></span> : displayProduct?.category || '—'}
          </span>
        </div>

        <div className="info-row">
          <span className="info-label">Origin</span>
          <span className="info-value">
            {isLoading ? <span className="loading-bar"></span> : displayProduct?.origin || '—'}
          </span>
        </div>

        <div className="info-row">
          <span className="info-label">CO₂ Footprint</span>
          <span className="info-value">
            {isLoading ? <span className="loading-bar"></span> : displayProduct?.co2 || '—'}
          </span>
        </div>

        <div className="info-row">
          <span className="info-label">Materials</span>
          <span className="info-value">
            {isLoading ? <span className="loading-bar"></span> : displayProduct?.materials?.join(', ') || '—'}
          </span>
        </div>

        <div className="info-row">
          <span className="info-label">Certifications</span>
          <span className="info-value">
            {isLoading ? <span className="loading-bar"></span> : displayProduct?.certifications?.join(', ') || '—'}
          </span>
        </div>
      </div>
    </div>
  )
}
