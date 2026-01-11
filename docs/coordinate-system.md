# Coordinate System and Positioning

## Uniform Origin Approach

All product geometries in this project follow a **uniform coordinate system** where objects are generated centered at the **origin (0,0,0)**. This provides consistency and makes positioning adjustments much simpler.

## Key Principle: Separation of Concerns

**Geometry Generation** (in component files) and **Screen Positioning** (in animation logic) are kept separate:

- **Geometry Components** (`BatteryGeometry.tsx`, `WineBottleGeometry.tsx`, `ChocolateBarGeometry.tsx`) generate vertices centered at origin
- **Animation Logic** (`HeroAnimation.tsx`) applies uniform positioning offsets for screen placement

## Implementation

### Product Geometries (Centered at Origin)

All product models are generated with their center at `(0, 0, 0)`:

```typescript
// BatteryGeometry.tsx - Cylindrical batteries centered at origin
const y = (Math.random() - 0.5) * batteryHeight * 0.75
positions.push(x, y, z) // No yOffset applied here

// WineBottleGeometry.tsx - Wine bottle centered at origin
positions[i] = x2
positions[i + 1] = y1  // No yOffset applied here
positions[i + 2] = z2

// ChocolateBarGeometry.tsx - Already centered
x = (Math.random() - 0.5) * width
y = (Math.random() - 0.5) * height
```

### Screen Positioning (Single Source of Truth)

In `HeroAnimation.tsx`, we apply a **single vertical offset** to all products:

```typescript
// Single point of control for ALL product vertical positioning
const productYOffset = -0.5

// Applied during interpolation
if (j === 1 && (phase === 'transforming' || phase === 'product')) {
  targetValue += productYOffset
}

// Also applied during rotation
positions[i + 1] = target[i + 1] + productYOffset
```

## Benefits

### 1. **Easy Adjustments**
Change one value (`productYOffset`) to move ALL products up or down on screen

### 2. **Consistency**
All products positioned identically relative to screen center

### 3. **Clean Architecture**
- Geometry files only care about shape
- Animation file only cares about positioning
- No mixed concerns or scattered offsets

### 4. **Future-Proof**
Adding new products? Just generate them centered at origin and they'll automatically work with the existing positioning system

## Home Positions

Each object type has a "home position" at origin before screen positioning:

| Object | X Center | Y Center | Z Center | Notes |
|--------|----------|----------|----------|-------|
| Batteries | 0 (array centered) | 0 | 0 | 3 cylinders arranged horizontally |
| Wine Bottle | 0 | 0 | 0 | Centered at middle of bottle (not bottom), cork pointing up |
| Chocolate Bar | 0 | 0 | 0 | Horizontal bar layout |
| Barcode | 0 | 0 | 0 | Vertical bars centered |

All objects then receive the **same vertical offset** (`productYOffset = -0.5`) when displayed on screen during product phases.

### Important: Vertical Centering

For objects with significant height (like the wine bottle), the center point is calculated at the **middle of the object's bounding box**, not at its base. This ensures true vertical centering:

```typescript
// Calculate bounding box
let minY = Infinity, maxY = -Infinity
// ... collect all Y coordinates ...

// Center offset: shift so middle is at Y=0
const centerYOffset = (minY + maxY) / 2

// Apply offset to all vertices
positions[i + 1] -= centerYOffset
```

This way, when `productYOffset` is applied, the object's **visual center** aligns with the screen center, not its bottom edge.

## Lesson Learned

**Don't mix coordinate systems!** 

Initially, different objects had individual offsets scattered throughout their generation code:
- Battery: `yOffset = -0.9`
- Wine Bottle: `yOffset = -1.3`
- Each hardcoded in different files

This made it:
- Hard to position objects consistently
- Difficult to adjust vertical alignment
- Unclear where positioning logic lived

**Solution:** Generate all geometries at origin, apply positioning in one place.

## Adjusting Product Position

To move ALL products higher or lower on screen, modify **one value**:

```typescript
// In HeroAnimation.tsx
const productYOffset = -0.5  // Adjust this value
// Negative = lower on screen
// Positive = higher on screen
// 0 = perfectly centered
```

## Related Files

- `/components/BatteryGeometry.tsx` - Cylindrical battery generation
- `/components/WineBottleGeometry.tsx` - GLTF wine bottle processing
- `/components/ChocolateBarGeometry.tsx` - Procedural chocolate bar
- `/components/HeroAnimation.tsx` - Animation and positioning logic
