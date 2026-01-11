import * as THREE from 'three'
import { useMemo } from 'react'

// Generate procedural battery positions with realistic details
// Batteries are centered at origin (0,0,0) for uniform positioning
export function generateBatteryPositions(pointCount: number): Float32Array {
  const positions: number[] = []
  
  // Battery dimensions (standing upright, cylindrical) - SCALED UP TO FILL SCREEN
  const batteryCount = 3
  const batteryRadius = 0.35  // Radius for cylindrical batteries (3x larger)
  const batteryHeight = 2.4   // Height (3x larger)
  const spacing = 0.25        // Spacing between batteries (3x larger)
  const totalWidth = (batteryRadius * 2 * batteryCount) + (spacing * (batteryCount - 1))
  
  // Points distribution
  const pointsPerBattery = Math.floor(pointCount / batteryCount)
  
  for (let b = 0; b < batteryCount; b++) {
    const xOffset = -totalWidth / 2 + (b * (batteryRadius * 2 + spacing)) + batteryRadius
    
    // Main cylindrical body (65% of points)
    const bodyPoints = Math.floor(pointsPerBattery * 0.65)
    for (let i = 0; i < bodyPoints; i++) {
      // Cylindrical distribution
      const angle = Math.random() * Math.PI * 2
      const r = Math.sqrt(Math.random()) * batteryRadius // Uniform distribution in circle
      const x = xOffset + Math.cos(angle) * r
      const z = Math.sin(angle) * r
      const y = (Math.random() - 0.5) * batteryHeight * 0.75 // Main body
      
      // Add vertical ridges for texture
      const ridgePattern = Math.abs(Math.sin(angle * 12)) < 0.2
      if (ridgePattern || Math.random() > 0.2) {
        positions.push(x, y, z)
      }
    }
    
    // Positive terminal (top - 20% of points) - Make it SOLID
    const terminalPoints = Math.floor(pointsPerBattery * 0.20)
    for (let i = 0; i < terminalPoints; i++) {
      const terminalRadius = batteryRadius * 0.35
      const angle = Math.random() * Math.PI * 2
      const r = Math.sqrt(Math.random()) * terminalRadius // Uniform circle distribution
      const x = xOffset + Math.cos(angle) * r
      const z = Math.sin(angle) * r
      const y = batteryHeight * 0.42 + Math.random() * 0.08 // Top terminal area
      positions.push(x, y, z)
    }
    
    // Negative terminal (bottom - 10% of points)
    const bottomPoints = Math.floor(pointsPerBattery * 0.10)
    for (let i = 0; i < bottomPoints; i++) {
      const angle = Math.random() * Math.PI * 2
      const r = Math.sqrt(Math.random()) * batteryRadius * 0.9
      const x = xOffset + Math.cos(angle) * r
      const z = Math.sin(angle) * r
      const y = -batteryHeight * 0.42 + Math.random() * 0.03
      positions.push(x, y, z)
    }
    
    // Label band (5% of points) - on the surface
    const labelPoints = Math.floor(pointsPerBattery * 0.05)
    for (let i = 0; i < labelPoints; i++) {
      const angle = Math.random() * Math.PI * 2
      const x = xOffset + Math.cos(angle) * batteryRadius * 1.01 // Slightly outside surface
      const z = Math.sin(angle) * batteryRadius * 1.01
      const y = (Math.random() - 0.5) * 0.2 // Band in middle
      positions.push(x, y, z)
    }
  }
  
  // Fill remaining points
  while (positions.length < pointCount * 3) {
    const b = Math.floor(Math.random() * batteryCount)
    const xOffset = -totalWidth / 2 + (b * (batteryRadius * 2 + spacing)) + batteryRadius
    const angle = Math.random() * Math.PI * 2
    const r = Math.sqrt(Math.random()) * batteryRadius
    const x = xOffset + Math.cos(angle) * r
    const z = Math.sin(angle) * r
    const y = (Math.random() - 0.5) * batteryHeight * 0.75
    positions.push(x, y, z)
  }
  
  return new Float32Array(positions.slice(0, pointCount * 3))
}

export function useBatteryPositions(pointCount: number) {
  return useMemo(() => generateBatteryPositions(pointCount), [pointCount])
}

export function preloadBattery() {
  // No preloading needed for procedural geometry
}
