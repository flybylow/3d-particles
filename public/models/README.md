# 3D Models

This directory contains 3D model files for the particle animation system.

## Available Models

### 🍫 Chocolate Bar (Default - Procedural)
**File:** Generated procedurally in code  
**Component:** `components/ChocolateBarGeometry.tsx`  
**Vertices:** 20,000 (configurable)  
**Benefits:** No file loading, perfect particle distribution, fast performance

### 🍷 Wine Bottle (GLTF Model)
**Files:** `wine-bottle.gltf` + `wine-bottle.bin`  
**Component:** `components/WineBottleGeometry.tsx`  
**Vertices:** 2,125 (sampled to match particle count)  
**Dimensions:** ~7.6 units wide × 29.6 units tall  
**Source:** Professional 3D model

## Switching Products

To use the wine bottle instead of chocolate:

1. **Update product configuration** in `components/HomepageHero.tsx`:
```typescript
const PRODUCTS: Product[] = [
  {
    name: 'Wine Bottle',
    modelPath: '/models/wine-bottle.gltf',
    category: 'Food & Beverage'
  }
]
```

2. **Import wine bottle component** in `components/HeroAnimation.tsx`:
```typescript
import { extractWineBottlePositions, preloadWineBottle } from './WineBottleGeometry'
```

3. **Use extracted positions** instead of procedural geometry:
```typescript
const chocolateBar = useMemo(() => extractWineBottlePositions(pointCount), [pointCount])
```

4. **Preload the model** at app startup for better performance

## Future Usage

If external models are needed in the future:

### Where to Find 3D Models
- [Sketchfab](https://sketchfab.com) - Large collection of free/paid models
- [Poly Haven](https://polyhaven.com) - Free 3D assets
- [TurboSquid](https://www.turbosquid.com) - Professional models
- Create your own in Blender and export as GLB

### Model Requirements
- **Format:** GLB (binary glTF)
- **Scale:** Approximately 1-2 units tall
- **Origin:** Centered at (0, 0, 0)
- **Vertex count:** 5,000-50,000 vertices recommended
- **Optimization:** Low poly count for web performance

### Integration
The particle system can sample vertices from models to create point cloud representations. Update the `PRODUCTS` array in `components/HomepageHero.tsx` and modify `HeroAnimation.tsx` to load external models if needed.
