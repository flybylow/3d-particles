# Particle Animation System

This document describes the 3D particle animation system used in the homepage hero section.

## Overview

The particle animation system creates an immersive visual experience by morphing 20,000 white particles through different states:

1. **Barcode** → particles form a realistic barcode pattern
2. **Scatter** → particles explode into a 3D sphere
3. **Forming** → particles coalesce into a product shape
4. **Product Display** → fully formed product with rotation
5. **Hold** → pause before cycling to next product

## Key Technologies

- **React Three Fiber** - React renderer for Three.js
- **@react-three/drei** - Useful helpers for R3F (like `useGLTF`)
- **Three.js** - WebGL 3D library
- **Next.js 14** - React framework with App Router

## Architecture

### Components

#### 1. HomepageHero.tsx
The main container component that:
- Sets up the Canvas with camera and rendering settings
- Manages UI state (text visibility, product labels, cycle counting)
- Handles phase change callbacks from the animation
- Renders overlay text and UI elements

Key features:
- Uses `'use client'` directive for client-side rendering
- Wraps animation in `<Suspense>` for loading states
- Preloads 3D models on component mount
- Responsive design with CSS

#### 2. HeroAnimation.tsx
The core animation logic that:
- Loads and processes 3D GLB model files
- Generates barcode, scatter, and product position arrays
- Manages animation phases with precise timing
- Interpolates particle positions smoothly between states
- Applies rotation during product display phase

### Position Generation Algorithms

#### Barcode Positions
```typescript
generateBarcodePositions(pointCount: number)
```
- Creates 40 vertical bars with random widths
- Distributes particles within bar boundaries
- Adds slight Z-axis depth for realism
- Total width: 1.8 units, height: 0.9 units

#### Scatter Positions
```typescript
generateScatterPositions(pointCount: number, spread: number)
```
- Uses spherical coordinates (r, theta, phi)
- Randomizes radius with weighted distribution
- Creates natural 3D explosion effect
- Default spread: 2.5 units

#### Model Positions
```typescript
extractModelPositions(scene: Object3D, pointCount: number)
```
- Traverses GLB scene graph to find all mesh vertices
- Applies world matrix transformations
- Samples or duplicates vertices to match point count
- Falls back to cube if model fails to load

## Animation Timeline

Each product cycle lasts **6.5 seconds** total:

| Phase    | Duration | Description                          |
|----------|----------|--------------------------------------|
| Barcode  | 1.5s     | Display barcode pattern              |
| Scatter  | 1.0s     | Transition to scattered sphere       |
| Forming  | 1.2s     | Particles form product shape         |
| Product  | 0.8s     | Show formed product with rotation    |
| Hold     | 2.0s     | Hold display before next cycle       |

## Performance Optimizations

### 1. Point Count
- 20,000 particles provide good detail without performance hit
- Can be adjusted via `pointCount` prop

### 2. Staggered Animation
```typescript
const stagger = (pointIndex / pointCount) * 0.3
const localProgress = (progress - stagger) / (1 - stagger)
```
Creates wave-like motion as particles don't all move at once.

### 3. Lerp Interpolation
```typescript
positions[idx] = THREE.MathUtils.lerp(
  positions[idx],
  target[idx],
  localProgress * delta * 8
)
```
Smooth transitions with delta-time compensation.

### 4. Additive Blending
```typescript
blending={THREE.AdditiveBlending}
```
Creates glowing effect without depth sorting overhead.

### 5. Model Preloading
```typescript
preloadProducts(PRODUCTS)
```
Loads all GLB files before animation starts to prevent stuttering.

## Material Settings

```typescript
<pointsMaterial
  size={0.006}
  color="#ffffff"
  sizeAttenuation
  transparent
  opacity={0.92}
  depthWrite={false}
  blending={THREE.AdditiveBlending}
/>
```

- **Size**: 0.006 units (scales with distance)
- **Color**: Pure white (#ffffff)
- **Opacity**: 92% for subtle transparency
- **Blending**: Additive for glowing effect
- **Depth Write**: Disabled for performance

## Easing Function

Uses cubic easing for natural motion:

```typescript
function easeInOutCubic(t: number): number {
  return t < 0.5 
    ? 4 * t * t * t 
    : 1 - Math.pow(-2 * t + 2, 3) / 2
}
```

Applied to scatter and forming phases for smooth acceleration/deceleration.

## 3D Model Requirements

Place GLB files in `/public/models/` with these characteristics:
- Format: GLB (binary glTF)
- Scale: Approximately 1-2 units tall
- Origin: Centered at (0, 0, 0)
- Vertex count: 5,000-50,000 vertices recommended
- Single mesh or mesh hierarchy supported

## Configuration

### Product Array
```typescript
const PRODUCTS: Product[] = [
  {
    name: 'Chocolate',
    modelPath: '/models/chocolate-bar.glb',
    category: 'Food & Beverage'
  },
  // ... more products
]
```

### Adjustable Parameters
- `pointCount`: Number of particles (default: 20,000)
- `pointSize`: Size of each particle (default: 0.006)
- `camera.position`: Camera distance (default: [0, 0, 3.5])
- `camera.fov`: Field of view (default: 50)
- Timeline durations in `timeline` object

## UI Elements

### 1. Hero Text
- Headline: "Know your product."
- Fades in when product is fully formed
- Positioned at 25% from bottom
- Responsive typography with `clamp()`

### 2. Product Label (Top Right)
- Shows category (uppercase, smaller text)
- Shows product name (larger text)
- Fades in with slide-down animation
- Only visible during product/hold phases

### 3. Tagline (Bottom)
- "Digital Product Passports for the EU economy"
- Appears after first complete cycle
- Delayed fade-in (0.3s delay)

### 4. Scroll Indicator
- Animated vertical line
- Pulsing animation (2s loop)
- Gradient effect for subtlety

## Camera Settings

```typescript
<Canvas
  camera={{ position: [0, 0, 3.5], fov: 50 }}
  gl={{ 
    antialias: true, 
    alpha: true, 
    powerPreference: 'high-performance' 
  }}
  dpr={[1, 2]}
/>
```

- **Position**: 3.5 units from origin on Z-axis
- **FOV**: 50° for slight perspective
- **DPR**: 1-2x for Retina displays
- **Antialias**: Enabled for smooth edges
- **Power Preference**: High performance mode

## Styling Approach

- CSS Modules for component styles
- Absolute positioning for overlay elements
- CSS transitions for text fades
- Responsive breakpoint at 768px
- Dark theme (#08080c background)
- Custom scrollbar styling

## Browser Compatibility

- Modern browsers with WebGL 2.0 support
- React 18+ for concurrent features
- No IE11 support (uses ES2020+ features)

## Future Enhancements

Potential improvements:
1. Touch/drag interaction to rotate products
2. Mouse parallax effect
3. Loading progress indicator
4. Multiple particle colors per product
5. Sound effects on transitions
6. Accessibility improvements (reduced motion support)

## Troubleshooting

### Models not loading
- Check GLB files are in `/public/models/`
- Verify file paths match `modelPath` exactly
- Check browser console for 404 errors

### Performance issues
- Reduce `pointCount` (try 10,000-15,000)
- Disable `antialias` in Canvas settings
- Check GPU usage in browser DevTools

### Animation stuttering
- Ensure models are preloaded
- Check for JavaScript errors in console
- Verify delta time calculations are working

## Learning Resources

- [React Three Fiber Docs](https://docs.pmnd.rs/react-three-fiber)
- [Three.js Fundamentals](https://threejs.org/manual/)
- [WebGL Performance Tips](https://webglfundamentals.org/webgl/lessons/webgl-performance.html)

