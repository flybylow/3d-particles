# Quick Start

## Installation

```bash
cd /Users/warddem/dev/3Dparticles
npm install
```

## Add 3D Models

Place GLB files in `public/models/`:
- `chocolate-bar.glb`
- `battery.glb`
- `garment.glb`

Or update `PRODUCTS` array in `components/HomepageHero.tsx` to match your models.

## Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## What You'll See

A full-screen 3D particle animation that:
1. Starts as a barcode pattern (20,000 white particles)
2. Explodes into a 3D sphere
3. Reforms into a product shape
4. Rotates slowly while displaying product info
5. Cycles through all products automatically

## Documentation

All documentation is in the `/docs` folder:

- **[Project Rules](./project-rules.md)** - Read this first!
- **[Project Setup](./project-setup.md)** - Detailed setup guide
- **[Particle Animation System](./particle-animation-system.md)** - How it works
- **[Learnings](./learnings.md)** - Technical insights

## Key Files

- `app/page.tsx` - Main page
- `components/HomepageHero.tsx` - Hero container & UI
- `components/HeroAnimation.tsx` - 3D animation logic
- `components/HomepageHero.css` - Styling

## Customize

### Change particle count:
In `components/HomepageHero.tsx`:
```typescript
pointCount={20000}  // Try 10000 for better performance
```

### Adjust animation speed:
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

### Change text:
In `components/HomepageHero.tsx`:
```typescript
<h1>Know your product.</h1>
<p>Digital Product Passports for the EU economy</p>
```

## Technologies

- **Next.js 14** - React framework
- **React Three Fiber** - React renderer for Three.js
- **Three.js** - WebGL 3D library
- **TypeScript** - Type safety

## Need Help?

Check the comprehensive documentation in the `/docs` folder!

