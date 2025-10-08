# Unified Operator System - Quick Start Guide

**Last Updated:** 2025-10-07
**Version:** 2.0.0

---

## 🚀 5-Minute Quick Start

### Using Built-in Operators

```typescript
import { unifiedOperatorSystem } from './src/engine/UnifiedOperatorSystem';

// 1. Create from preset (easiest)
const newton = unifiedOperatorSystem.createFromPreset('newton-cubic');
const mandelbrot = unifiedOperatorSystem.createFromPreset('mandelbrot-classic');
const julia = unifiedOperatorSystem.createFromPreset('julia-standard');

// 2. Create with custom config
const custom = unifiedOperatorSystem.create('newton', {
  operatorId: 'newton',
  values: {
    roots: [
      { real: 1, imag: 0 },
      { real: -0.5, imag: 0.866 },
      { real: -0.5, imag: -0.866 },
    ],
    rootColors: ['#FF0000', '#00FF00', '#0000FF'],
    maxIterations: 100,
    tolerance: 1e-6,
    saturation: 0.5,
    blackForCycles: false,
  },
});

// 3. Get controls for UI (automatic)
const controls = unifiedOperatorSystem.getControlsFor('newton');
// → [
//     { id: 'roots', type: 'roots', label: 'Polynomial Roots', ... },
//     { id: 'rootColors', type: 'color-array', ... },
//     ...
//   ]
```

---

## 📦 Available Operators

| Operator | ID | Presets | Description |
|----------|----|---------|-----------  |
| **Newton Fractal** | `newton` | 2 | Root-finding basins of attraction |
| **Mandelbrot Set** | `mandelbrot` | 3 | Classic escape-time fractal |
| **Julia Set** | `julia` | 4 | Complex dynamics with fixed c |

**Full list with auto-generated docs:**
→ `/public/docs/reference/unified-operators.md`
→ Run `npm run docs:generate` to update

---

## 🎨 Working with Presets

### List All Presets

```typescript
// Get all presets for Newton fractal
const newtonPresets = unifiedOperatorSystem.getPresetsFor('newton');
// → [
//     { id: 'newton-cubic', name: 'Cubic (z³ - 1)', ... },
//     { id: 'newton-quintic', name: 'Quintic (z⁵ - 1)', ... },
//   ]

// Get specific preset details
const preset = unifiedOperatorSystem.getPreset('julia-douady-rabbit');
// → { name: 'Douady Rabbit', description: ..., config: { ... } }
```

### Create and Customize

```typescript
// Start from preset, then customize
const basePreset = unifiedOperatorSystem.getPreset('mandelbrot-classic');

const customized = unifiedOperatorSystem.create('mandelbrot', {
  operatorId: 'mandelbrot',
  values: {
    ...basePreset.config,
    colorScale: ['#000000', '#FF0000', '#FFFF00', '#FFFFFF'], // Custom colors
    maxIterations: 512, // More detail
  },
});
```

---

## 🔍 Discovery & Search

```typescript
// Search by keyword
const fractals = unifiedOperatorSystem.search('fractal');

// Get by category
const allFractals = unifiedOperatorSystem.getByCategory('fractal');
const calculusOps = unifiedOperatorSystem.getByCategory('calculus');

// Get all enabled
const all = unifiedOperatorSystem.getAllEnabled();

// Get most used (based on usage stats)
const popular = unifiedOperatorSystem.getMostUsed(5);
```

---

## 🛠️ Adding a New Operator

### Step 1: Create Capability File

**`src/engine/operators/fractals/my-fractal.ts`**

```typescript
import type { OperatorCapability } from '../../operator-capability-types';

export const myFractalCapability: OperatorCapability = {
  id: 'my-fractal',
  name: 'My Custom Fractal',
  category: 'fractal',
  description: 'Description of what it does',

  visualizationModes: {
    iteration: {
      type: 'escape-time',
      outcome: 'iteration-count',
    },
  },

  requiredControls: [
    {
      id: 'param1',
      type: 'number',
      label: 'Parameter 1',
      default: 2.0,
      validation: { min: 0, max: 10 },
    },
    // ... more controls
  ],

  generatorFn: (config) => ({
    id: `my-fractal-${Date.now()}`,
    name: 'My Fractal',
    mode: 'iteration',
    iterationFn: (z, c) => {
      // Your iteration logic here
      return z.power(2).add(c);
    },
    escapeTest: (z) => z.magnitude() > 2.0,
    colorFn: (result) => [1, 0, 0, 1], // RGBA
    metadata: {
      category: 'fractal',
      complexity: 'medium',
      gpuAccelerated: false,
    },
  }),

  presets: {
    'my-preset': {
      id: 'my-preset',
      name: 'My Preset',
      description: 'Description',
      operatorId: 'my-fractal',
      config: {
        param1: 2.0,
      },
    },
  },

  complexity: 'medium',
  gpuAccelerated: false,
};
```

### Step 2: Register It

**`src/engine/UnifiedOperatorSystem.ts`**

```typescript
private registerBuiltinOperators(): void {
  // ... existing imports

  import('./operators/fractals/my-fractal').then(({ myFractalCapability }) => {
    this.register(myFractalCapability);
  });
}
```

### Step 3: Use It!

```typescript
const myFractal = unifiedOperatorSystem.create('my-fractal', {
  operatorId: 'my-fractal',
  values: { param1: 3.5 },
});
```

**That's it!** UI controls are automatically generated from `requiredControls`.

---

## 🎛️ Control Types Reference

| Type | UI Component | Example Value |
|------|--------------|---------------|
| `number` | Slider/Input | `2.5` |
| `range` | Min/Max Slider | `{ min: 0, max: 10 }` |
| `complex` | Real + Imag Input | `{ real: -0.7, imag: 0.27 }` |
| `roots` | Complex Plane Editor | `[{ real: 1, imag: 0 }, ...]` |
| `color` | Color Picker | `'#FF0000'` |
| `color-array` | Gradient Editor | `['#000', '#F00', '#FFF']` |
| `boolean` | Toggle Switch | `true` / `false` |
| `select` | Dropdown | `'log'` / `'linear'` / `'sqrt'` |
| `formula` | Expression Editor | `'z^2 + c'` |

---

## 📚 Documentation

### Auto-Generated Docs

```bash
# Generate all documentation
npm run docs:generate
```

**Outputs:**
- `/public/docs/reference/unified-operators.md` - Operator catalog
- `/public/docs/reference/operators.md` - Math operator reference
- `/public/docs/reference/fractal-presets.md` - Preset library
- `/public/docs/reference/complex-numbers.md` - Complex math guide

### In-App Docs

Visit http://localhost:3000/docs after running `npm run dev`

---

## 🧪 Example: Newton Fractal Workflow

```typescript
// 1. List available Newton presets
const presets = unifiedOperatorSystem.getPresetsFor('newton');
console.log(presets.map(p => p.name));
// → ['Cubic (z³ - 1)', 'Quintic (z⁵ - 1)']

// 2. Create from preset
const cubic = unifiedOperatorSystem.createFromPreset('newton-cubic');

// 3. Get controls for UI
const controls = unifiedOperatorSystem.getControlsFor('newton');
// → Renders UI automatically based on control types

// 4. User modifies values in UI...
const customConfig = {
  operatorId: 'newton',
  values: {
    roots: [
      { real: 1, imag: 0 },
      { real: 0, imag: 1 },
      { real: -1, imag: 0 },
      { real: 0, imag: -1 },
    ],
    rootColors: ['#F00', '#0F0', '#00F', '#FF0'],
    maxIterations: 150,
    tolerance: 1e-7,
    saturation: 0.8,
  },
};

// 5. Create custom version
const custom = unifiedOperatorSystem.create('newton', customConfig);

// 6. Render it (GPU-accelerated if available)
render(custom);
```

---

## 🎯 Key Design Principles

1. **DRY (Don't Repeat Yourself)**
   - One `create()` method handles **all** operators
   - No separate `createNewton()`, `createMandelbrot()`, etc.

2. **Capability-Driven**
   - Operators declare *what they can do*, not *how*
   - System generates UI + validation + rendering from capabilities

3. **Data-Driven UI**
   - Controls are metadata (`ControlSpec[]`)
   - UI components map types → inputs automatically

4. **Extensible by Default**
   - Adding operators = 1 file (~100 lines)
   - No core code changes needed

---

## ⚡ Performance Tips

- **GPU Acceleration**: Set `gpuAccelerated: true` and provide `shaderCode`
- **Presets**: Use presets for known-good configurations
- **Complexity Hints**: Mark operators as `'low'`, `'medium'`, `'high'`, or `'extreme'`
- **Validation**: Add validation rules to controls to prevent bad inputs

---

## 🔗 See Also

- **Architecture Guide**: [`UNIFIED_OPERATOR_ARCHITECTURE.md`](UNIFIED_OPERATOR_ARCHITECTURE.md)
- **Full API Reference**: [`/public/docs/reference/unified-operators.md`](public/docs/reference/unified-operators.md)
- **Type Definitions**: [`src/engine/operator-capability-types.ts`](src/engine/operator-capability-types.ts)
- **Core System**: [`src/engine/UnifiedOperatorSystem.ts`](src/engine/UnifiedOperatorSystem.ts)

---

**Questions?** Check the in-app docs at http://localhost:3000/docs
