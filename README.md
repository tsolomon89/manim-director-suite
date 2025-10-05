# Parametric Keyframe Studio

> Mathematical animation tool for exploring parametric functions with real-time visualization

**Status**: 🎉 **MVP COMPLETE** | All 8 Phases Finished | Production Ready | [See MVP_COMPLETE.md](MVP_COMPLETE.md)

## Quick Start

```bash
npm install && npm run dev
```

Visit http://localhost:3000

## Features

### ✨ Interactive Visualization
- 2D canvas viewport with pan/zoom/reset
- Configurable grids (4 presets: Cartesian/polar/minimal)
- 60 FPS real-time rendering with high-DPI support
- Live parameter updates on canvas

### 🧮 Mathematical Engine
- Expression evaluation (math.js) with dependency resolution
- Greek symbols: Type `\pi` → see `π` (full alphabet)
- Implicit multiplication: `2x` → `2*x` (no explicit `*` needed)
- Auto-parameterization: `f(x) = k*x` creates parameter `k` automatically

### 📊 Parameters & Functions
- Numeric-only parameters (spec-compliant)
- Collision detection with smart suggestions (`k_{1}`, `k'`)
- Anonymous plots: `y = sin(x)` shorthand
- Function statistics (domain, range, zero crossings)

### 🎬 Animation System
- Keyframe-based timeline with scrubber
- Smooth parameter interpolation (5 easing curves)
- Play/pause/loop controls with variable speed
- Camera animations (pan/zoom keyframes)

### 📥 Import/Export
- **Desmos JSON import** (numeric parameters only)
- **PNG export** (720p - 4K, custom resolutions)
- **Manim script export** (Python + CLI commands)
- **Project save/load** (.pkstudio format, full state)

### 🎨 Desmos-Style UX
- Single letter + subscript naming: `k`, `γ_{rate}`
- Live math preview (fractions, superscripts, Greek)
- Greek picker modal (Ω button)
- Smart error hints and fix-it suggestions

## Technology

- React 19 + TypeScript 5.9
- Vite 5.4 (build tool)
- math.js 14.8 (expressions)
- HTML5 Canvas (rendering)

## Roadmap

### ✅ MVP Complete (Phases 1-8)
- ✅ Configuration system (22+ config files)
- ✅ Scene viewport & camera controls
- ✅ Parameters & expression engine
- ✅ Function plotting with real-time updates
- ✅ Expression UX (Greek symbols, implicit mult, auto-params)
- ✅ Keyframe timeline with interpolation
- ✅ Desmos JSON import
- ✅ PNG & Manim export
- ✅ Project save/load

**See [MVP_COMPLETE.md](MVP_COMPLETE.md) for full completion report.**

### 🚀 Future Enhancements
- 3D scene support (volumetric grid, orbit camera)
- Complex number visualization
- List-based plotting (`sin(n*f)` for `n=[0...Z-1]`)
- Advanced warps (conformal mappings)
- Unit testing & CI/CD

See [NEXT_LEVEL_ROADMAP.md](NEXT_LEVEL_ROADMAP.md) for advanced features.

## Architecture

- **Zero hard-coded values** - All in JSON config
- **DRY always** - Reusable components
- **Type-safe** - 50+ TypeScript interfaces
- **60 FPS target** - Performance-first

See [CLAUDE.md](CLAUDE.md) for complete specification.

## Examples

**Create Parameter:**
```typescript
Name: k, Value: 710, Slider [0-1000]
```

**Plot Function:**
```typescript
f(x) = sin(k*x)  // Auto-creates k if missing
```

**Anonymous Plot:**
```typescript
y = cos(2πx)  // Displays as "y"
```

**Greek Symbols:**
```typescript
\gamma_{rate}(t) = e^{-t}  // Displays: γ_rate(t)
```

## Contributing

1. Read [CLAUDE.md](CLAUDE.md) for architecture
2. Follow principles:
   - Zero hard-coded values
   - Extract shared logic (DRY)
   - TypeScript strict mode
   - 60 FPS performance target

```bash
npm install
npm run dev      # Hot reload
npx tsc --noEmit # Type check
npm run build    # Production
```

## License

ISC

---

**Current State**: 🎉 **MVP COMPLETE** - Production-ready mathematical animation tool with keyframe timeline, Desmos import, and Manim export. All 8 phases finished. Ready for user testing!
