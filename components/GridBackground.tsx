'use client'

import { useEffect, useRef } from 'react'
import './GridBackground.css'

interface SquareData {
  color: string
  baseOpacity: number
  animationDelay: number
  duration: number
}

interface GridBackgroundProps {
  phase?: string
  featuredInfo?: {
    title?: string
    subtitle?: string
    content?: string
  }
  featuredTileIndex?: number // Optional: specify which tile, otherwise picks center
}

export function GridBackground({ phase = 'intro', featuredInfo, featuredTileIndex }: GridBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const featuredTileRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Grid configuration - Bigger squares
    const squareSize = 70
    const gap = 6
    const cellSize = squareSize + gap

    // Calculate grid dimensions (add extra cells for smooth edges)
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const cols = Math.ceil(viewportWidth / cellSize) + 2
    const rows = Math.ceil(viewportHeight / cellSize) + 2

    // Color distribution
    const colors = {
      background: '#1A1A1A',
      squares: [
        '#2A2A2A',  // 60% - darkest
        '#333333',  // 25% - subtle
        '#444444',  // 10% - medium
        '#88927D',  // 5% - sage accent
      ]
    }

    // Create squares
    const squares: SquareData[] = []
    const totalSquares = cols * rows

    for (let i = 0; i < totalSquares; i++) {
      // Random number for distribution
      const rand = Math.random()

      let color: string
      if (rand < 0.6) {
        color = colors.squares[0] // 60%
      } else if (rand < 0.85) {
        color = colors.squares[1] // 25%
      } else if (rand < 0.95) {
        color = colors.squares[2] // 10%
      } else {
        color = colors.squares[3] // 5%
      }

      // Random base opacity between 0.3 and 0.7
      const baseOpacity = 0.3 + Math.random() * 0.4

      // Random animation delay (0 to 0.5 second) - faster start
      const animationDelay = Math.random() * 500

      // Random duration between 1000-2000ms (much faster breathing)
      const duration = 1000 + Math.random() * 1000

      squares.push({
        color,
        baseOpacity,
        animationDelay,
        duration
      })
    }

    // Create grid structure
    container.style.setProperty('--grid-cols', cols.toString())
    container.style.setProperty('--grid-rows', rows.toString())
    container.style.setProperty('--square-size', `${squareSize}px`)
    container.style.setProperty('--gap', `${gap}px`)
    
    // Initial blur will be set by the phase effect below

    // Calculate featured tile index (center tile by default)
    const centerCol = Math.floor(cols / 2)
    const centerRow = Math.floor(rows / 2)
    const defaultFeaturedIndex = centerRow * cols + centerCol
    const selectedTileIndex = featuredTileIndex !== undefined ? featuredTileIndex : defaultFeaturedIndex
    
    // Create square elements
    const fragment = document.createDocumentFragment()
    squares.forEach((square, index) => {
      const squareEl = document.createElement('div')
      const isFeatured = index === selectedTileIndex && featuredInfo
      
      squareEl.className = isFeatured ? 'grid-square featured-tile' : 'grid-square'
      squareEl.style.backgroundColor = square.color
      squareEl.style.opacity = square.baseOpacity.toString()
      squareEl.style.setProperty('--base-opacity', square.baseOpacity.toString())
      squareEl.style.setProperty('--animation-delay', `${square.animationDelay}ms`)
      squareEl.style.setProperty('--animation-duration', `${square.duration}ms`)
      
      // Add information overlay to featured tile
      if (isFeatured) {
        const infoOverlay = document.createElement('div')
        infoOverlay.className = 'tile-info'
        if (featuredInfo.title) {
          const titleEl = document.createElement('div')
          titleEl.className = 'tile-title'
          titleEl.textContent = featuredInfo.title
          infoOverlay.appendChild(titleEl)
        }
        if (featuredInfo.subtitle) {
          const subtitleEl = document.createElement('div')
          subtitleEl.className = 'tile-subtitle'
          subtitleEl.textContent = featuredInfo.subtitle
          infoOverlay.appendChild(subtitleEl)
        }
        if (featuredInfo.content) {
          const contentEl = document.createElement('div')
          contentEl.className = 'tile-content'
          contentEl.textContent = featuredInfo.content
          infoOverlay.appendChild(contentEl)
        }
        squareEl.appendChild(infoOverlay)
        featuredTileRef.current = squareEl
      }
      
      fragment.appendChild(squareEl)
    })

    container.appendChild(fragment)

    // Handle resize with debounce for performance
    let resizeTimeout: NodeJS.Timeout
    const handleResize = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(() => {
        // Clear existing squares
        while (container.firstChild) {
          container.removeChild(container.firstChild)
        }

        // Recalculate
        const newViewportWidth = window.innerWidth
        const newViewportHeight = window.innerHeight
        const newCols = Math.ceil(newViewportWidth / cellSize) + 2
        const newRows = Math.ceil(newViewportHeight / cellSize) + 2

      container.style.setProperty('--grid-cols', newCols.toString())
      container.style.setProperty('--grid-rows', newRows.toString())

      // Recalculate featured tile index for new grid size
      const newCenterCol = Math.floor(newCols / 2)
      const newCenterRow = Math.floor(newRows / 2)
      const newDefaultFeaturedIndex = newCenterRow * newCols + newCenterCol
      const newSelectedTileIndex = featuredTileIndex !== undefined ? featuredTileIndex : newDefaultFeaturedIndex

      // Regenerate squares
      const newTotalSquares = newCols * newRows
      const newFragment = document.createDocumentFragment()

      for (let i = 0; i < newTotalSquares; i++) {
        const rand = Math.random()
        let color: string
        if (rand < 0.6) {
          color = colors.squares[0]
        } else if (rand < 0.85) {
          color = colors.squares[1]
        } else if (rand < 0.95) {
          color = colors.squares[2]
        } else {
          color = colors.squares[3]
        }

        const baseOpacity = 0.3 + Math.random() * 0.4
        const animationDelay = Math.random() * 500
        const duration = 1000 + Math.random() * 1000

        const squareEl = document.createElement('div')
        const isFeatured = i === newSelectedTileIndex && featuredInfo
        squareEl.className = isFeatured ? 'grid-square featured-tile' : 'grid-square'
        squareEl.style.backgroundColor = color
        squareEl.style.opacity = baseOpacity.toString()
        squareEl.style.setProperty('--base-opacity', baseOpacity.toString())
        squareEl.style.setProperty('--animation-delay', `${animationDelay}ms`)
        squareEl.style.setProperty('--animation-duration', `${duration}ms`)
        
        if (isFeatured) {
          const infoOverlay = document.createElement('div')
          infoOverlay.className = 'tile-info'
          if (featuredInfo.title) {
            const titleEl = document.createElement('div')
            titleEl.className = 'tile-title'
            titleEl.textContent = featuredInfo.title
            infoOverlay.appendChild(titleEl)
          }
          if (featuredInfo.subtitle) {
            const subtitleEl = document.createElement('div')
            subtitleEl.className = 'tile-subtitle'
            subtitleEl.textContent = featuredInfo.subtitle
            infoOverlay.appendChild(subtitleEl)
          }
          if (featuredInfo.content) {
            const contentEl = document.createElement('div')
            contentEl.className = 'tile-content'
            contentEl.textContent = featuredInfo.content
            infoOverlay.appendChild(contentEl)
          }
          squareEl.appendChild(infoOverlay)
        }
        
        newFragment.appendChild(squareEl)
      }

      container.appendChild(newFragment)
      }, 150) // Debounce resize by 150ms
    }

    window.addEventListener('resize', handleResize)

    return () => {
      clearTimeout(resizeTimeout)
      window.removeEventListener('resize', handleResize)
    }
  }, [phase, featuredInfo, featuredTileIndex])
  
  // Update blur - start sharpening sooner (after 1.2s during intro)
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    
    // Always start blurry
    container.style.setProperty('--blur-amount', '12px')
    
    // Start sharpening during intro phase (after 2.5s) - wait longer
    if (phase === 'intro') {
      const timer = setTimeout(() => {
        container.style.setProperty('--blur-amount', '0px')
      }, 2500)
      return () => clearTimeout(timer)
    } else {
      // Already sharp in preload and cycling phases
      container.style.setProperty('--blur-amount', '0px')
    }
  }, [phase])

  return (
    <div className="grid-background-wrapper">
      <div ref={containerRef} className="grid-background" />
    </div>
  )
}
