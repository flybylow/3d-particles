# Tabulas Hero Animation — Complete Handoff Document

**Date:** January 11, 2026  
**Project:** 3D Particles Hero Animation  
**Repository:** https://github.com/flybylow/3d-particles  
**Status:** Ready for Claude Code implementation

---

## Executive Summary

Ward and Emma developed a three-act visual narrative for Tabulas' hero animation. The animation transforms from particle chaos → barcode → 3D product (chocolate bar), telling the complete Tabulas value story: Problem → Solution → Value.

---

## The Narrative Structure

### Act 1: CHAOS (The Problem)
- **Visual:** Particle storm filling the viewport, thousands of scattered data points
- **Metaphor:** Your supply chain today — fragmented data across 47 systems, unverified claims, opacity
- **Emotional Tone:** Overwhelming, lost, anxiety
- **Copy:** "Your supply chain is noise."

### Act 2: CLARITY (The Solution)  
- **Visual:** Particles coalesce and form into a barcode shape
- **Metaphor:** Tabulas organizes chaos. The barcode is the universal interface.
- **Emotional Tone:** Relief, recognition, "ah, I understand"
- **Copy:** "One scan."

### Act 3: REVELATION (The Value)
- **Visual:** Barcode transforms/explodes into 3D chocolate bar product
- **Metaphor:** "Know your product" — tangible outcome, not just data
- **Emotional Tone:** Delight, trust, satisfaction
- **Copy:** "Know your product."

---

## Why This Sequence Works

1. **Problem → Solution → Value** — Classic sales narrative structure
2. **Abstract → Concrete** — Ends on something tangible, not data
3. **Barcode as Bridge** — It's both chaos organized AND the key that unlocks product identity
4. **Emotional Arc** — Anxiety → Relief → Delight
5. **The Reversal** — Original concept was barcode-dissolving-into-particles. Reversed to chaos-coalescing-into-clarity. Much stronger metaphor: Tabulas MAKES SENSE of chaos, doesn't explode it.

---

## Product Selection Decision

**Chosen: Chocolate Bar**

Considered options:
- **Chocolate bar** ✓ — Universal appeal, democratic (everyone eats chocolate), strong supply chain story (cocoa sourcing), warm associations, easier to model than complex shapes
- **Wine bottle** — Premium, provenance, European feel, but more niche
- **Beer can** — Consumer-friendly but too casual
- **Garment** — Connects to textiles/MoMu win, but harder to model simply

**Decision:** Single product for hero moment. One story, committed. Dynamic industry selector can exist elsewhere on site.

---

## Technical Scope for Claude Code

### Stack
- Three.js / React Three Fiber
- GSAP or spring physics for transitions
- TypeScript
- Dark background #1A1A1A (Tabulas brand)

### Components to Build
1. **Particle System** — Thousands of points with position/velocity
2. **Three Animation States:**
   - State 1: Random chaos positions (scattered, drifting)
   - State 2: Barcode formation (vertical lines pattern)
   - State 3: 3D chocolate bar positions
3. **Smooth Transitions** — Different easing per state (slow drift → accelerating coalescence → explosive reveal)
4. **Simple 3D Chocolate Bar** — Geometric, not photorealistic. Minimal faces.
5. **Typography Overlay** — "Know your product." fades in at end
6. **Camera Work** — Potential zoom through chaos into barcode, pull back for product reveal

### Existing Codebase
Repository structure from GitHub:
```
/app            — Next.js app directory
/components     — React components (particle system lives here)
/docs           — Project documentation
/public/models  — 3D models
```
- TypeScript (76.7%), CSS (22.4%), JavaScript (0.9%)
- Already has particle system foundation — needs reversal of animation direction

### What Needs to Change
- **Reverse interpolation:** Instead of `barcodePosition → randomPosition`, change to `randomPosition → barcodePosition`
- **Add third state:** Product 3D model positions
- **Easing adjustments:** Start slow (particles drifting), accelerate as they find "home" positions

---

## Brand Alignment

All visual decisions follow Emma's brand system:

- **Background:** Charcoal Black #1A1A1A
- **Particles:** Off-White #F8F8F7 or subtle gradient to Sage #88927D
- **Typography:** Suisse Int'l for "Know your product."
- **Aesthetic:** Minimal, premium, confident — no decorative excess
- **Anti-patterns avoided:** No green eco-clichés, no stock imagery, no multiple accent colors

---

## Visual References

### Inspiration
- Dot grid patterns documented in Tabulas Branding Notion page
- Andrew Walsh sophisticated digital minimalism
- Linear.app hero animations (confident, technical, clean)
- Stripe particle systems (premium tech aesthetic)

### Figma/Notion Links
- Figma slides: https://www.notion.so/2cd9229a2a23812a97a0c2281453f25a
- Brand documentation updated with dot grid pattern references

---

## Animation Timing (Proposed)

```
0s-3s    — CHAOS: Particle storm, gentle drift, slight rotation
3s-5s    — PULL: Particles begin gravitating to center, velocity increases
5s-7s    — COALESCENCE: Barcode shape emerges, final particles snap into place
7s-8s    — HOLD: Clean barcode, breathing room
8s-10s   — TRANSFORMATION: Barcode explodes/morphs into chocolate bar
10s-12s  — REVEAL: Product holds, "Know your product." fades in
```

Total: ~12 seconds for full loop, or interactive/scroll-triggered

---

## Open Questions for Implementation

1. **Loop or one-shot?** Does animation repeat, or triggered by scroll/interaction?
2. **Particle count?** Balance between visual density and performance (1000-5000 typical)
3. **3D model source?** Build geometric chocolate bar in code, or import simple GLB?
4. **Mobile handling?** Reduced particle count? Different animation?
5. **Integration point?** Standalone hero component, or tied to existing site structure?

---

## Next Steps

1. ✅ Narrative and story locked
2. ✅ Product selection made (chocolate bar)
3. ✅ Technical scope defined
4. 🔲 Review existing GitHub codebase in detail
5. 🔲 Build/modify Three.js particle system
6. 🔲 Add barcode formation state
7. 🔲 Add product transformation state
8. 🔲 Implement transitions and easing
9. 🔲 Add typography overlay
10. 🔲 Polish and iterate

---

## Key Quotes from Session

**On the reversal:**
> "The story becomes: 'All this complexity, all this data floating around your supply chain — and we bring it into focus. One scan. One truth.'"

**On the narrative:**
> "It's the difference between entropy and order. You're showing Tabulas as the thing that *makes sense* of the chaos, not the thing that explodes it."

**On product choice:**
> "For the HERO moment, pick ONE. Chocolate. Commit. You can show the system handles multiple industries elsewhere."

---

## Files to Reference

- `/mnt/project/` — Emma's brand system (colors.md, typography.md, design-philosophy.md)
- GitHub repo — Existing particle system code
- Notion — Figma slides and visual references

---

*Document created for seamless handoff to next Emma session.*
