# Parametric Keyframe Studio - Developer Guide

**Version 1.0 | Last Updated: 2025-10-05**

This guide is for developers who want to understand, extend, or contribute to Parametric Keyframe Studio.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Core Systems](#core-systems)
4. [Configuration System](#configuration-system)
5. [Adding Features](#adding-features)
6. [Testing](#testing)
7. [Build & Deployment](#build--deployment)
8. [Contributing](#contributing)

---

## Architecture Overview

### Technology Stack

- **Frontend**: React 19 + TypeScript 5.9
- **Build Tool**: Vite 5.4
- **Rendering**: Canvas API (2D)
- **Math Engine**: math.js 13.2
- **Timeline**: Custom tweening engine
- **Export**: Python + Manim Community
- **Testing**: Vitest 3.2
- **State Management**: React hooks + Context API

### Architecture Layers

```
┌─────────────────────────────────────────┐
│           UI Layer (React)               │
│  - Parameter panels, timeline, viewport  │
│  - Settings/preset editors               │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│         State Management Layer           │
│  - Project state (params, keyframes)     │
│  - Config state (loaded presets)         │
│  - Playback state (timeline position)    │
└──────────────────┬──────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
┌───────▼─────────┐  ┌────────▼──────────┐
│  Engine Layer    │  │   Scene Layer     │
│  - Expression    │  │  - Space config   │
│    evaluation    │  │  - Camera state   │
│  - Parameter     │  │  - Warp functions │
│    resolution    │  │  - Grid rendering │
└───────┬──────────┘  └────────┬──────────┘
        │                      │
        └──────────┬───────────┘
                   │
        ┌──────────▼──────────┐
        │   Timeline Layer     │
        │  - Keyframe storage  │
        │  - Tweening engine   │
        │  - Easing functions  │
        └──────────┬───────────┘
                   │
        ┌──────────▼──────────┐
        │    Render Layer      │
        │  - Viewport (real-   │
        │    time preview)     │
        │  - Manim export      │
        └──────────────────────┘
```

### Design Principles

#### 1. **Configuration-Driven**
**ZERO hard-coded values**. Everything is configurable:
- Grid styles, colors, line widths
- Default parameter ranges
- Easing curves
- Performance thresholds

#### 2. **DRY (Don't Repeat Yourself)**
- Shared logic extracted to utilities
- Generic components reused across UI
- Registry pattern for extensibility

#### 3. **Type Safety**
- Full TypeScript coverage
- Strict mode enabled
- Interface-first design

#### 4. **Performance First**
- Target: 60 FPS viewport updates
- Debounced expensive operations
- Memoized calculations
- Progressive rendering

---

## Project Structure

```
manim-director-suite/
├── src/
│   ├── config/              # Configuration management
│   │   ├── ConfigManager.ts
│   │   ├── types.ts
│   │   └── schemas/         # JSON schemas
│   │
│   ├── engine/              # Expression & parameter logic
│   │   ├── ExpressionEngine.ts
│   │   ├── ParameterManager.ts
│   │   ├── FunctionManager.ts
│   │   ├── DependencyGraph.ts
│   │   ├── SymbolRegistry.ts
│   │   └── types.ts
│   │
│   ├── scene/               # Viewport & rendering
│   │   ├── Camera.ts
│   │   ├── Grid.ts
│   │   ├── Space.ts
│   │   ├── Viewport.tsx
│   │   └── types.ts
│   │
│   ├── timeline/            # Keyframes & interpolation
│   │   ├── KeyframeManager.ts
│   │   ├── TweeningEngine.ts
│   │   ├── EasingRegistry.ts
│   │   └── types.ts
│   │
│   ├── import/              # Desmos integration
│   │   ├── DesmosParser.ts
│   │   └── types.ts
│   │
│   ├── export/              # Manim integration
│   │   ├── ManimGenerator.ts
│   │   └── types.ts
│   │
│   ├── ui/                  # React components
│   │   ├── panels/
│   │   │   ├── ParameterPanel.tsx
│   │   │   ├── FunctionPanel.tsx
│   │   │   ├── TimelineView.tsx
│   │   │   └── SettingsPanel.tsx
│   │   ├── controls/
│   │   │   ├── Slider.tsx
│   │   │   ├── NumberInput.tsx
│   │   │   └── PresetSelector.tsx
│   │   └── viewport/
│   │       └── ViewportCanvas.tsx
│   │
│   ├── state/               # State management
│   │   ├── ProjectState.ts
│   │   ├── ProjectIO.ts
│   │   └── types.ts
│   │
│   ├── utils/               # Shared utilities
│   │   ├── math.ts
│   │   ├── validation.ts
│   │   └── performance.ts
│   │
│   ├── test/                # Tests
│   │   ├── unit/
│   │   ├── integration/
│   │   └── setup.ts
│   │
│   └── App.tsx              # Main app component
│
├── public/
│   └── config/              # Configuration files
│       ├── defaults.json
│       ├── validation-rules.json
│       ├── user-settings.json
│       └── presets/
│           ├── grid-styles/
│           ├── color-schemes/
│           ├── easing-curves/
│           └── warps/
│
├── docs/                    # Documentation
│   ├── archive/             # Historical docs
│   └── examples/            # Example projects
│
├── USER_GUIDE.md
├── DEVELOPER.md (this file)
├── CONFIG_REFERENCE.md
├── README.md
├── CLAUDE.md                # AI assistant instructions
├── package.json
├── tsconfig.json
├── vite.config.ts
└── vitest.config.ts
```

---

## Core Systems

### 1. Configuration System

**Location**: `src/config/`

**Purpose**: Load, validate, and provide access to all configuration values.

**Key Files**:
- `ConfigManager.ts` - Main config loading/access API
- `types.ts` - TypeScript interfaces for all config types

**Usage**:
```typescript
import { configManager } from '../config/ConfigManager';

// Get value with dot notation
const zoomMin = configManager.get('camera.zoomMin');

// Get preset
const gridStyle = configManager.getPreset('grid-styles', 'cartesian-dark');

// Get all presets in category
const allEasings = configManager.getPresets('easing-curves');
```

**Adding New Config**:
1. Define interface in `types.ts`
2. Create JSON file in `public/config/`
3. Add to config loading in `ConfigManager.ts`
4. Add schema validation (optional but recommended)

---

### 2. Expression Engine

**Location**: `src/engine/ExpressionEngine.ts`

**Purpose**: Parse and evaluate mathematical expressions using math.js.

**Features**:
- Expression validation
- Dependency extraction
- Greek symbol support (π, τ, α, β, etc.)
- Implicit multiplication (`2x` → `2*x`)
- LHS parsing (parameters, functions, anonymous plots)

**API**:
```typescript
const engine = new ExpressionEngine();

// Evaluate expression
const result = engine.evaluate('2 * π * r', { r: 5 });
// result = { success: true, value: 31.415... }

// Extract dependencies
const deps = engine.extractDependencies('k * sin(x)');
// deps = ['k', 'x']

// Parse full expression
const parsed = engine.parseExpression('f(x) = sin(k * x)');
// parsed = { lhs: { kind: 'function', name: 'f', ... }, rhs: 'sin(k*x)' }
```

**Adding Support for New Functions**:
```typescript
// In SymbolRegistry.ts, add to FALLBACK_TOKEN_MAP.functions:
functions: {
  '\\sqrt': { description: 'Square root' },
  '\\myFunction': { description: 'My custom function' },
}
```

---

### 3. Parameter Manager

**Location**: `src/engine/ParameterManager.ts`

**Purpose**: Manage CRUD operations for numeric parameters.

**API**:
```typescript
const manager = new ParameterManager();

// Create parameter
const param = manager.createParameter('Z', 710, {
  domain: { min: 0, max: 1000 },
  uiControl: { type: 'slider', min: 100, max: 1000, step: 10 }
});

// Update parameter
manager.updateParameter(param.id, { value: 500 });

// Get all parameters
const all = manager.getAllParameters();

// Get parameter by name
const z = manager.findParameterByName('Z');
```

**Important**: Parameters are **numeric-only** per spec §6. They don't store expressions, only values.

---

### 4. Keyframe Manager

**Location**: `src/timeline/KeyframeManager.ts`

**Purpose**: Manage keyframe CRUD operations and timeline state.

**API**:
```typescript
const kfManager = new KeyframeManager();

// Create keyframe with snapshot
const kf = kfManager.createKeyframe(0, 'Start', {
  parameters: {
    'param-1': { value: 100, include: true, easing: 'smoothstep' }
  },
  camera: { x: 0, y: 0, zoom: 1, rotation: 0, include: true },
  warp: { type: 'identity', parameters: {}, include: false }
});

// Update keyframe
kfManager.updateKeyframe(kf.id, { label: 'Beginning' });

// Delete keyframe
kfManager.deleteKeyframe(kf.id);

// Get surrounding keyframes
const [before, after] = kfManager.getSurroundingKeyframes(2.5);
```

---

### 5. Tweening Engine

**Location**: `src/timeline/TweeningEngine.ts`

**Purpose**: Interpolate values between keyframes using easing curves.

**API**:
```typescript
const tweener = new TweeningEngine();

// Get interpolated state at time t
const state = tweener.getStateAtTime(2.5, keyframes);
// state = {
//   parameters: { 'param-1': 75 },  // Interpolated value
//   camera: { x: 5, y: 2.5, zoom: 1.5, rotation: 0 },
//   warp: { type: 'identity', parameters: {} }
// }

// Get specific parameter value
const value = tweener.getParameterValueAtTime(2.5, keyframes, 'param-1');

// Get camera at time
const cam = tweener.getCameraAtTime(2.5, keyframes);
```

**How it Works**:
1. Finds keyframes before and after target time
2. Calculates normalized time `t` between them (0 to 1)
3. Applies easing function to `t`
4. Linearly interpolates using eased `t`

**Easing Curves** (loaded from config):
- `linear`: `t`
- `smoothstep`: `t² * (3 - 2t)`
- `ease-in`: `t³`
- `ease-out`: `1 - (1-t)³`
- `ease-in-out`: Custom cubic Bezier

---

### 6. Project I/O

**Location**: `src/state/ProjectIO.ts`

**Purpose**: Serialize and deserialize project state to/from JSON.

**API**:
```typescript
// Serialize to JSON
const json = ProjectIO.serialize(projectState);

// Deserialize from JSON
const loaded = ProjectIO.deserialize(json);

// Apply state to managers
ProjectIO.applyState(loaded, {
  parameterManager,
  functionManager,
  variableManager,
  keyframeManager
});
```

**Project File Format** (`.pkstudio`):
```json
{
  "version": "1.0.0",
  "metadata": {
    "name": "My Project",
    "created": "2025-01-01T00:00:00Z",
    "modified": "2025-01-02T10:30:00Z"
  },
  "parameters": [ ... ],
  "functions": [ ... ],
  "independentVariables": [ ... ],
  "keyframes": [ ... ],
  "timeline": { "duration": 10, "currentTime": 0 },
  "scene": { ... }
}
```

---

## Configuration System

### Config File Hierarchy

1. **System Defaults** (`public/config/defaults.json`)
   - Loaded first
   - Provides fallback values

2. **User Settings** (`public/config/user-settings.json`)
   - Overrides system defaults
   - Saved on user preference changes

3. **Project Overrides** (in project file)
   - Highest priority
   - Saved with each project

### Adding a New Config Category

**Step 1**: Define Interface
```typescript
// src/config/types.ts
export interface MyNewConfig {
  id: string;
  name: string;
  value: number;
  enabled: boolean;
}
```

**Step 2**: Add to PresetsConfig
```typescript
export interface PresetsConfig {
  'grid-styles': GridStyleConfig[];
  'color-schemes': ColorSchemeConfig[];
  'easing-curves': EasingCurveConfig[];
  'warps': WarpConfig[];
  'my-new-config': MyNewConfig[];  // Add this
}
```

**Step 3**: Create Preset Files
```
public/config/presets/my-new-config/
├── index.json           # Lists all files
├── preset1.json
└── preset2.json
```

**Step 4**: Update ConfigManager
```typescript
// In loadAll()
await this.loadPresets('my-new-config');
```

**Step 5**: Create UI Component
```tsx
// src/ui/controls/MyNewConfigSelector.tsx
function MyNewConfigSelector() {
  const presets = configManager.getPresets<MyNewConfig>('my-new-config');

  return (
    <select onChange={handleChange}>
      {presets.map(preset => (
        <option key={preset.id} value={preset.id}>
          {preset.name}
        </option>
      ))}
    </select>
  );
}
```

---

## Adding Features

### Adding a New Easing Curve

**Step 1**: Create Config File
```json
// public/config/presets/easing-curves/bounce.json
{
  "id": "bounce",
  "name": "Bounce",
  "type": "custom",
  "description": "Bouncy spring effect"
}
```

**Step 2**: Implement Function
```typescript
// src/timeline/EasingRegistry.ts
export function bounceEasing(t: number): number {
  const n = 7.5625;
  const d = 2.75;

  if (t < 1 / d) {
    return n * t * t;
  } else if (t < 2 / d) {
    return n * (t -= 1.5 / d) * t + 0.75;
  } else if (t < 2.5 / d) {
    return n * (t -= 2.25 / d) * t + 0.9375;
  } else {
    return n * (t -= 2.625 / d) * t + 0.984375;
  }
}

// Register it
easingRegistry.register('bounce', bounceEasing);
```

**Step 3**: Add to Index
```json
// public/config/presets/easing-curves/index.json
{
  "files": [
    "linear.json",
    "smoothstep.json",
    "bounce.json"
  ]
}
```

**Step 4**: Load in Registry
```typescript
// EasingRegistry loads from config automatically
const easingConfig = configManager.getPresets<EasingCurveConfig>('easing-curves');
```

---

### Adding a New Warp Function

**Step 1**: Define Config
```json
// public/config/presets/warps/spiral.json
{
  "id": "spiral",
  "name": "Spiral Warp",
  "type": "spiral",
  "parameters": {
    "intensity": 1.0,
    "turns": 3
  }
}
```

**Step 2**: Implement Function
```typescript
// src/scene/WarpRegistry.ts
export function spiralWarp(p: Point2D, params: any): Point2D {
  const r = Math.sqrt(p.x ** 2 + p.y ** 2);
  const theta = Math.atan2(p.y, p.x);
  const newTheta = theta + r * params.intensity * params.turns;

  return {
    x: r * Math.cos(newTheta),
    y: r * Math.sin(newTheta),
  };
}

// Register
warpRegistry.register('spiral', spiralWarp);
```

**Step 3**: Apply in Grid Rendering
```typescript
// src/scene/Grid.ts
for (let x = xMin; x <= xMax; x += step) {
  const point = { x, y: 0 };
  const warped = warpRegistry.apply(currentWarpId, point);
  // Draw line at warped.x, warped.y
}
```

---

## Testing

### Unit Tests

**Location**: `src/**/*.test.ts`

**Running Tests**:
```bash
npm run test          # Watch mode
npm run test:run      # Run once
npm run test:ui       # UI mode
npm run test:coverage # With coverage report
```

**Writing a Unit Test**:
```typescript
import { describe, it, expect } from 'vitest';
import { MyClass } from './MyClass';

describe('MyClass', () => {
  it('should do something', () => {
    const instance = new MyClass();
    const result = instance.doSomething(42);

    expect(result).toBe(84);
  });

  it('should handle edge case', () => {
    const instance = new MyClass();

    expect(() => {
      instance.doSomething(-1);
    }).toThrow();
  });
});
```

### Integration Tests

**Location**: `src/test/integration/`

**Purpose**: Test workflows across multiple systems.

**Example**:
```typescript
it('should create parameter and animate it', () => {
  const paramManager = new ParameterManager();
  const kfManager = new KeyframeManager();
  const tweener = new TweeningEngine();

  // Create parameter
  const param = paramManager.createParameter('x', 0);

  // Create keyframes
  const kf1 = kfManager.createKeyframe(0, 'Start', {
    parameters: { [param.id]: { value: 0, include: true, easing: 'linear' } },
    camera: { x: 0, y: 0, zoom: 1, rotation: 0, include: false },
    warp: { type: 'identity', parameters: {}, include: false },
  });

  const kf2 = kfManager.createKeyframe(10, 'End', {
    parameters: { [param.id]: { value: 100, include: true, easing: 'linear' } },
    camera: { x: 0, y: 0, zoom: 1, rotation: 0, include: false },
    warp: { type: 'identity', parameters: {}, include: false },
  });

  // Test interpolation
  const state = tweener.getStateAtTime(5, [kf1, kf2]);
  expect(state.parameters[param.id]).toBe(50);
});
```

### Test Coverage

**Current Status** (as of 2025-10-05):
- Unit Tests: 76/76 passing ✅
- Integration Tests: WIP (API refactoring needed)
- E2E Tests: Not yet implemented

**Coverage Goals**:
- Core systems: 80%+ coverage
- Critical paths: 100% coverage
- UI components: 60%+ coverage

---

## Build & Deployment

### Development

```bash
npm run dev        # Start dev server (http://localhost:5000)
npm run build      # Production build
npm run preview    # Preview production build
```

### Production Build

```bash
npm run build

# Output: dist/
# - index.html
# - assets/
#   - js/
#   - css/
#   - fonts/
```

### Environment Variables

Create `.env` file:
```env
VITE_API_URL=https://api.example.com
VITE_ENABLE_ANALYTICS=true
```

Access in code:
```typescript
const apiUrl = import.meta.env.VITE_API_URL;
```

### Deploy to Static Hosting

**Netlify**:
```bash
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"
```

**Vercel**:
```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
```

**GitHub Pages**:
```bash
npm run build
gh-pages -d dist
```

---

## Contributing

### Git Workflow

1. **Fork the repository**
2. **Create a branch**: `git checkout -b feature/my-feature`
3. **Make changes** and commit: `git commit -m "feat: add my feature"`
4. **Run tests**: `npm run test:run`
5. **Push**: `git push origin feature/my-feature`
6. **Create Pull Request** on GitHub

### Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, no logic change)
- `refactor`: Code refactoring
- `perf`: Performance improvement
- `test`: Adding tests
- `chore`: Build/tooling changes

**Examples**:
```
feat(timeline): add bounce easing curve

Implemented bounce easing for spring-like animations.
Added config file and registered in EasingRegistry.

Closes #123
```

### Code Style

- **TypeScript**: Strict mode enabled
- **Formatting**: Prettier (auto-format on save)
- **Linting**: ESLint rules enforced
- **Naming**:
  - Classes: PascalCase (`ParameterManager`)
  - Functions: camelCase (`createParameter`)
  - Constants: UPPER_SNAKE_CASE (`DEFAULT_ZOOM`)
  - Files: PascalCase for classes, camelCase for utilities

### Pull Request Checklist

Before submitting:
- [ ] Tests pass (`npm run test:run`)
- [ ] Build succeeds (`npm run build`)
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] Code formatted (`npm run format`)
- [ ] Documentation updated (if adding features)
- [ ] Commit messages follow convention
- [ ] No hard-coded values (use config)
- [ ] DRY principles followed

---

## Debugging

### Enable Verbose Logging

```typescript
// In App.tsx or main.ts
if (import.meta.env.DEV) {
  window.DEBUG = true;
}

// In any file
if (window.DEBUG) {
  console.log('Debug info:', data);
}
```

### React DevTools

Install [React DevTools](https://react.dev/learn/react-developer-tools) extension.

**Useful Features**:
- Component tree inspection
- Props/state viewer
- Performance profiling

### Performance Profiling

```typescript
// src/utils/performance.ts
export function profile(label: string, fn: () => void) {
  const start = performance.now();
  fn();
  const duration = performance.now() - start;
  console.log(`[${label}] took ${duration.toFixed(2)}ms`);
}

// Usage
profile('Render grid', () => {
  grid.render(ctx, camera);
});
```

---

## FAQ

### Q: How do I add a new parameter type?

**A**: Parameters are numeric-only per spec. For complex expressions, use Functions instead.

### Q: Can I add 3D rendering?

**A**: Not in MVP. 3D is Phase 2. Current architecture uses Canvas 2D. You'd need to migrate to Three.js.

### Q: How do I optimize for 1000+ parameters?

**A**: Use Web Workers for evaluation, virtualize parameter list UI, enable caching in config.

### Q: Can I export to formats other than Manim?

**A**: Yes! Create a new generator in `src/export/` (e.g., `BlenderGenerator.ts`) following the Manim pattern.

---

## Resources

- **Math.js Docs**: https://mathjs.org/docs/
- **React Docs**: https://react.dev/
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/
- **Vitest Docs**: https://vitest.dev/
- **Manim Community**: https://docs.manim.community/

---

## Need Help?

- **GitHub Issues**: https://github.com/tsolomon89/manim-director-suite/issues
- **Discussions**: https://github.com/tsolomon89/manim-director-suite/discussions

Happy coding! 🚀
