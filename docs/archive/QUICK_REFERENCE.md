# 🚀 Fractal System Quick Reference

## Quick Start (5 Minutes)

```typescript
// 1. Import
import { FractalManager, FractalRenderer } from './src/...';

// 2. Create
const manager = new FractalManager();
const { fractal } = manager.createFromPreset('newton-cubic');

// 3. Render
const renderer = new FractalRenderer({
  canvas: myCanvas,
  fractalFunction: fractal,
  viewportBounds: { xMin: -2, xMax: 2, yMin: -2, yMax: 2 },
});
renderer.render();
```

---

## Fractal Presets

| Preset ID | Description | Roots | Colors |
|-----------|-------------|-------|--------|
| `newton-cubic` | z³ - 1 = 0 | 3 | Red, Green, Blue |
| `newton-quintic` | z⁵ - 1 = 0 | 5 | Viridis palette |
| `mandelbrot-classic` | Classic Mandelbrot | N/A | Blue gradient |
| `julia-standard` | c = -0.7 + 0.27i | N/A | Purple gradient |
| `burning-ship` | Burning ship fractal | N/A | Fire gradient |

---

## Create Custom Fractals

### Newton (from roots)
```typescript
manager.createNewtonFromRoots([
  { real: 1, imag: 0 },
  { real: -1, imag: 0 },
], ['#FF0000', '#0000FF']);
```

### Newton (from coefficients)
```typescript
manager.createNewtonFromCoefficients([
  { real: -1, imag: 0 },  // constant
  { real: 0, imag: 0 },   // z
  { real: 1, imag: 0 },   // z²
]);
```

### Mandelbrot
```typescript
manager.createMandelbrot({
  power: 2,
  colorMap: {
    maxIterations: 256,
    colorScale: ['#000033', '#0000BB', '#FFFFFF'],
    insideColor: '#000000',
    smoothing: 'log',
  },
});
```

### Julia Set
```typescript
manager.createJulia(
  { real: -0.7, imag: 0.27 },
  { maxIterations: 256 }
);
```

---

## Complex Numbers

```typescript
// Create
const z = new Complex(3, 4);                  // 3 + 4i
const w = Complex.fromString("2-i");          // 2 - i
const polar = Complex.fromPolar(2, Math.PI/4); // 2∠45°

// Arithmetic
z.add(w)           // Addition
z.subtract(w)      // Subtraction
z.multiply(w)      // Multiplication
z.divide(w)        // Division
z.power(2)         // z²
z.conjugate()      // Complex conjugate

// Properties
z.magnitude()      // |z| = 5
z.angle()          // arg(z) = 0.927 rad
z.toString()       // "3+4i"
z.toPolar()        // { magnitude: 5, angle: 0.927 }

// Functions
z.exp()            // e^z
z.sqrt()           // √z
z.sin()            // sin(z)
z.cos()            // cos(z)
z.log()            // log(z)
```

---

## Operators

### Calculus
```typescript
// Integral: ∫₀¹ x² dx
operatorRegistry.fromLatex("\\int_{0}^{1} x^2 dx")
// → "integrate(x^2, 0, 1, x)"

// Derivative: d/dx sin(x)
operatorRegistry.fromLatex("\\frac{d}{dx} \\sin(x)")
// → "derivative(sin(x), x)"

// Sum: ∑ₙ₌₁¹⁰ n²
operatorRegistry.fromLatex("\\sum_{n=1}^{10} n^2")
// → "sum(n^2, 1, 10, n)"
```

### Complex
```typescript
operatorRegistry.fromLatex("\\overline{z}")        // conj(z)
operatorRegistry.fromLatex("\\operatorname{Re}(z)") // Re(z)
operatorRegistry.fromLatex("\\operatorname{Im}(z)") // Im(z)
operatorRegistry.fromLatex("\\operatorname{arg}(z)") // arg(z)
operatorRegistry.fromLatex("\\left|z\\right|")      // abs(z)
```

### List
```typescript
join([1,2], [3,4])      // [1,2,3,4]
repeat([1,2], 3)        // [1,2,1,2,1,2]
length([1,2,3])         // 3
```

### Nth Root
```typescript
operatorRegistry.fromLatex("\\sqrt[3]{27}")  // nthroot(27, 3) → 3
operatorRegistry.fromLatex("\\sqrt{16}")     // sqrt(16) → 4
```

---

## Color Modes

### Single
```typescript
style: {
  colorMode: 'single',
  color: '#3B82F6',
}
```

### Root-based (Newton)
```typescript
style: {
  colorMode: 'root-based',
  rootColors: {
    rootColors: ['#FF0000', '#00FF00', '#0000FF'],
    divergentColor: '#202020',
  },
}
```

### Iteration-based (Mandelbrot/Julia)
```typescript
style: {
  colorMode: 'iteration-based',
  iterationColors: {
    maxIterations: 256,
    colorScale: ['#000033', '#0000BB', '#FFFFFF'],
    insideColor: '#000000',
    smoothing: 'log',
  },
}
```

---

## Export to Manim

```typescript
import { ManimFractalExporter } from './export/ManimFractalExporter';

const script = ManimFractalExporter.generateFractalScript(
  fractal,
  {
    resolution: '1080p',
    fps: 60,
    quality: 'high',
    backgroundColor: '#000000',
  }
);

// Write to file
fs.writeFileSync('fractal.py', script);

// Get render command
const cmd = ManimFractalExporter.getCliCommand(
  'fractal.py',
  'NewtonScene',
  options
);
console.log(cmd);
// → manim -qh -r 1920,1080 --fps 60 "fractal.py" NewtonScene
```

---

## Render Config

```typescript
renderConfig: {
  maxIterations: 100,        // Iteration limit
  escapeRadius: 2.0,         // Escape threshold (Mandelbrot/Julia)
  tolerance: 1e-6,           // Convergence tolerance (Newton)
  useGPU: true,              // WebGL acceleration
  resolutionMultiplier: 1,   // Resolution scale (0.5 = half, 2 = double)
  superSampling: 1,          // Anti-aliasing (1, 2, or 4)
  progressive: true,         // Show draft then refine
}
```

---

## Viewport Bounds

```typescript
// Mandelbrot set
viewportBounds: { xMin: -2.5, xMax: 1, yMin: -1, yMax: 1 }

// Newton fractals
viewportBounds: { xMin: -2, xMax: 2, yMin: -2, yMax: 2 }

// Julia sets
viewportBounds: { xMin: -2, xMax: 2, yMin: -2, yMax: 2 }

// Deep zoom example
viewportBounds: { xMin: -0.5, xMax: -0.4, yMin: 0.55, yMax: 0.65 }
```

---

## Popular Julia Parameters

```typescript
// Dendrite
{ real: -0.7, imag: 0.27 }

// Spiral
{ real: -0.8, imag: 0.156 }

// Tree
{ real: -0.4, imag: 0.6 }

// Galaxy
{ real: 0.285, imag: 0.01 }

// San Marco
{ real: -0.75, imag: 0.11 }

// Rabbit
{ real: -0.123, imag: 0.745 }

// Dragon
{ real: -0.8, imag: 0.156 }

// Douady's rabbit
{ real: -0.123, imag: 0.745 }
```

---

## Keyboard Shortcuts (if implemented)

| Shortcut | Action |
|----------|--------|
| Ctrl+N | Create Newton fractal |
| Ctrl+M | Create Mandelbrot set |
| Ctrl+J | Create Julia set |
| Ctrl+E | Export to Manim |
| Ctrl+S | Save project |
| Space | Toggle fractal visibility |

---

## Troubleshooting

### Fractal doesn't render
1. Check browser console for WebGL errors
2. Verify canvas exists: `document.getElementById('fractal-canvas')`
3. Check viewport bounds are valid (xMin < xMax, yMin < yMax)

### Performance is slow
1. Reduce `maxIterations` (try 50 instead of 256)
2. Lower `resolutionMultiplier` (try 0.5 for half resolution)
3. Disable `superSampling` (set to 1)

### Colors look wrong
1. Ensure hex colors include `#` prefix
2. Check `colorMode` matches fractal type
3. Verify `rootColors.length >= roots.length` for Newton fractals

### Export fails
1. Check Manim is installed: `manim --version`
2. Verify Python script syntax
3. Try lower quality first: `-ql` instead of `-qh`

---

## API Reference

### FractalManager
```typescript
createNewtonFromRoots(roots, colors, options?)
createNewtonFromCoefficients(coefficients, colors?, options?)
createMandelbrot(options?)
createJulia(juliaParameter, options?)
createFromPreset(presetId)
updateFractal(id, updates)
updateNewtonRoots(id, roots)
get(id)
getAll()
delete(id)
toggleVisibility(id)
```

### FractalRenderer
```typescript
render()
setViewportBounds(bounds)
setFractalFunction(fractal)
resize(width, height)
dispose()
```

### Complex
```typescript
add(other)
subtract(other)
multiply(other)
divide(other)
power(n)
exp(), sqrt(), sin(), cos(), log()
magnitude(), angle(), conjugate()
toString(), toPolar()
```

### OperatorRegistry
```typescript
register(definition, enabled?, priority?)
get(id)
getByLatex(latex)
toLatex(expression)
fromLatex(latex)
```

---

## File Locations

```
src/
├── engine/
│   ├── complex-types.ts        # Complex & ComplexPolynomial
│   ├── operator-types.ts       # Operator definitions
│   ├── OperatorRegistry.ts     # Registry class
│   ├── fractal-types.ts        # Fractal interfaces
│   └── FractalManager.ts       # Fractal CRUD
│
├── scene/
│   ├── shaders/*.glsl          # WebGL shaders
│   └── FractalRenderer.ts      # WebGL renderer
│
├── ui/
│   └── FractalPanel.tsx        # UI component
│
└── export/
    └── ManimFractalExporter.ts # Python generation
```

---

## More Help

- **Full docs**: `FRACTAL_SYSTEM_COMPLETE.md`
- **Integration**: `FRACTAL_INTEGRATION_GUIDE.md`
- **Summary**: `SUMMARY_FRACTAL_BUILD.md`

---

**Happy fractal exploring!** 🌌
