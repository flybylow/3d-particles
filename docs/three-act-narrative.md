# Three-Act Narrative Implementation

**Date:** January 11, 2026  
**Status:** ✅ Complete and tested  
**Live Demo:** http://localhost:3000

---

## Overview

The Tabulas hero animation tells a complete visual story in three acts: **Problem → Solution → Value**. This document details the implementation of the chaos-to-clarity-to-revelation narrative structure.

---

## The Three Acts

### Act 1: CHAOS (The Problem)
**Duration:** 0-3 seconds

**Visual State:**
- 20,000 particles scattered in a 3D spherical formation
- Gentle drift animation with subtle rotation
- Particles fill the entire viewport creating a sense of overwhelming data

**Metaphor:** Your fragmented supply chain—data scattered across 47 systems, unverified claims, complete opacity

**Text Overlay:** "Your supply chain is noise."

**Emotional Tone:** Overwhelming, lost, anxiety

**Technical Implementation:**
```typescript
case 'chaos':
  target = positionSets.scatter
  progress = Math.min(elapsed / 1.0, 1)
  if (pointsRef.current) {
    pointsRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.05
  }
```

---

### Act 2: CLARITY (The Solution)
**Duration:** 3-7 seconds (2s coalescence + 2s hold)

**Visual State:**
- Particles accelerate toward center
- Form into vertical barcode lines
- Clean, organized pattern with proper barcode spacing
- 40 bars with randomized widths for realism

**Metaphor:** Tabulas organizes chaos—the barcode as the universal interface that brings order

**Text Overlay:** "One scan."

**Emotional Tone:** Relief, recognition, "ah, I understand"

**Technical Implementation:**
```typescript
case 'coalescing':
  target = positionSets.barcode
  const t = Math.min(elapsed / timeline.coalescing, 1)
  progress = t * t * t // Cubic easing for acceleration

case 'barcode':
  target = positionSets.barcode
  progress = 1 // Hold steady
```

---

### Act 3: REVELATION (The Value)
**Duration:** 7-12 seconds (2s transform + 3s reveal)

**Visual State:**
- Barcode explodes/morphs into 3D chocolate bar
- Rectangular shape with segmented sections (6×2 grid)
- Gentle rotation to showcase 3D form
- Product label and tagline fade in

**Metaphor:** "Know your product"—tangible outcome, not just data

**Text Overlay:** "Know your product."

**Emotional Tone:** Delight, trust, satisfaction

**Technical Implementation:**
```typescript
case 'transforming':
  target = positionSets.products[currentProductIndex]
  progress = easeInOutCubic(Math.min(elapsed / timeline.transforming, 1))

case 'product':
  target = positionSets.products[currentProductIndex]
  progress = 1
  shouldRotate = true
  pointsRef.current.rotation.y += delta * 0.15
```

---

## Why This Sequence Works

1. **Classic Sales Narrative:** Problem → Solution → Value
2. **Abstract to Concrete:** Ends on something tangible (chocolate bar), not abstract data
3. **Barcode as Bridge:** Both chaos organized AND the key that unlocks product identity
4. **Emotional Arc:** Anxiety → Relief → Delight
5. **The Reversal:** Original concept was barcode dissolving into particles. Reversed to show Tabulas **MAKES SENSE** of chaos, doesn't explode it

---

## Technical Architecture

### Component Structure

```
/components
  ├── HeroAnimation.tsx        - Core particle system and animation states
  ├── HomepageHero.tsx         - UI wrapper with text overlays
  ├── ChocolateBarGeometry.tsx - Geometric chocolate bar generation
  └── HomepageHero.css         - Styling and animations
```

### Key Technologies

- **Three.js / React Three Fiber** - 3D rendering and particle system
- **TypeScript** - Type-safe animation logic
- **Next.js** - Server-side rendering and optimization
- **Custom easing functions** - Different motion characteristics per phase

### Animation Timing Configuration

```typescript
const timeline = {
  chaos: 3.0,          // ACT 1: Particle storm
  coalescing: 2.0,     // Particles gravitate together
  barcode: 2.0,        // ACT 2: Barcode formation complete
  transforming: 2.0,   // Barcode transforms to product
  product: 3.0         // ACT 3: Product reveal
}
// Total loop: 12 seconds
```

### Phase State Machine

```
chaos → coalescing → barcode → transforming → product → [loop back to chaos]
```

Each phase transition is managed by:
1. Elapsed time tracking
2. Target position interpolation
3. Custom easing per phase
4. Callback to update UI text

---

## Brand Alignment

All visual decisions follow the Tabulas brand system:

- **Background:** Charcoal Black `#1A1A1A`
- **Particles:** Off-White `#F8F8F7`
- **Typography:** Clean, minimal
- **Aesthetic:** Premium, confident, technical

**Anti-patterns avoided:**
- ❌ Green eco-clichés
- ❌ Stock imagery
- ❌ Decorative excess
- ❌ Multiple accent colors

---

## Product Selection: Chocolate Bar

**Why chocolate?**
- ✅ Universal appeal (everyone eats chocolate)
- ✅ Democratic, not elitist
- ✅ Strong supply chain story (cocoa sourcing, ethical trade)
- ✅ Warm, positive associations
- ✅ Simple geometric form for particle representation

**Rejected alternatives:**
- Wine bottle (too premium/niche)
- Beer can (too casual)
- Garment (harder to model clearly)

**Design decision:** Single product for hero moment. One clear story. Industry diversity can be shown elsewhere on the site.

---

## Geometric Chocolate Bar

Rather than loading external 3D models, the chocolate bar is **procedurally generated** for performance and flexibility.

### Generation Strategy

```typescript
// Surface distribution: 70% of particles
// - Front/back faces with groove details
// - Top/bottom faces
// - Left/right sides

// Interior distribution: 30% of particles
// - Random points inside volume for solidity

// Segment grooves:
// - 6 columns × 2 rows
// - 0.015 depth grooves for realism
```

### Benefits

- ✅ No external dependencies (no GLB files)
- ✅ Consistent particle count
- ✅ Customizable dimensions
- ✅ Faster loading
- ✅ Easy to modify

---

## Performance Considerations

### Particle Count
- **Default:** 20,000 particles
- **Mobile:** Could reduce to 8,000-10,000 if needed
- **High-end:** Could increase to 30,000+

### Optimization Techniques
1. `sizeAttenuation` for proper depth perception
2. `AdditiveBlending` for glow effect without overdraw cost
3. `depthWrite: false` to prevent z-fighting
4. Efficient interpolation with staggered timing
5. Single geometry buffer for all particles

---

## Testing Results

✅ **Act 1 verified:** Chaos phase with scattered particles and correct text  
✅ **Act 2 verified:** Barcode formation with "One scan." text  
✅ **Act 3 verified:** Chocolate bar reveal with "Know your product."  
✅ **Brand colors:** #1A1A1A background, #F8F8F7 particles  
✅ **Smooth transitions:** All phases flow naturally  
✅ **Performance:** Smooth 60fps on modern hardware  
✅ **Loop:** Successfully cycles back to chaos  

---

## Future Enhancements (Optional)

### Possible Additions
- [ ] Scroll-triggered animation (instead of auto-loop)
- [ ] Mobile-specific particle count adjustment
- [ ] Multiple product models (toggle in admin)
- [ ] Sound design (subtle whooshes on transitions)
- [ ] Analytics tracking (which phase has longest engagement)
- [ ] Pause/play controls
- [ ] Accessibility: reduce-motion support

### Not Recommended
- ❌ Multiple products cycling (dilutes hero message)
- ❌ User interaction mid-animation (breaks narrative flow)
- ❌ Photorealistic textures (conflicts with particle aesthetic)

---

## Key Quotes from Planning Session

> "The story becomes: 'All this complexity, all this data floating around your supply chain — and we bring it into focus. One scan. One truth.'"

> "It's the difference between entropy and order. You're showing Tabulas as the thing that *makes sense* of the chaos, not the thing that explodes it."

> "For the HERO moment, pick ONE. Chocolate. Commit. You can show the system handles multiple industries elsewhere."

---

## Files Modified

**New Files:**
- `components/ChocolateBarGeometry.tsx` - Geometric chocolate bar generation

**Modified Files:**
- `components/HeroAnimation.tsx` - Reversed animation sequence, updated phases
- `components/HomepageHero.tsx` - Three-act text overlays, single product focus

---

## Git Commit

```bash
commit 1758191
"Implement three-act narrative: chaos → barcode → chocolate bar"

- Reversed animation sequence per handoff document
- Act 1 (CHAOS): Scattered particles with 'Your supply chain is noise'
- Act 2 (CLARITY): Particles coalesce into barcode with 'One scan'
- Act 3 (REVELATION): Chocolate bar reveal with 'Know your product'
- Updated brand colors (#1A1A1A bg, #F8F8F7 particles)
- Created geometric chocolate bar (removed GLB dependency)
- Updated timing: 3s chaos, 2s coalesce, 2s barcode, 2s transform, 3s product
- Focus on single chocolate bar product
```

---

## Summary

The three-act narrative successfully transforms the original barcode-to-chaos concept into a **chaos-to-clarity-to-revelation** story that better communicates Tabulas' value proposition. The implementation is complete, tested, committed, and ready for production.

**Narrative arc:** Problem (overwhelming data) → Solution (barcode organization) → Value (product knowledge)

**Emotional journey:** Anxiety → Relief → Delight

**Technical execution:** Smooth, performant, brand-aligned ✅
