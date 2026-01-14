'use client'

import { useEffect, useState, useRef } from 'react'
import './ProductInfoTile.css'
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

export function ProductInfoTile({ product, phase, productIndex, isTransitioning = false }: ProductInfoTileProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [showContent, setShowContent] = useState(false)
  const [isSlidingOut, setIsSlidingOut] = useState(false)
  const [key, setKey] = useState(0) // Force re-render for new products
  const [displayProduct, setDisplayProduct] = useState<Product | null>(null) // Hold product data during slide-out
  const prevProductIndex = useRef(productIndex)
  const prevProductRef = useRef<Product | null>(null)

  // Handle transition start - slide out old cards when morphing begins
  useEffect(() => {
    if (isTransitioning && isVisible && !isSlidingOut && displayProduct) {
      setIsSlidingOut(true)
      // Keep displayProduct as old product during slide-out
    }
  }, [isTransitioning, isVisible, isSlidingOut, displayProduct])
  
  // Handle visibility and product changes
  useEffect(() => {
    const productChanged = prevProductIndex.current !== productIndex || prevProductRef.current?.name !== product?.name
    
    // Show panels when in preload or cycling phase and product is available
    if ((phase === 'preload' || phase === 'cycling') && product) {
      // If sliding out, wait for animation to complete
      if (isSlidingOut) {
        const slideOutTimer = setTimeout(() => {
          setIsSlidingOut(false)
          setIsVisible(false)
          setShowContent(false)
          
          // Then slide in new cards
          const slideInTimer = setTimeout(() => {
            setDisplayProduct(product)
            setIsVisible(true)
            setShowContent(true)
            setKey(prev => prev + 1)
            prevProductIndex.current = productIndex
            prevProductRef.current = product
          }, 50)
          
          return () => clearTimeout(slideInTimer)
        }, 400) // Match slide-out animation duration
        
        return () => clearTimeout(slideOutTimer)
      }
      // Normal show (first time or not transitioning)
      else if (!isSlidingOut) {
        setDisplayProduct(product)
        setIsVisible(true)
        setShowContent(true)
        if (productChanged) {
          setKey(prev => prev + 1)
        }
        prevProductIndex.current = productIndex
        prevProductRef.current = product
      }
    } else {
      setIsVisible(false)
      setShowContent(false)
      setIsSlidingOut(false)
      setDisplayProduct(null)
    }
  }, [phase, product, productIndex, isSlidingOut])
  
  // Show sliding-out cards during transition, or visible cards normally
  if ((!isVisible && !isSlidingOut) || !displayProduct) return null

  // Create multiple panels with different information
  // All panels on left side, right side kept free
  const panels = [
    {
      position: 'top-left',
      variant: 'standard',
      title: displayProduct.name,
      items: [
        { label: 'Category', value: displayProduct.category, checked: true },
        { label: 'Origin', value: displayProduct.origin, checked: !!displayProduct.origin },
      ]
    },
    {
      position: 'middle-left',
      variant: 'wide', // Different form factor - wider
      title: 'Environmental',
      items: [
        { label: 'CO₂ Footprint', value: displayProduct.co2, checked: !!displayProduct.co2 },
      ]
    },
    {
      position: 'bottom-left',
      variant: 'standard',
      title: 'Materials',
      items: displayProduct.materials?.map(material => ({
        label: material,
        value: 'Verified',
        checked: true
      })) || []
    },
    {
      position: 'bottom-middle-left',
      variant: 'wide', // Different form factor - wider
      title: 'Certifications',
      items: displayProduct.certifications?.map(cert => ({
        label: cert,
        value: 'Valid',
        checked: true
      })) || []
    }
  ].filter(panel => panel.items.length > 0)

  return (
    <>
      {panels.map((panel, idx) => (
        <div 
          key={`${key}-${idx}`}
          className={`product-info-panel ${isVisible ? 'visible' : ''} ${isSlidingOut ? 'sliding-out' : ''} ${panel.position} ${panel.variant}`}
        >
          <div className="panel-background">
            <div className="panel-pattern"></div>
          </div>
          <div className={`panel-content ${showContent ? 'show' : ''}`}>
            <div className="panel-title">{panel.title}</div>
            <div className="panel-items">
              {panel.items.map((item, itemIdx) => (
                <div key={itemIdx} className="panel-item">
                  <span className={`checkmark ${item.checked ? 'checked' : ''}`}>
                    {item.checked ? '✓' : ''}
                  </span>
                  <div className="item-content">
                    <span className="item-label">{item.label}</span>
                    {item.value && <span className="item-value">{item.value}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </>
  )
}
