# Troubleshooting Guide

Common issues and their solutions.

## WebAssembly Memory Error

### Error Message
```
RangeError: WebAssembly.instantiate(): Out of memory: Cannot allocate Wasm memory for new instance
```

### Causes
This error occurs when WebGL/Three.js runs out of WebAssembly memory. Common causes:

1. **Multiple Canvas instances** - Each Canvas creates a WebGL context that consumes memory
2. **High particle counts** - Large particle systems require significant memory
3. **Multiple GLTF models loaded simultaneously** - Each model consumes memory
4. **Memory leaks** - Resources not being properly disposed
5. **High DPR (device pixel ratio)** - Increases memory usage exponentially

### Solutions

#### 1. Reduce Particle Counts
**Location:** `components/HomepageHero.tsx` and `components/ProductInfoTile.tsx`

```typescript
// Main animation - reduce from 6000 to 4000 or lower
pointCount={4000} // Instead of 6000

// Passport photo - reduce from 2000 to 1000 or lower
const passportPointCount = 1000 // Instead of 2000
```

#### 2. Limit DPR (Device Pixel Ratio)
**Location:** `components/HomepageHero.tsx`

```typescript
<Canvas
  dpr={[1, 1]} // Fixed to 1, prevents high-DPI memory usage
  // ... other props
>
```

#### 3. Disable Antialiasing
**Location:** `components/HomepageHero.tsx` and `components/ProductInfoTile.tsx`

```typescript
gl={{ 
  antialias: false, // Already disabled - keep this
  alpha: true,
  powerPreference: 'high-performance',
  preserveDrawingBuffer: false // Important: prevents memory accumulation
}}
```

#### 4. Clean Up Resources
**Location:** `components/ProductInfoTile.tsx` - PassportParticlePhoto component

Add cleanup in useEffect:

```typescript
useEffect(() => {
  // ... existing code
  
  return () => {
    // Cleanup when component unmounts
    if (pointsRef.current) {
      pointsRef.current.geometry.dispose()
      if (pointsRef.current.material) {
        pointsRef.current.material.dispose()
      }
    }
  }
}, [transformedPositions])
```

#### 5. Limit Concurrent GLTF Loading
**Location:** `components/HomepageHero.tsx`

Preload models sequentially instead of all at once:

```typescript
// Instead of preloading all at once:
// preloadWineBottle()
// preloadBattery()
// preloadTShirt()

// Load only what's needed, or add delays:
useEffect(() => {
  preloadWineBottle()
  setTimeout(() => preloadBattery(), 1000)
  setTimeout(() => preloadTShirt(), 2000)
}, [])
```

#### 6. Use Single Canvas When Possible
If passport photo and main animation can share a Canvas, it reduces memory usage significantly.

#### 7. Implement Memory Monitoring
Add this to detect memory issues early:

```typescript
// In browser console or component
if (performance.memory) {
  console.log('Memory:', {
    used: (performance.memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
    total: (performance.memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
    limit: (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB'
  })
}
```

### Recommended Settings for Low-Memory Devices

```typescript
// Main Canvas
<Canvas
  camera={{ position: [0, 0, 5.5], fov: 50 }}
  gl={{ 
    antialias: false,
    alpha: true,
    powerPreference: 'high-performance',
    preserveDrawingBuffer: false
  }}
  dpr={1} // Critical: keep at 1
>
  <HeroAnimation
    pointCount={3000} // Reduced from 6000
    pointSize={0.012}
  />
</Canvas>

// Passport Photo Canvas
<Canvas
  camera={{ position: [0, 0, 2.5], fov: 45 }}
  gl={{ 
    antialias: false,
    alpha: true,
    powerPreference: 'high-performance'
  }}
  dpr={1} // Critical: keep at 1
>
  <PassportParticlePhoto 
    productIndex={productIndex}
    // Use passportPointCount = 800 instead of 2000
  />
</Canvas>
```

### Prevention Checklist

- [ ] Keep `dpr={1}` on all Canvas instances
- [ ] Keep `antialias: false` on all Canvas instances
- [ ] Keep `preserveDrawingBuffer: false` on main Canvas
- [ ] Limit particle counts (main: 3000-4000, passport: 800-1000)
- [ ] Dispose geometries and materials in cleanup
- [ ] Load GLTF models sequentially, not simultaneously
- [ ] Monitor memory usage during development

### Additional Resources

- [Three.js Performance Tips](https://threejs.org/manual/#en/fundamentals)
- [WebGL Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices)
