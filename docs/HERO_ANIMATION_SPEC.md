# Hero Animation Specification
## Tabulas — Particle Story

**Version:** 1.0  
**Last Updated:** January 11, 2026  
**Owner:** Ward + Emma  
**Repository:** github.com/flybylow/3d-particles

---

## Executive Summary

This is not just an animation. It's a **persuasion sequence** designed to create an emotional journey: Anxiety → Relief → Delight. Every timing decision, every particle behavior, serves a psychological purpose.

**The Story:** Tabulas takes chaos and makes it legible. Then makes it *tangible*.

---

## The Three-Act Narrative

### Act 1: CHAOS (0s–4s)
**What We Show:** Particle storm with DATA FRAGMENTS — bits of product information, codes, numbers — all unreadable. A scanning loop passes over repeatedly, FAILING to read. Like a barcode scanner getting errors.

**What It Represents:** Your supply chain data — fragmented, unverified, machines can't make sense of it.

**Target Emotion:** Confusion, "what IS this?", system failure anxiety

**Visual Details:**
- Particles contain data fragments (text, numbers, codes)
- Scanning loop animation passes over chaos (failing to read)
- Warm color tints (amber/red) suggest error state
- Movement is jittery, unsettled

**Copy:** None (let the confusion speak)

**Critical Requirement:** This should feel like a machine TRYING and FAILING to read something. Not just chaos — *failed scanning*.

### Act 2: THE SCAN (4s–8s)
**What We Show:** A scanning LIGHT sweeps across. Particles respond — they align into vertical barcode lines as the light passes. The scan is WORKING.

**What It Represents:** Tabulas making data readable. The intervention.

**Target Emotion:** "It's reading...", anticipation, process in motion

**Visual Details:**
- Scan line: Blue/white light with motion blur
- Particles align INTO the light path
- Color shift begins (warm → cool)
- Blur effect trails behind the scan

**Copy:** "One scan."

**Critical Requirement:** The light is the HERO. It's the moment of intervention. The blur creates sense of motion/process — verification isn't instant, it's witnessed.

### Act 3: VERIFIED (8s–12s)
**What We Show:** Barcode holds, glows with verification. Then transforms into product (wine bottle / battery / etc). Clean. Clear. Trusted.

**What It Represents:** Data becomes tangible product. Verified and known.

**Target Emotion:** Relief, trust, satisfaction, "got it"

**Visual Details:**
- Color: Cool particles (sage green / clean white)
- Product emerges from verified barcode
- Typography fades in
- Everything feels STABLE after the motion

**Copy:** "Verify." (or "Verified.")

**Critical Requirement:** The product reveal is the REWARD. The color shift from warm chaos to cool clarity should feel like a system going from ERROR to SUCCESS.

---

## Timing Specification

```
0.0s - 4.0s   CHAOS + FAILED SCANS
              Data fragments swirling
              Scanning loop passes 2-3 times, fails to read
              Warm color palette (error state)
              Feeling: confusion, system struggling

4.0s - 5.5s   THE SCAN BEGINS
              Light enters frame
              Particles start responding, gravitating to light path
              Feeling: "something's happening"

5.5s - 7.0s   BARCODE FORMATION
              Scan light sweeps across
              Particles align into vertical lines AS light passes
              Color shift: warm → cool (blue/white light trail)
              Motion blur on the scan line
              Feeling: "it's reading..."

7.0s - 8.5s   HOLD + VERIFY ⚠️ CRITICAL
              Clean barcode holds
              Subtle glow (verification pulse)
              "One scan." appears
              Feeling: recognition, relief

8.5s - 10.5s  PRODUCT TRANSFORMATION
              Barcode particles expand outward
              Reconverge on product surface
              Product emerges (wine bottle / battery / etc)
              Feeling: revelation

10.5s - 12.0s VERIFIED STATE
              Product holds, stable
              "Verify." fades in
              Cool color palette (success state)
              Feeling: trust, satisfaction, completion
```

**Total Duration:** 12 seconds (scroll-triggered or auto-play)

---

## Psychological Rules

These are non-negotiable. They're based on behavioral psychology research.

### 1. Contrast Effect
The relief in Act 2 is proportional to the discomfort in Act 1. Don't make chaos "pretty" — make it *wrong*.

### 2. Recognition Requires Time
The hold phase (7s–9.5s) must be at least 2 seconds. The brain needs time to categorize: "That's a barcode. I know what that is." Rushing this kills the emotional arc.

### 3. Priming Before Payoff
Text appears before the product is complete. This creates anticipation and makes the reveal feel like *fulfillment* rather than coincidence.

### 4. Coalescence Should Accelerate
Particles moving toward the barcode should follow ease-in physics: slow start → fast middle → gentle settle. Like magnets. This feels *inevitable* rather than mechanical.

### 5. Sound Cue (If Possible)
A subtle click or resolve sound at the moment the barcode completes (7s mark) will enhance the "order from chaos" moment. Audio processes 20-50ms faster than visual.

---

## Visual Specification

### Color States (Emotional Journey)

| State | Particles | Meaning | Hex Suggestions |
|-------|-----------|---------|-----------------|
| Chaos | Warm (amber/red tints) | Error, confusion, unverified | `#FF6B35`, `#F4A261` |
| Scan Light | Blue/white with blur | Technology, process, reading | `#4CC9F0`, `#FFFFFF` |
| Verified | Cool (sage/white) | Trust, clarity, success | `#88927D`, `#F8F8F7` |

### The Scan Light
- Color: Blue-white (`#4CC9F0` → `#FFFFFF` gradient)
- Motion blur trail behind it
- Particles RESPOND to the light (align as it passes)
- Width: ~5-10% of viewport
- Speed: Smooth, deliberate (not rushed)

### Background
| Element | Color | Hex |
|---------|-------|-----|
| Background | Charcoal Black | `#1A1A1A` |

### Typography
- Font: Suisse Int'l
- Weight: Medium for body, Bold for "Verify."
- Color: Off-White `#F8F8F7`
- No decorative excess

### Product Models
- Wine Bottle (FOOD & BEVERAGE)
- Battery (ELECTRONICS / ENERGY)
- Future: Chocolate bar, garment, etc.
- Products should be recognizable from particle silhouette alone

---

## Technical Requirements

### Stack
- Three.js / React Three Fiber (@react-three/fiber)
- GSAP or spring physics for transitions
- TypeScript
- Next.js (existing repo structure)

### Particle System
```typescript
interface ParticleState {
  chaos: Vector3[];      // Random positions within viewport bounds
  barcode: Vector3[];    // Vertical line formation positions
  product: Vector3[];    // Surface points on chocolate bar mesh
}

// Particle count recommendations:
// Desktop: 2500-3500 particles
// Mobile: 800-1200 particles
```

### Animation States
```typescript
enum AnimationPhase {
  CHAOS = 'chaos',
  PULLING = 'pulling',
  COALESCING = 'coalescing',
  HOLDING = 'holding',
  TRANSFORMING = 'transforming',
  REVEALED = 'revealed'
}
```

### Barcode Formation
- Generate target positions as vertical lines (standard barcode pattern)
- Lines should vary in thickness (cluster more particles for thick lines)
- Total width: ~60% of viewport
- Aspect ratio: approximately 2:1 (width:height)

### Product Model
- Option A: GLB/GLTF import (preferred for realism)
- Option B: Procedural geometry (simpler, more stylized)
- Sample surface points for particle targets using mesh surface sampling

### Transitions
- Use lerp/slerp with custom easing
- Stagger particle movement (not all at once)
- Add subtle noise to prevent mechanical feeling

---

## Behavior Details

### Chaos State Behavior
```typescript
// Particles should:
- Drift with varying velocities (not uniform)
- Have occasional micro-jitter (small random impulses)
- Stay within viewport bounds (soft boundary, not hard clip)
- NOT form any recognizable patterns
- Feel like static/interference, not like a peaceful star field
```

### Coalescence Behavior
```typescript
// Particles should:
- Accelerate as they approach target (ease-in)
- Have slight overshoot and settle (spring physics)
- Arrive in waves (staggered by distance to target)
- Create a "whoosh" feeling of convergence
```

### Hold State Behavior
```typescript
// Barcode should:
- Pulse subtly (scale 1.0 → 1.02 → 1.0, 2s cycle)
- Particles may have micro-movement (alive, not frozen)
- Feel confident and stable
```

### Transformation Behavior
```typescript
// Transition should:
- Start with particles at barcode positions
- Expand outward then reconverge on product surface
- Feel like an "explosion into form"
- Product emerges from center outward
```

---

## Responsive Considerations

### Desktop (>1024px)
- Full particle count (2500-3500)
- Full animation sequence
- Product centered in viewport

### Tablet (768px–1024px)
- Reduced particles (1500-2000)
- Same timing
- Slightly smaller product scale

### Mobile (<768px)
- Minimum particles (800-1200)
- Consider vertical barcode orientation
- Typography may need repositioning
- Performance is critical — test on real devices

---

## Interaction Model

**Recommended: Scroll-triggered one-shot**

```typescript
// Trigger points (percentage of element in view):
0%   - Animation begins (chaos state)
100% - Animation complete (hold on revealed state)

// Scrubbing: Optional
// If implemented, user can scroll back to replay
// If not, animation plays through once when triggered
```

**Alternative: Auto-play on load**
- Use if hero is above the fold
- Add replay button after completion

**Not recommended: Infinite loop**
- Loops become wallpaper/background noise
- Defeats the narrative purpose

---

## Testing Checklist

- [ ] Chaos feels like FAILED SCANNING (not just random particles)
- [ ] Warm colors in chaos suggest "error state"
- [ ] Scanning loop animation visible (failing to read)
- [ ] THE SCAN light is the hero moment
- [ ] Particles respond TO the light (align as it passes)
- [ ] Motion blur on scan light creates process feeling
- [ ] Color shift from warm → cool is noticeable
- [ ] Barcode hold phase is minimum 1.5 seconds
- [ ] "One scan." appears at recognition moment
- [ ] Product transformation feels like reward
- [ ] "Verify." appears with confidence
- [ ] Works on mobile without jank
- [ ] Total runtime ~12 seconds
- [ ] Industry selector works (Wine Bottle / Battery / etc)

---

## Files to Create

```
/components/HeroAnimation/
  index.tsx           # Main component
  ParticleSystem.tsx  # Particle logic
  useAnimationState.ts # State machine hook
  constants.ts        # Colors, timing, counts
  types.ts            # TypeScript interfaces

/public/models/
  chocolate-bar.glb   # Product model (if using GLB)

/docs/
  HERO_ANIMATION_SPEC.md  # This file
```

---

## Success Criteria

The animation succeeds if a viewer:
1. Feels confused/uneasy during chaos (like watching a failed scan)
2. Notices the scan light as "the moment something changes"
3. Experiences relief when barcode forms and is readable
4. Feels satisfaction when product emerges verified
5. Remembers "One scan. Verify." afterward

**The ultimate test:** Ask someone "What do you remember?" 24 hours later. If they say "the scanning thing that turned chaos into a product" — we won.

**The emotional test:** If they describe it as "satisfying" or "like when a barcode actually scans" — we nailed it.

---

## References

- Notion spec: [Hero Animation — Particle Story](https://www.notion.so/tabulas/2e59229a2a2381a48f4defdeed1ec205)
- GitHub repo: github.com/flybylow/3d-particles
- Brand system: Tabulas Branding (Notion)

---

*"People don't change because of logic. They change because of psychological triggers."*  
— Marky Ting, Chief Behavioral Officer
