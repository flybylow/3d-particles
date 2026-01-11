# Project Setup Guide

## Installation

1. **Install dependencies:**

```bash
npm install
```

This installs:
- `next` - Next.js framework
- `react` & `react-dom` - React libraries
- `three` - Three.js 3D engine
- `@react-three/fiber` - React renderer for Three.js
- `@react-three/drei` - Useful R3F helpers
- TypeScript and type definitions

## Development

2. **Run the development server:**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Adding 3D Models

3. **Place GLB files in the public folder:**

```
/public/models/
  ├── chocolate-bar.glb
  ├── battery.glb
  └── garment.glb
```

**Note:** The project expects these three models. You'll need to provide your own GLB files or update the `PRODUCTS` array in `components/HomepageHero.tsx` to match your available models.

## Project Structure

```
3Dparticles/
├── app/
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Homepage
│   └── globals.css         # Global styles
├── components/
│   ├── HomepageHero.tsx    # Main hero component
│   ├── HomepageHero.css    # Hero styles
│   └── HeroAnimation.tsx   # 3D animation logic
├── docs/                   # All documentation (IMPORTANT!)
│   ├── README.md           # Documentation index
│   ├── project-rules.md    # Project rules
│   ├── project-setup.md    # This file
│   └── particle-animation-system.md  # Animation details
├── public/
│   └── models/             # GLB 3D model files
├── package.json
├── tsconfig.json
├── next.config.js
└── README.md               # Project overview only
```

## Configuration

### Adjust Animation Parameters

In `components/HomepageHero.tsx`:

```typescript
<HeroAnimation
  products={PRODUCTS}
  pointCount={20000}    // Adjust particle count
  pointSize={0.006}     // Adjust particle size
  onPhaseChange={handlePhaseChange}
/>
```

### Modify Timeline

In `components/HeroAnimation.tsx`, edit the `timeline` object:

```typescript
const timeline = {
  barcode: 1.5,   // seconds
  scatter: 1.0,
  forming: 1.2,
  product: 0.8,
  hold: 2.0
}
```

### Add/Remove Products

In `components/HomepageHero.tsx`:

```typescript
const PRODUCTS: Product[] = [
  {
    name: 'Your Product',
    modelPath: '/models/your-model.glb',
    category: 'Your Category'
  },
  // Add more products...
]
```

## Building for Production

```bash
npm run build
npm start
```

The build process:
1. Compiles TypeScript
2. Optimizes React components
3. Bundles Three.js modules
4. Generates static pages where possible

## Deployment

This Next.js app can be deployed to:
- **Vercel** (recommended) - Zero configuration
- **Netlify** - Use Next.js runtime
- **Custom server** - Node.js required

### Vercel Deployment

```bash
npm install -g vercel
vercel
```

## Performance Tips

1. **Optimize 3D Models:**
   - Use tools like [gltf-pipeline](https://github.com/CesiumGS/gltf-pipeline) to compress GLB files
   - Keep vertex counts reasonable (< 50k per model)
   - Remove unnecessary animations or textures

2. **Adjust Particle Count:**
   - High-end devices: 20,000-30,000 particles
   - Mid-range devices: 10,000-15,000 particles
   - Mobile devices: 5,000-8,000 particles

3. **Enable Compression:**
   - Add gzip/brotli compression in production
   - Next.js handles this automatically on Vercel

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 15+
- Edge 90+

Requires WebGL 2.0 support.

## Common Issues

### Issue: Black screen on load
**Solution:** Check browser console for errors. Likely missing model files or incorrect paths.

### Issue: Poor performance
**Solution:** Reduce `pointCount` or disable `antialias` in Canvas settings.

### Issue: Models not appearing
**Solution:** 
1. Verify GLB files exist in `/public/models/`
2. Check file paths are correct
3. Ensure models are centered and properly scaled

## Next Steps

1. Read the [Particle Animation System](./particle-animation-system.md) documentation
2. Add your own 3D models to `/public/models/`
3. Customize colors, timing, and UI text
4. Test on multiple devices and browsers

