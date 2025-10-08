# Parametric Keyframe Studio

> Mathematical animation tool for exploring parametric functions with real-time visualization

**Status**: 🎉 **v2.0.0** | MVP + Fractals + Complex Numbers | Production Ready | [See Changelog](/public/docs/changelog/)

## Quick Start

### Basic Usage (Frontend Only)
```bash
npm install && npm run dev
```

Visit http://localhost:5000

### With Manim Video Export (Recommended)
**One command to start both frontend + backend:**
```bash
npm install && npm run dev:full
```

Or start separately:
```bash
# Terminal 1 (Frontend)
npm run dev

# Terminal 2 (Backend - requires Manim installed)
npm run server
```

> **Note**: Backend requires [Manim Community](https://docs.manim.community/) installed: `pip install manim`

## Features

### ✨ Interactive Visualization
- 2D canvas viewport with pan/zoom/reset
- Configurable grids (4 presets: Cartesian/polar/minimal)
- 60 FPS real-time rendering with high-DPI support
- Live parameter updates on canvas

### 🧮 Mathematical Engine
- Expression evaluation (math.js) with dependency resolution
- **Complex number arithmetic** (rectangular & polar forms)
- **Advanced operators**: ∫ integrals, derivatives, √ roots, list operations
- Greek symbols: Type `\pi` → see `π` (full alphabet)
- Implicit multiplication: `2x` → `2*x` (no explicit `*` needed)
- Auto-parameterization: `f(x) = k*x` creates parameter `k` automatically

### 📊 Parameters & Functions
- Numeric & complex parameters (spec-compliant)
- Collision detection with smart suggestions (`k_{1}`, `k'`)
- Anonymous plots: `y = sin(x)` shorthand
- Function statistics (domain, range, zero crossings)
- **Implicit functions**: Circle `x^2 + y^2 = r^2`, contour plotting

### 🌀 Unified Operator System (NEW in v2.0)
- **DRY Architecture**: Capability-based operator system (no duplicate code)
- **Dynamic UI**: Controls auto-generated from operator capabilities
- **Newton fractals**: Visualize root-finding for polynomials (z³-1, z⁵-1, custom)
- **Mandelbrot set**: Classic escape-time fractal with smooth coloring (3+ presets)
- **Julia sets**: Complex dynamics with configurable parameters (4+ presets)
- **WebGL rendering**: GPU-accelerated for real-time 60 FPS interaction
- **Extensible**: Add new operators without touching core code
- 5 color modes: single, gradient, root-based, iteration-based, domain-coloring
- Full Manim export support for all operators

### 🎬 Animation System
- Keyframe-based timeline with scrubber
- Smooth parameter interpolation (5 easing curves)
- Play/pause/loop controls with variable speed
- Camera animations (pan/zoom keyframes)

### 📥 Import/Export
- **Desmos JSON import** (numeric parameters only)
- **PNG export** (720p - 4K, custom resolutions)
- **Manim video rendering** ⭐ NEW: 1-click MP4 export (no manual CLI!)
  - Backend service renders videos automatically
  - Real-time progress tracking
  - Fallback to Python script download
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
- HTML5 Canvas + WebGL (rendering)
- GLSL shaders (GPU fractal computation)

## Roadmap

### ✅ v1.0.0 - MVP Complete (Phases 1-8)
- ✅ Configuration system (22+ config files)
- ✅ Scene viewport & camera controls
- ✅ Parameters & expression engine
- ✅ Function plotting with real-time updates
- ✅ Expression UX (Greek symbols, implicit mult, auto-params)
- ✅ Keyframe timeline with interpolation
- ✅ Desmos JSON import
- ✅ PNG & Manim export
- ✅ Project save/load

### ✅ v2.0.0 - Fractals & Complex Numbers (NEW)
- ✅ Complex number system (Complex class, polynomial solver)
- ✅ Operator registry (20+ operators: ∫, d/dx, √, join, repeat)
- ✅ Newton fractal renderer (WebGL + GLSL shaders)
- ✅ Mandelbrot & Julia set support
- ✅ Fractal presets (5 built-in configurations)
- ✅ Implicit function plotting (F20)
- ✅ Auto-documentation system (generates from TypeScript source)
- ✅ Manim fractal export (Python script generation)

### 🚀 Future Enhancements (v3.0+)
- 3D scene support (volumetric grid, orbit camera)
- Multi-value function handling (P7)
- Advanced coloring gradients (P12)
- Animation playlists & scene sequencing
- Collaborative editing & cloud sync

See `/public/docs/changelog/roadmap.md` for full roadmap.

## Documentation

📖 **Full documentation available in-app**: Click the "Docs" button or visit `/docs` route

- **User Guide**: Getting started, parameters, functions, timeline, export
- **Reference**: Expression syntax, keyboard shortcuts, config system, **operators**, **fractal presets**, **complex numbers**
- **Developer**: Architecture, testing, contributing, API reference
- **Changelog**: Version history and roadmap

### Auto-Generated Documentation

The project includes an automatic documentation system that generates reference docs from TypeScript source:

```bash
npm run docs:generate      # Generate docs from source
npm run docs:watch         # Watch for changes and auto-regenerate
```

Generated docs (always up-to-date with code):
- `operators.md` - All 20+ mathematical operators
- `fractal-presets.md` - 5 built-in fractal configurations
- `complex-numbers.md` - Complex arithmetic and polynomial operations

See [AGENTS.md](AGENTS.md) for AI agent instructions and [CLAUDE.md](CLAUDE.md) for development guidelines.

## Examples

### Basic Usage

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

### Advanced Features (v2.0)

**Complex Numbers:**
```typescript
z = 3 + 4i          // Complex parameter
f(z) = z^2 - 1      // Complex function
```

**Operators:**
```typescript
\int_{0}^{1} x^2 dx           // Definite integral
\frac{d}{dx} sin(x)           // Derivative
\sqrt[3]{27}                  // Cube root
```

**Fractals:**
```typescript
// Newton fractal for z³ - 1
Preset: newton-cubic
Roots: 3 (colored basins of attraction)

// Mandelbrot set
Type: mandelbrot
Max iterations: 100
Color mode: iteration-based
```

**Implicit Functions:**
```typescript
x^2 + y^2 = r^2      // Circle
x^2/a^2 + y^2/b^2 = 1  // Ellipse
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
npm run dev          # Hot reload dev server
npx tsc --noEmit     # Type check
npm run build        # Production build
npm run docs:generate # Generate documentation
npm run docs:watch   # Watch & auto-generate docs
```

## License

ISC

---

**Current State**: 🎉 **v2.0.0 COMPLETE** - Production-ready mathematical animation tool with fractal rendering, complex numbers, advanced operators, keyframe timeline, Desmos import, and Manim export. Features 20+ operators, 5 fractal presets, WebGL GPU rendering, and auto-documentation system. Ready for advanced mathematical visualization!
