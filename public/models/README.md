# 3D Models

This directory is reserved for 3D model files (.glb, .gltf) if needed in the future.

## Current Implementation

The animation currently uses **procedurally generated geometry** instead of external model files:
- See `components/ChocolateBarGeometry.tsx` for the chocolate bar implementation
- Benefits: Better performance, no file loading, flexible customization, consistent particle distribution

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
