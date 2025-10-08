# Fractal Presets

> **Auto-generated from `src/engine/fractal-types.ts`**
> Last updated: 2025-10-07T04:57:19.124Z

Built-in fractal presets ready to use.

## Available Presets

### Newton Cubic (z³ - 1)

**ID:** `newton-cubic`

**Type:** newton

**Configuration:**

- **Polynomial Degree:** 3
- **Number of Roots:** 3
- **Root Colors:** #FF0000, #00FF00, #0000FF

**Usage:**

```typescript
import { FractalManager } from './engine/FractalManager';

const manager = new FractalManager();
const { fractal } = manager.createFromPreset('newton-cubic');
```

---

### Newton Quintic (z⁵ - 1)

**ID:** `newton-quintic`

**Type:** newton

**Configuration:**

- **Polynomial Degree:** 5
- **Number of Roots:** 5
- **Root Colors:** #440154, #3b528b, #21908c, #5dc963, #fde725

**Usage:**

```typescript
import { FractalManager } from './engine/FractalManager';

const manager = new FractalManager();
const { fractal } = manager.createFromPreset('newton-quintic');
```

---

### Classic Mandelbrot Set

**ID:** `mandelbrot-classic`

**Type:** mandelbrot

**Configuration:**

- **Power:** 2
- **Max Iterations:** 256
- **Color Smoothing:** log

**Usage:**

```typescript
import { FractalManager } from './engine/FractalManager';

const manager = new FractalManager();
const { fractal } = manager.createFromPreset('mandelbrot-classic');
```

---

### Julia Set (c = -0.7 + 0.27i)

**ID:** `julia-standard`

**Type:** julia

**Configuration:**

- **Power:** 2
- **Julia Parameter:** -0.7 + 0.27i
- **Max Iterations:** 256
- **Color Smoothing:** sqrt

**Usage:**

```typescript
import { FractalManager } from './engine/FractalManager';

const manager = new FractalManager();
const { fractal } = manager.createFromPreset('julia-standard');
```

---

### Burning Ship Fractal

**ID:** `burning-ship`

**Type:** burning-ship

**Configuration:**

- **Power:** 2
- **Max Iterations:** 512
- **Color Smoothing:** log

**Usage:**

```typescript
import { FractalManager } from './engine/FractalManager';

const manager = new FractalManager();
const { fractal } = manager.createFromPreset('burning-ship');
```

---

## Creating Custom Fractals

### Newton Fractal (from roots)

```typescript
manager.createNewtonFromRoots([
  { real: 1, imag: 0 },
  { real: -0.5, imag: 0.866 },
  { real: -0.5, imag: -0.866 },
], ['#FF0000', '#00FF00', '#0000FF']);
```

### Mandelbrot Set

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
