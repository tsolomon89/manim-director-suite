# Parametric Keyframe Studio - AI Development Guide

> **🚨 IMPORTANT: All project documentation now lives in `/public/docs/` 🚨**
>
> This file provides **development guidelines and coding principles** for AI agents.
>
> For project knowledge, features, and architecture, see:
> - **In-app**: http://localhost:3000/docs (when running)
> - **Files**: `/public/docs/` directory
> - **Index**: `/public/docs/index.json` (master catalog)
> - **AI Instructions**: `AGENTS.md` (knowledge base guide)

## 🎯 Current Status: v2.0.0

- ✅ **v1.0.0 (MVP)**: All 8 phases complete
- ✅ **v2.0.0**: P1 (Coordinate Plotting) + F20 (Implicit Functions) + F46 (Docs System)
- 🚧 **Next**: Phase 1 remaining (F4, P7, Q2, P12)

📖 **Full details**: `/public/docs/changelog/`

## Project Overview

A desktop/web application for exploring mathematical expressions as living, animated scenes. Users define numeric parameters (optionally imported from Desmos JSON), arrange a camera in 2D/3D space, save keyframes, and generate smooth, high-quality animations. The system provides real-time interactive exploration with the option to export cinematic renders via Manim Community.

**Core Philosophy**: Parameters as controllable dials → Visual structure → Keyframe storytelling → Film-quality output

## Reference Documents

### In-App Documentation System

This project uses an in-app documentation system (F46) located at `/public/docs/`. Access it at http://localhost:3000/docs or via the "📖 Docs" button in the app header.

**Documentation Categories:**

- **User Guide** (`/docs/user-guide/`) — How to use features
  - Getting Started, Parameters, Functions, Timeline, Export
- **Reference** (`/docs/reference/`) — Technical syntax and shortcuts
  - Expression Syntax, Keyboard Shortcuts, Config System, File Formats
- **Developer** (`/docs/developer/`) — Architecture and contributing
  - Architecture Overview, Testing Guide, Contributing, API Reference
- **Changelog** (`/docs/changelog/`) — Version history and roadmap
  - v1.0.0 (MVP), v2.0.0 (P1+F20), Roadmap

**Master Index**: `/docs/index.json` contains metadata for all documents including categories, titles, tags, and ordering.

### Legacy Documents (Root Level)

- `README.md` — Quick start, features, current status
- `docs/archive/` — Historical progress documentation (20+ files)

**For AI Agents**: Always check `/docs/` first for current project knowledge. Use `docs/index.json` to discover available documentation.

## For the AI Agent: Decision Framework

### When to Ask vs Proceed

**ASK the user when**:
- Multiple valid technology choices exist (e.g., React vs Svelte, Canvas vs WebGL)
- Design decisions affect UX significantly (layout, workflow patterns)
- Ambiguous requirements in the spec
- Trade-offs between performance and features

**PROCEED without asking when**:
- Implementation details that don't affect the API
- Standard patterns that follow this document
- Internal code organization
- Variable naming and file structure (follow the conventions below)

### Validation Before Coding

Before implementing ANY feature, confirm:
1. ✅ Is this in MVP scope? (see MVP checklist below)
2. ✅ What configuration needs to exist for this? (avoid hard-coding)
3. ✅ What's the data schema? (define TypeScript interfaces first if using TS)
4. ✅ How does this serialize? (everything must round-trip through JSON)
5. ✅ Where does this fit in the architecture layers? (engine/scene/timeline/ui/state)


## CRITICAL: Configuration-Driven Architecture

**ZERO HARD-CODED VALUES POLICY**

Every constant, default, style, preset, and behavior rule MUST be configurable. If it's a number, color, string, or behavior flag, it should be:
1. Defined in a configuration file
2. Editable through the application UI
3. Saved with the project or as a user preset
4. Validated on load

### Configuration Files Structure

```
config/
├── defaults.json           # System-wide defaults (loaded at startup)
├── presets/
│   ├── grid-styles/
│   │   ├── cartesian-dark.json
│   │   ├── polar-light.json
│   │   └── minimal.json
│   ├── color-schemes/
│   │   ├── scientific.json
│   │   ├── vibrant.json
│   │   └── monochrome.json
│   ├── easing-curves/
│   │   ├── built-in.json      # linear, smoothstep, ease-in, ease-out, etc.
│   │   └── custom.json        # user-defined curves
│   └── warps/
│       ├── identity.json
│       ├── radial.json
│       └── conformal.json
├── user-settings.json      # User preferences (camera speed, UI theme, etc.)
└── validation-rules.json   # Domain constraints, warning thresholds
```

### Example: Grid Style Configuration

```json
{
  "id": "cartesian-dark",
  "name": "Dark Cartesian",
  "description": "High contrast for presentations",
  "axes": {
    "color": "#FFFFFF",
    "width": 2,
    "showArrows": true,
    "arrowSize": 10
  },
  "majorGrid": {
    "color": "#444444",
    "width": 1,
    "spacing": 1.0,
    "visible": true
  },
  "minorGrid": {
    "color": "#2A2A2A",
    "width": 0.5,
    "spacing": 0.2,
    "visible": true
  },
  "labels": {
    "show": true,
    "color": "#CCCCCC",
    "fontSize": 12,
    "fontFamily": "monospace",
    "precision": 2
  },
  "background": "#000000"
}
```

### Example: Easing Curve Configuration

```json
{
  "id": "smoothstep",
  "name": "Smooth Step",
  "type": "cubic",
  "formula": "t * t * (3 - 2 * t)",
  "controlPoints": null,
  "discrete": false
}
```

### Configuration Management System Requirements

Build a **ConfigManager** that:
- Loads all configs on startup
- Provides getters for any config value by path (e.g., `config.get('grid.axes.color')`)
- Validates configs against schemas
- Allows runtime updates and saves
- Merges project-specific overrides with defaults
- Exports/imports preset packs

### UI for Configuration (Settings Panel)

Every configurable aspect needs a UI:
- **Preset selector dropdowns**: "Load Grid Style" → list all `grid-styles/*.json`
- **Live editors**: Modify values in a form, see real-time preview
- **Save/Export**: "Save as Preset" → writes new JSON to presets folder
- **Import**: User can drag-drop a preset JSON file
- **Reset to Default**: Restore system defaults for any category

## DRY Principles: Mandatory Patterns

### 1. Single Source of Truth

```javascript
// ❌ BAD: Hard-coded in multiple places
const gridColor = "#444444";  // in grid.js
const defaultGridColor = "#444444";  // in scene.js

// ✅ GOOD: Single config source
const gridColor = config.get('grid.majorGrid.color');
```

### 2. Shared Logic Extraction

```javascript
// ❌ BAD: Repeated tweening logic
function tweenParameter(t, v0, v1) { return v0 + (v1 - v0) * t; }
function tweenCamera(t, c0, c1) { return c0 + (c1 - c0) * t; }

// ✅ GOOD: Generic interpolation
function lerp(t, a, b) { return a + (b - a) * t; }
function tweenValue(t, start, end, easingFn) {
  return lerp(easingFn(t), start, end);
}
```

### 3. Data-Driven Rendering

```javascript
// ❌ BAD: Hard-coded rendering
ctx.strokeStyle = "#444444";
ctx.lineWidth = 1;
ctx.stroke();

// ✅ GOOD: Style from config
const style = config.get('grid.majorGrid');
ctx.strokeStyle = style.color;
ctx.lineWidth = style.width;
if (style.visible) ctx.stroke();
```

### 4. Reusable Components

Build generic, parameterized components:
- `<ParameterControl value={} onChange={} config={} />` — Works for sliders, steppers, inputs
- `<PresetSelector category="grid-styles" onSelect={} />` — Works for any preset type
- `<ConfigEditor schema={} value={} onChange={} />` — JSON editor with validation

### 5. Factory Patterns for Extensibility

```javascript
// ❌ BAD: Switch statements everywhere
function applyWarp(point, warpType) {
  switch(warpType) {
    case 'identity': return point;
    case 'radial': return radialWarp(point);
    // ...
  }
}

// ✅ GOOD: Registry pattern
const warpRegistry = new Map();
warpRegistry.set('identity', (p) => p);
warpRegistry.set('radial', radialWarpFn);

function applyWarp(point, warpType) {
  const fn = warpRegistry.get(warpType) || identity;
  return fn(point);
}

// Loading from config:
function loadWarps() {
  const warpConfigs = config.get('warps');
  warpConfigs.forEach(cfg => {
    warpRegistry.set(cfg.id, createWarpFromConfig(cfg));
  });
}
```

## Technology Stack & Architecture

### Recommended Stack

- **Frontend Framework**: React or Svelte (your choice — optimize for reactivity)
- **Rendering**: Canvas API (2D for MVP) or WebGL (Three.js if 3D needed later)
- **Mathematical Engine**: math.js for expression evaluation
- **Desktop Wrapper**: Electron or Tauri (if desktop-first) or pure web
- **Animation Export**: Python + Manim Community (subprocess/API calls)
- **State Management**: Context API / Zustand / Redux (minimal, performance-first)
- **Project Files**: JSON format for save/load
- **Config Validation**: Ajv or similar JSON schema validator

### Architecture Layers

```
┌─────────────────────────────────────────┐
│           UI Layer (React/Svelte)        │
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

### Performance Requirements

Real-time updates are **non-negotiable** for MVP:
- Target: 60fps viewport updates while scrubbing
- Parameter changes reflect within 16ms
- Optimize using:
  - Debouncing for expensive calculations (use config value `performance.debounceMs`)
  - Memoization/caching (cache config: `performance.enableCache`)
  - Web Workers for heavy math (threshold: `performance.workerThreshold`)
  - RequestAnimationFrame for smooth rendering
  - Progressive rendering (draft mode while active, high quality on idle)

All performance thresholds should be in `config/user-settings.json`.


## MVP Scope: Feature Checklist

Build these features in order. Each must be fully configurable (no hard-coded values).

### Phase 1: Foundation & Configuration System ✅ COMPLETE

**Status**: ✅ **COMPLETE** - All acceptance criteria met (see PHASE1_COMPLETE.md)

- [x] **Configuration Manager** ✅
  - Load/parse all JSON configs from `/config` directory
  - Schema validation for all config types
  - Hot-reload in dev mode (supported)
  - Get/set API with dot notation (`config.get('grid.axes.color')`)
  - Merge priority: project overrides > user settings > system defaults

- [x] **Settings UI** ✅
  - Preset selector components (grid styles, color schemes, easing curves)
  - Live config editor with real-time preview
  - Save/export presets to JSON (runtime updates working, file export in Phase 8)
  - Import preset files (supported via ConfigManager)
  - Reset to defaults (supported)

- [ ] **Project File System** (Moved to Phase 2)
  - Save entire project as JSON (parameters + keyframes + settings + scene config)
  - Load project from JSON
  - Validate project structure on load
  - Deterministic reproduction (same input = same output)

**Delivered**:
- ConfigManager with 22+ config files
- 4 preset categories: grid-styles (4), color-schemes (3), easing-curves (5), warps (2)
- Generic PresetSelector component (DRY principle)
- SettingsPanel with live switching
- Full TypeScript type system (15+ interfaces)
- Demo app at http://localhost:3000

**Files Created**: See PHASE1_COMPLETE.md for complete list

### Phase 2: Scene & Rendering

- [ ] **2D Scene with Grid**
  - Space types: Cartesian, Polar (config: `scene.spaceType`)
  - Configurable bounds (min/max for x/y)
  - All-quadrants toggle
  - Grid rendering using loaded grid style preset
  - Layer visibility toggles (axes, major grid, minor grid, labels)
  
- [ ] **Viewport Renderer**
  - Canvas-based 2D renderer
  - Real-time updates (<16ms target)
  - Apply grid style from config
  - Draft/quality mode toggle (from `user-settings.json`)
  - Performance metrics display (fps, render time)

- [ ] **Camera System (2D)**
  - Pan (mouse drag)
  - Zoom (mouse wheel, pinch, or slider)
  - Reset to fit bounds
  - Camera state serialization
  - Named camera bookmarks (stored in project)
  - Camera speed/sensitivity from config

### Phase 3: Parameters & Expressions

- [ ] **Expression Engine**
  - Parse and evaluate expressions using math.js
  - Dependency resolution (if `k = 2*Z`, changing `Z` updates `k`)
  - Domain validation (warn on singularities, division by zero)
  - Validation rules from `config/validation-rules.json`
  - Cached evaluation (invalidate on dependency change)

- [ ] **Parameter System**
  - Data structure: `{ id, name, expression, value, domain, uiControl, metadata }`
  - CRUD operations: create, read, update, delete parameters
  - Dependency graph tracking
  - Default parameter config (min/max/step) loaded from settings

- [ ] **Parameter UI Panel**
  - List view with search/filter
  - Add/edit/delete parameters
  - Control types: slider, number input, stepper (config: `parameter.uiControl.type`)
  - Live expression validation with error messages
  - Group/organize by category (optional folders, like Desmos)

### Phase 4: Desmos Import

- [ ] **JSON Parser**
  - Load Desmos graph state JSON
  - Extract `version`, `graph.viewport`, `graph.complex`
  - Parse `expressions.list` items (type: `expression`, `folder`, `text`)
  - Filter for numeric definitions only (MVP)
  
- [ ] **Numeric Definition Extractor**
  - Identify variables: `Z=710`, `T=1.999`, etc.
  - Extract slider metadata if present
  - Preserve IDs and folder structure (for round-trip)
  - **IGNORE**: List ranges (`[0...Z-1]`), graphables, complex plotting

- [ ] **Mapping UI**
  - Display extracted definitions
  - User selects which to import
  - Map to internal parameter structure
  - Set scene bounds from `graph.viewport`
  - Warning if complex mode or lists detected (Phase 2 features)

- [ ] **Validation & Error Handling**
  - Check for unsupported expressions
  - Warn about missing dependencies
  - Report parsing errors with line numbers (if possible)
  - Graceful degradation (import what's possible, warn about rest)

### Phase 5: Keyframes & Timeline

- [ ] **Keyframe Data Structure**
  ```json
  {
    "id": "kf-001",
    "time": 0,
    "label": "Start",
    "snapshot": {
      "parameters": { "param-id": { "value": 710, "include": true, "easing": "smoothstep" } },
      "camera": { "x": 0, "y": 0, "zoom": 1, "include": true },
      "warp": { "type": "identity", "include": false }
    }
  }
  ```

- [ ] **Keyframe Manager**
  - Add/edit/delete keyframes
  - Reorder (change time position)
  - Clone keyframe
  - Snapshot current state (capture params + camera + warp)
  - Per-item include toggles (which params to tween)
  
- [ ] **Timeline UI**
  - Horizontal timeline with time ruler
  - Keyframe markers (draggable)
  - Playhead (scrubber)
  - Global duration setting
  - Zoom in/out on timeline
  - Snap to keyframe (config: `timeline.snapEnabled`)

- [ ] **Tweening Engine**
  - Linear interpolation (lerp)
  - Load easing functions from `config/presets/easing-curves/`
  - Per-parameter easing selection
  - Real-time calculation: `getValueAtTime(time, keyframes, paramId)`
  - Handle edge cases (no keyframes, single keyframe, outside range)

- [ ] **Playback Controls**
  - Play/pause
  - Scrub timeline (drag playhead)
  - Jump to keyframe
  - Loop playback (config: `timeline.loopMode`)
  - Playback speed control (config: `timeline.playbackSpeed`)

- [ ] **Real-time Updates**
  - Viewport updates while scrubbing (no lag)
  - Parameter values update in UI during playback
  - Smooth interpolation at 60fps
  - Debounce heavy calculations (config: `performance.debounceMs`)

### Phase 6: Warp System (Basic)

- [ ] **Warp Function Registry**
  - Load warp definitions from `config/presets/warps/`
  - Factory pattern: `warpRegistry.get(type)` returns function
  - Identity warp (no transformation)
  - One additional warp: radial distortion or conformal (your choice)

- [ ] **Warp Application**
  - Apply to grid coordinates (visual distortion)
  - Toggle: warp space only vs warp space + overlaid points (prep for Phase 2)
  - Warp can be part of keyframe snapshot
  - Configurable intensity/parameters per warp type

- [ ] **Warp UI**
  - Dropdown to select warp type
  - Parameter controls for selected warp (if any)
  - Enable/disable toggle
  - Include in keyframe checkbox

### Phase 7: Rendering & Export

- [ ] **Frame Export (PNG)**
  - Export current viewport as PNG
  - Resolution presets from config: `export.resolutions` (e.g., `["1920x1080", "3840x2160"]`)
  - Custom resolution input
  - File name prompt with timestamp default

- [ ] **Manim Integration**
  - Generate Python script from project state
  - Template system: fill in parameters, keyframes, camera, scene config
  - Map our easing names to Manim rate functions
  - Write script to temp file
  - Execute Manim subprocess: `manim -ql output.py SceneName`
  - Capture stdout/stderr for error reporting

- [ ] **Animation Export (MP4)**
  - Resolution presets: 720p, 1080p, 4K (from config)
  - Frame rate selection: 24, 30, 60 fps (from config)
  - Quality settings: draft, medium, high (maps to Manim flags)
  - Progress indicator during render
  - Return video file path on completion
  - Handle errors gracefully (Manim not installed, script errors)

- [ ] **Export Dialog UI**
  - Format selection (PNG, MP4)
  - Resolution dropdown (from config)
  - Frame rate dropdown (from config)
  - Quality slider (from config)
  - Preview before render (show final duration, file size estimate)
  - Export button with progress bar

### Phase 8: Testing & Polish

- [ ] **Unit Tests**
  - Expression engine (parse, evaluate, dependencies)
  - Tweening logic (lerp, easing functions, edge cases)
  - Config manager (load, validate, merge)
  - Desmos parser (extract numeric defs)

- [ ] **Integration Tests**
  - Load project → modify → save → reload (state matches)
  - Import Desmos JSON → parameters populate correctly
  - Create keyframes → scrub timeline → values interpolate
  - Export PNG → file exists and matches viewport

- [ ] **Error Handling**
  - Invalid expressions: show error in UI, don't crash
  - Missing config files: load defaults, warn user
  - Malformed project JSON: validate and report issues
  - Manim errors: display stdout/stderr in dialog

- [ ] **Performance Validation**
  - Measure fps while scrubbing (should be ≥ 60fps)
  - Measure parameter update latency (should be < 16ms)
  - Profile heavy operations (expression eval, rendering)
  - Optimize bottlenecks

## Explicit Out-of-Scope for MVP

Do NOT implement these features yet (Phase 2):

- ❌ 3D scenes (volumetric grid, orbit camera)
- ❌ Complex number visualization (`graph.complex: true`)
- ❌ List-based plotting (`[0...Z-1]`, `sin(n*f)`)
- ❌ Advanced warps (conformal stacks, logarithmic)
- ❌ Derived locks (keeping `|f|` or `k` constant)
- ❌ Discrete/modulo tweening semantics
- ❌ Custom color logic (residue-based, spoke counters)
- ❌ Annotations, labels, callouts
- ❌ Scene playlists (multiple timeline sequences)
- ❌ Collaboration features
- ❌ Cloud storage/sync
- ❌ Command palette

If the user requests any of these, politely decline and suggest focusing on MVP completion first.


## Coding Standards & Patterns

### Absolute Rules

1. **NO MAGIC NUMBERS**: Every constant goes in config
   ```javascript
   // ❌ NEVER DO THIS
   const gridSpacing = 1.0;
   const cameraSpeed = 0.5;
   const minZoom = 0.1;
   
   // ✅ ALWAYS DO THIS
   const gridSpacing = config.get('grid.majorGrid.spacing');
   const cameraSpeed = config.get('camera.panSpeed');
   const minZoom = config.get('camera.zoomMin');
   ```

2. **DRY (Don't Repeat Yourself)**: Extract shared logic immediately
   ```javascript
   // ❌ BAD: Repeated validation
   if (value < min || value > max) { /* error */ }  // in 3 places
   
   // ✅ GOOD: Shared validator
   function validateRange(value, min, max, label) {
     if (value < min || value > max) {
       throw new ValidationError(`${label} must be between ${min} and ${max}`);
     }
   }
   ```

3. **Type Safety** (use TypeScript if chosen):
   ```typescript
   interface Parameter {
     id: string;
     name: string;
     expression: string;
     value: number;
     domain?: { min: number; max: number };
     uiControl: UIControl;
     metadata: ParameterMetadata;
   }
   
   interface UIControl {
     type: 'slider' | 'number' | 'stepper';
     min: number;
     max: number;
     step: number;
   }
   ```

4. **Error Handling**: Never fail silently
   ```javascript
   // ❌ BAD
   try { 
     const value = evaluate(expression); 
   } catch(e) { 
     // silent failure
   }
   
   // ✅ GOOD
   try {
     const value = evaluate(expression);
     return { success: true, value };
   } catch(e) {
     console.error(`Expression evaluation failed: ${expression}`, e);
     return { success: false, error: e.message };
   }
   ```

5. **Documentation**: JSDoc for all public APIs
   ```javascript
   /**
    * Interpolates between two values using the specified easing function.
    * @param {number} t - Normalized time [0, 1]
    * @param {number} start - Starting value
    * @param {number} end - Ending value
    * @param {EasingFunction} easingFn - Easing function from config
    * @returns {number} Interpolated value
    */
   function tweenValue(t, start, end, easingFn) {
     return lerp(easingFn(t), start, end);
   }
   ```

### Component Organization

```
src/
├── config/
│   ├── ConfigManager.js         # Core config loading/validation/access
│   ├── schemas/                 # JSON schemas for validation
│   │   ├── parameter.schema.json
│   │   ├── keyframe.schema.json
│   │   ├── grid-style.schema.json
│   │   └── project.schema.json
│   └── defaults.js              # Fallback defaults if config missing
│
├── engine/
│   ├── ExpressionEngine.js      # Parse & evaluate expressions
│   ├── ParameterManager.js      # CRUD operations for parameters
│   ├── DependencyGraph.js       # Track parameter dependencies
│   ├── Validator.js             # Domain validation, singularity checks
│   └── Cache.js                 # Memoization for expensive evaluations
│
├── scene/
│   ├── Camera.js                # Camera state & transformations
│   ├── Grid.js                  # Grid rendering logic (config-driven)
│   ├── Space.js                 # 2D space configuration
│   ├── Viewport.js              # Canvas renderer (real-time)
│   └── WarpRegistry.js          # Load & apply warp functions
│
├── timeline/
│   ├── KeyframeManager.js       # CRUD operations for keyframes
│   ├── TweeningEngine.js        # Interpolation logic
│   ├── EasingRegistry.js        # Load easing curves from config
│   └── PlaybackController.js    # Play/pause/scrub logic
│
├── import/
│   ├── DesmosParser.js          # Parse Desmos JSON
│   ├── NumericExtractor.js      # Extract numeric definitions only
│   └── MappingService.js        # Map to internal Parameter structure
│
├── export/
│   ├── ManimGenerator.js        # Generate Python scripts
│   ├── TemplateEngine.js        # Fill Manim templates
│   └── SubprocessRunner.js      # Execute Manim, capture output
│
├── ui/
│   ├── ParameterPanel.jsx       # Parameter list & controls
│   ├── TimelineView.jsx         # Timeline scrubber & keyframes
│   ├── ViewportCanvas.jsx       # Canvas wrapper component
│   ├── SceneConfig.jsx          # Scene settings panel
│   ├── CameraControls.jsx       # Camera bookmark & controls UI
│   ├── WarpControls.jsx         # Warp selection & parameters
│   ├── ExportDialog.jsx         # Export settings modal
│   ├── SettingsPanel.jsx        # Config/preset editor
│   ├── PresetSelector.jsx       # Generic preset dropdown
│   └── ConfigEditor.jsx         # JSON editor with validation
│
├── state/
│   ├── ProjectState.js          # Global project state
│   ├── PlaybackState.js         # Timeline position, playing state
│   └── ProjectIO.js             # Save/load project files
│
└── utils/
    ├── math.js                  # Shared math utilities (lerp, clamp, etc.)
    ├── validation.js            # Shared validation functions
    ├── serialization.js         # JSON serialize/deserialize helpers
    └── performance.js           # Debounce, throttle, memoize
```

### File Naming Conventions

- **Config files**: `kebab-case.json` (e.g., `cartesian-dark.json`)
- **JS/TS modules**: `PascalCase.js` for classes, `camelCase.js` for utilities
- **React components**: `PascalCase.jsx`
- **Test files**: `*.test.js` or `*.spec.js`

### Import/Export Patterns

```javascript
// ❌ BAD: Default exports with unclear names
export default function(a, b) { return a + b; }

// ✅ GOOD: Named exports with clear intent
export function lerp(t, a, b) { return a + (b - a) * t; }
export function clamp(value, min, max) { return Math.min(Math.max(value, min), max); }
```

## Configuration-Driven Design Patterns

### Pattern 1: Registry + Factory

Use for extensible systems (warps, easing, renderers):

```javascript
// WarpRegistry.js
class WarpRegistry {
  constructor() {
    this.warps = new Map();
  }
  
  register(id, factory) {
    this.warps.set(id, factory);
  }
  
  get(id) {
    return this.warps.get(id) || this.warps.get('identity');
  }
  
  loadFromConfig(configManager) {
    const warpConfigs = configManager.get('warps');
    warpConfigs.forEach(cfg => {
      const factory = this.createFactoryFromConfig(cfg);
      this.register(cfg.id, factory);
    });
  }
  
  createFactoryFromConfig(cfg) {
    // Parse cfg.formula or cfg.type to create warp function
    if (cfg.type === 'identity') {
      return (p) => p;
    }
    if (cfg.type === 'radial') {
      return (p) => {
        const r = Math.sqrt(p.x ** 2 + p.y ** 2);
        const factor = cfg.intensity || 1.0;
        return { x: p.x * factor, y: p.y * factor };
      };
    }
    // ... more types
  }
}

export const warpRegistry = new WarpRegistry();
```

### Pattern 2: Strategy Pattern for Rendering

```javascript
// Viewport.js
class Viewport {
  constructor(canvas, configManager) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.config = configManager;
    this.renderStrategy = this.config.get('viewport.renderMode') === 'draft' 
      ? new DraftRenderer(this.ctx)
      : new HighQualityRenderer(this.ctx);
  }
  
  render(scene, camera, warp) {
    this.renderStrategy.render(scene, camera, warp, this.config);
  }
  
  switchQuality(mode) {
    this.config.set('viewport.renderMode', mode);
    this.renderStrategy = mode === 'draft' 
      ? new DraftRenderer(this.ctx)
      : new HighQualityRenderer(this.ctx);
  }
}
```

### Pattern 3: Data-Driven UI Components

```jsx
// PresetSelector.jsx - Works for ANY preset type
function PresetSelector({ category, onSelect, currentId }) {
  const presets = useConfig(`presets.${category}`);
  
  return (
    <select value={currentId} onChange={(e) => onSelect(e.target.value)}>
      {presets.map(preset => (
        <option key={preset.id} value={preset.id}>
          {preset.name}
        </option>
      ))}
    </select>
  );
}

// Usage:
<PresetSelector category="grid-styles" onSelect={handleGridStyleChange} />
<PresetSelector category="color-schemes" onSelect={handleColorChange} />
<PresetSelector category="easing-curves" onSelect={handleEasingChange} />
```

### Pattern 4: Builder Pattern for Complex Objects

```javascript
// KeyframeBuilder.js
class KeyframeBuilder {
  constructor() {
    this.keyframe = {
      id: generateId(),
      time: 0,
      label: '',
      snapshot: {}
    };
  }
  
  atTime(t) {
    this.keyframe.time = t;
    return this;
  }
  
  withLabel(label) {
    this.keyframe.label = label;
    return this;
  }
  
  snapshotParameter(paramId, value, include = true, easing = 'linear') {
    if (!this.keyframe.snapshot.parameters) {
      this.keyframe.snapshot.parameters = {};
    }
    this.keyframe.snapshot.parameters[paramId] = { value, include, easing };
    return this;
  }
  
  snapshotCamera(camera, include = true) {
    this.keyframe.snapshot.camera = { ...camera, include };
    return this;
  }
  
  build() {
    return this.keyframe;
  }
}

// Usage:
const keyframe = new KeyframeBuilder()
  .atTime(5.0)
  .withLabel('Halfway Point')
  .snapshotParameter('Z', 710, true, 'smoothstep')
  .snapshotCamera({ x: 0, y: 0, zoom: 1.5 })
  .build();
```

## Data Schemas & Validation

### Project File Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["version", "metadata", "parameters", "keyframes", "scene"],
  "properties": {
    "version": { "type": "string", "pattern": "^\\d+\\.\\d+\\.\\d+$" },
    "metadata": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "created": { "type": "string", "format": "date-time" },
        "modified": { "type": "string", "format": "date-time" }
      }
    },
    "parameters": {
      "type": "array",
      "items": { "$ref": "#/definitions/parameter" }
    },
    "keyframes": {
      "type": "array",
      "items": { "$ref": "#/definitions/keyframe" }
    },
    "scene": {
      "type": "object",
      "properties": {
        "spaceType": { "enum": ["cartesian", "polar"] },
        "bounds": {
          "type": "object",
          "properties": {
            "xMin": { "type": "number" },
            "xMax": { "type": "number" },
            "yMin": { "type": "number" },
            "yMax": { "type": "number" }
          }
        },
        "gridStyle": { "type": "string" },
        "camera": { "$ref": "#/definitions/camera" },
        "warp": { "$ref": "#/definitions/warp" }
      }
    }
  }
}
```

### Validation in Code

```javascript
import Ajv from 'ajv';
import projectSchema from './schemas/project.schema.json';

const ajv = new Ajv();
const validateProject = ajv.compile(projectSchema);

export function loadProject(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    const valid = validateProject(data);
    
    if (!valid) {
      const errors = validateProject.errors.map(e => 
        `${e.instancePath}: ${e.message}`
      ).join('\n');
      throw new ValidationError(`Invalid project file:\n${errors}`);
    }
    
    return data;
  } catch (e) {
    if (e instanceof ValidationError) throw e;
    throw new ValidationError(`Failed to parse project: ${e.message}`);
  }
}
```


## Desmos Import: Detailed Specifications

### What to Extract (Numeric Only for MVP)

Target structure in `expressions.list`:

```javascript
{
  "type": "expression",
  "id": "322",
  "folderId": "289",           // preserve for round-trip
  "latex": "Z=710",            // THIS is what we want
  "slider": {                  // optional slider metadata
    "min": "100",
    "max": "1000",
    "step": "10"
  }
}
```

**Include**:
- Variable definitions: `Z=710`, `T=1.999`, `q_1=3`, `k_2=1`
- Derived expressions: `k = \log_{l}(T\tau/2) / \log_{l}(\tau)`
- Slider bounds (map to UIControl min/max/step)

**Exclude for MVP** (warn user, but don't import):
- List ranges: `n=[0...Z-1]`
- Graphable expressions: `\sin(n \cdot f) \cdot k_2`
- Complex number operations: `f = k_1 e^{i\tau^k}`
- Color bindings: `colorLatex: "c_1"`
- Parametric/polar domains
- Text notes (type: `"text"`) — preserve in metadata but don't process
- Folders (type: `"folder"`) — preserve structure but no UI in MVP

### Parsing Strategy

```javascript
// DesmosParser.js
export function parseDesmosJSON(jsonString) {
  const data = JSON.parse(jsonString);
  
  const extracted = {
    version: data.version,
    viewport: data.graph?.viewport,
    complexMode: data.graph?.complex === true,
    expressions: [],
    folders: [],
    warnings: []
  };
  
  for (const item of data.expressions.list) {
    if (item.type === 'expression') {
      const parsed = parseExpression(item);
      if (parsed.isNumeric) {
        extracted.expressions.push(parsed);
      } else {
        extracted.warnings.push(`Skipped non-numeric expression: ${item.latex}`);
      }
    } else if (item.type === 'folder') {
      extracted.folders.push({ id: item.id, title: item.title });
    }
  }
  
  return extracted;
}

function parseExpression(item) {
  // Extract variable name and value from latex
  // Example: "Z=710" -> { name: "Z", expression: "710", value: 710 }
  const match = item.latex.match(/^([a-zA-Z_][a-zA-Z0-9_]*)=(.*)$/);
  
  if (!match) {
    return { isNumeric: false, reason: 'Not a definition' };
  }
  
  const [, name, expression] = match;
  
  // Check if expression contains lists, complex, or graphables
  if (expression.includes('[') || expression.includes('...')) {
    return { isNumeric: false, reason: 'Contains list syntax' };
  }
  
  if (expression.includes('i') && expression.match(/e\^{i/)) {
    return { isNumeric: false, reason: 'Complex number expression' };
  }
  
  return {
    isNumeric: true,
    name,
    expression,
    desmosId: item.id,
    folderId: item.folderId,
    slider: item.slider ? {
      min: parseFloat(item.slider.min),
      max: parseFloat(item.slider.max),
      step: parseFloat(item.slider.step) || 1
    } : null
  };
}
```

### Mapping to Internal Parameters

```javascript
// MappingService.js
export function mapDesmosToParameters(extracted, configManager) {
  const defaultMin = configManager.get('parameters.defaults.min');
  const defaultMax = configManager.get('parameters.defaults.max');
  const defaultStep = configManager.get('parameters.defaults.step');
  
  return extracted.expressions.map(expr => ({
    id: generateId(),
    name: expr.name,
    expression: expr.expression,
    value: evaluateExpression(expr.expression), // using math.js
    domain: {
      min: expr.slider?.min ?? defaultMin,
      max: expr.slider?.max ?? defaultMax
    },
    uiControl: {
      type: expr.slider ? 'slider' : 'number',
      min: expr.slider?.min ?? defaultMin,
      max: expr.slider?.max ?? defaultMax,
      step: expr.slider?.step ?? defaultStep
    },
    metadata: {
      source: 'desmos',
      desmosId: expr.desmosId,
      folderId: expr.folderId
    }
  }));
}
```

### Import UI Flow

1. **File Upload**: User selects Desmos JSON file
2. **Parse & Validate**: Extract numeric definitions, collect warnings
3. **Preview Panel**: Show list of parameters to import (with checkboxes)
4. **Warnings Display**: Show what was skipped (lists, complex, graphables)
5. **Confirm Import**: User clicks "Import" button
6. **Apply to Project**: Create parameters, set scene bounds from viewport
7. **Success Message**: "Imported 15 parameters from Desmos"

### Scene Bounds from Viewport

```javascript
// Set scene bounds from graph.viewport
if (extracted.viewport) {
  const sceneBounds = {
    xMin: extracted.viewport.xmin,
    xMax: extracted.viewport.xmax,
    yMin: extracted.viewport.ymin,
    yMax: extracted.viewport.ymax
  };
  
  // Apply to scene config
  sceneConfig.bounds = sceneBounds;
  
  // Fit camera to bounds
  camera.fitToBounds(sceneBounds);
}
```

### Validation Rules

From `config/validation-rules.json`:

```json
{
  "parameters": {
    "name": {
      "pattern": "^[a-zA-Z_][a-zA-Z0-9_]*$",
      "maxLength": 50
    },
    "expression": {
      "maxLength": 500,
      "forbiddenPatterns": [
        "while\\s*\\(",
        "for\\s*\\(",
        "eval\\s*\\("
      ]
    },
    "domain": {
      "minRange": 0.0001,
      "maxRange": 1000000,
      "singularityWarningThreshold": 0.001
    }
  }
}
```

## Implementation Order & Dependencies

Build in this order to minimize rework:

### Step 1: Configuration Foundation
**Dependency**: None  
**Output**: Working config system, preset loading, validation

Build:
- `ConfigManager` with load/validate/get/set
- JSON schema validation
- Default config files (grid styles, easing curves, etc.)
- `SettingsPanel` UI component

Test:
- Load config from disk
- Get nested values with dot notation
- Validate against schemas
- Hot-reload in dev mode

### Step 2: Expression Engine
**Dependency**: Configuration system  
**Output**: Parameter evaluation with dependency resolution

Build:
- `ExpressionEngine` using math.js
- `ParameterManager` (CRUD operations)
- `DependencyGraph` (track which params depend on others)
- `Validator` (domain checks, singularity warnings)

Test:
- Parse simple expressions: `Z=710`, `k=2*Z`
- Resolve dependencies: changing `Z` updates `k`
- Catch errors: division by zero, undefined variables
- Validate domains from config rules

### Step 3: Scene & Viewport
**Dependency**: Configuration system  
**Output**: Real-time 2D canvas rendering with configurable grid

Build:
- `Space` (bounds, space type)
- `Grid` (rendering logic, style from config)
- `Camera` (pan/zoom, state management)
- `Viewport` (canvas wrapper, render loop)

Test:
- Render grid with style from config preset
- Pan/zoom smoothly (60fps)
- Toggle grid visibility
- Switch grid styles at runtime

### Step 4: Parameter UI
**Dependency**: Expression engine, scene/viewport  
**Output**: Interactive parameter controls with live updates

Build:
- `ParameterPanel` (list view, add/edit/delete)
- Parameter controls (slider, number input, stepper)
- Expression validation UI (error messages)
- Real-time parameter updates → viewport refresh

Test:
- Create parameter, see it in panel
- Drag slider, viewport updates immediately
- Edit expression, see validation errors
- Delete parameter, dependent params show errors

### Step 5: Keyframes & Timeline
**Dependency**: Parameter system, scene  
**Output**: Keyframe system with smooth interpolation

Build:
- `KeyframeManager` (CRUD operations)
- `TweeningEngine` (interpolation logic)
- `EasingRegistry` (load from config)
- `TimelineView` UI (scrubber, keyframe markers)
- `PlaybackController` (play/pause/scrub)

Test:
- Create 3 keyframes with different param values
- Scrub timeline, see smooth interpolation
- Change easing curve, see different motion
- Include/exclude params from tweening

### Step 6: Desmos Import
**Dependency**: Parameter system  
**Output**: Import numeric definitions from Desmos JSON

Build:
- `DesmosParser` (extract numeric expressions)
- `NumericExtractor` (filter out lists/complex/graphables)
- `MappingService` (convert to internal Parameter format)
- Import UI (file upload, preview, confirm)

Test:
- Import Desmos JSON with mixed content
- See only numeric defs extracted
- Warnings for skipped expressions
- Parameters appear in panel correctly

### Step 7: Warp System
**Dependency**: Scene/viewport  
**Output**: Space transformation with configurable warps

Build:
- `WarpRegistry` (load from config)
- Identity warp (no-op)
- Radial distortion warp (configurable intensity)
- Warp UI (selector, parameter controls)
- Apply warp to grid rendering

Test:
- Select warp from dropdown
- Adjust warp parameters, see immediate effect
- Toggle warp on/off
- Include warp in keyframes

### Step 8: Export & Rendering
**Dependency**: All previous  
**Output**: PNG export and Manim animation export

Build:
- `ManimGenerator` (create Python script from state)
- `TemplateEngine` (fill Manim template)
- `SubprocessRunner` (execute Manim, capture output)
- `ExportDialog` UI (resolution, fps, quality settings)
- PNG export from canvas

Test:
- Export current frame as PNG
- Generate Manim script (validate syntax)
- Execute Manim, get MP4 output
- Handle Manim errors gracefully

### Step 9: Project Save/Load
**Dependency**: All systems  
**Output**: Persistent project files

Build:
- `ProjectIO` (serialize/deserialize project state)
- Project file schema validation
- Save/load UI (file picker, recent projects)
- Deterministic reproduction

Test:
- Save project with all features used
- Close and reopen
- State matches exactly (params, keyframes, camera, styles)
- Load corrupted project → clear error message

### Step 10: Testing & Polish
**Dependency**: All previous  
**Output**: Stable, performant, user-friendly application

- Write unit tests for critical paths
- Profile performance (fps, latency)
- Fix edge cases and bugs
- Polish UI/UX (loading states, error messages, tooltips)
- Documentation (README, user guide)

## Example Data Structures (Reference)

### Parameter Object
```javascript
{
  id: "param-001",
  name: "Z",
  expression: "710",
  value: 710,
  domain: { min: 1, max: 9999 },
  uiControl: {
    type: "slider",
    min: 100,
    max: 1000,
    step: 10
  },
  metadata: {
    source: "desmos",
    desmosId: "322",
    folderId: "289"
  }
}
```

### Keyframe Object
```javascript
{
  id: "kf-001",
  time: 0,
  label: "Initial State",
  snapshot: {
    parameters: {
      "param-001": { value: 710, include: true, easing: "smoothstep" },
      "param-002": { value: 2.0, include: true, easing: "linear" },
      "param-003": { value: 1.5, include: false }
    },
    camera: {
      x: 0,
      y: 0,
      zoom: 1,
      rotation: 0,
      include: true
    },
    warp: {
      type: "identity",
      parameters: {},
      include: false
    }
  }
}
```

### Project File Structure
```javascript
{
  version: "1.0.0",
  metadata: {
    name: "My Animation",
    created: "2025-10-03T10:00:00Z",
    modified: "2025-10-03T12:30:00Z"
  },
  parameters: [ /* array of Parameter objects */ ],
  keyframes: [ /* array of Keyframe objects */ ],
  timeline: {
    duration: 10.0,
    fps: 60,
    loopMode: "once"
  },
  scene: {
    spaceType: "cartesian",
    bounds: { xMin: -10, xMax: 10, yMin: -10, yMax: 10 },
    gridStyleId: "cartesian-dark",
    camera: { x: 0, y: 0, zoom: 1, rotation: 0 },
    warp: { type: "identity", parameters: {} }
  },
  rendering: {
    resolution: "1920x1080",
    fps: 30,
    quality: "high"
  }
}
```

## Tweening Logic (Reference Implementation)

```javascript
// TweeningEngine.js
export class TweeningEngine {
  constructor(easingRegistry) {
    this.easingRegistry = easingRegistry;
  }
  
  /**
   * Get the interpolated value at a specific time.
   * @param {number} currentTime - Current timeline position
   * @param {Keyframe[]} keyframes - Sorted array of keyframes
   * @param {string} paramId - Parameter ID to interpolate
   * @returns {number} Interpolated value
   */
  getValueAtTime(currentTime, keyframes, paramId) {
    // Find surrounding keyframes
    const before = this.findKeyframeBefore(currentTime, keyframes);
    const after = this.findKeyframeAfter(currentTime, keyframes);
    
    // Edge cases
    if (!before && !after) return null;
    if (!before) return after.snapshot.parameters[paramId]?.value;
    if (!after) return before.snapshot.parameters[paramId]?.value;
    
    const paramBefore = before.snapshot.parameters[paramId];
    const paramAfter = after.snapshot.parameters[paramId];
    
    // If parameter not included in tweening, hold previous value
    if (!paramBefore?.include) return paramBefore?.value;
    
    // Calculate normalized time [0, 1]
    const t = (currentTime - before.time) / (after.time - before.time);
    
    // Apply easing
    const easingId = paramBefore.easing || 'linear';
    const easingFn = this.easingRegistry.get(easingId);
    const easedT = easingFn(t);
    
    // Interpolate
    return lerp(easedT, paramBefore.value, paramAfter.value);
  }
  
  findKeyframeBefore(time, keyframes) {
    return keyframes
      .filter(kf => kf.time <= time)
      .sort((a, b) => b.time - a.time)[0];
  }
  
  findKeyframeAfter(time, keyframes) {
    return keyframes
      .filter(kf => kf.time > time)
      .sort((a, b) => a.time - b.time)[0];
  }
}

// Utility
function lerp(t, a, b) {
  return a + (b - a) * t;
}
```

## Manim Export Strategy

### Template Structure

```python
# Generated Manim script
from manim import *

class ParametricScene(Scene):
    def construct(self):
        # Configuration from project
        x_range = [{{xMin}}, {{xMax}}, {{xStep}}]
        y_range = [{{yMin}}, {{yMax}}, {{yStep}}]
        
        # Set up axes
        axes = Axes(
            x_range=x_range,
            y_range=y_range,
            axis_config={
                "color": "{{axesColor}}",
                "stroke_width": {{axesWidth}},
            }
        )
        self.add(axes)
        
        # For each keyframe transition:
        {{#keyframeTransitions}}
        # Transition from keyframe {{fromIndex}} to {{toIndex}}
        # Duration: {{duration}}s
        
        # Parameter animations
        {{#parameters}}
        self.play(
            # Animate parameter {{name}} from {{startValue}} to {{endValue}}
            # Using {{easing}} easing
            UpdateFromAlphaFunc(
                ValueTracker({{startValue}}),
                lambda m, alpha: m.set_value(
                    {{startValue}} + ({{endValue}} - {{startValue}}) * {{easingFunction}}(alpha)
                ),
                rate_func=linear  # Our easing is already applied
            ),
            run_time={{duration}}
        )
        {{/parameters}}
        
        # Camera animations (if included)
        {{#cameraAnimations}}
        self.play(
            self.camera.frame.animate.move_to([{{targetX}}, {{targetY}}, 0]),
            self.camera.frame.animate.set(width={{targetZoom}}),
            run_time={{duration}},
            rate_func={{rateFunc}}
        )
        {{/cameraAnimations}}
        
        {{/keyframeTransitions}}
        
        self.wait(1)  # Final hold
```

### Mapping Easing to Manim Rate Functions

```javascript
const easingToManimMap = {
  'linear': 'linear',
  'smoothstep': 'smooth',
  'ease-in': 'ease_in_cubic',
  'ease-out': 'ease_out_cubic',
  'ease-in-out': 'ease_in_out_cubic'
};
```

## Performance Optimization Strategies

### 1. Expression Caching

```javascript
class ExpressionCache {
  constructor(maxSize = 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }
  
  get(expression, context) {
    const key = this.makeKey(expression, context);
    return this.cache.get(key);
  }
  
  set(expression, context, value) {
    const key = this.makeKey(expression, context);
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
  
  invalidate(paramId) {
    // Remove all cached values that depend on paramId
    for (const [key, _] of this.cache) {
      if (key.includes(paramId)) {
        this.cache.delete(key);
      }
    }
  }
  
  makeKey(expression, context) {
    return `${expression}::${JSON.stringify(context)}`;
  }
}
```

### 2. Viewport Throttling

```javascript
// Debounce expensive operations
import { debounce } from './utils/performance';

class Viewport {
  constructor(canvas, config) {
    this.canvas = canvas;
    this.config = config;
    
    // Get debounce delay from config
    const debounceMs = config.get('performance.debounceMs') || 16;
    
    this.debouncedRender = debounce(
      () => this.render(),
      debounceMs
    );
  }
  
  onParameterChange() {
    // Use debounced render for slider updates
    this.debouncedRender();
  }
  
  onTimelineScr

ub() {
    // Don't debounce scrubbing - needs immediate feedback
    requestAnimationFrame(() => this.render());
  }
}
```

### 3. Progressive Rendering

```javascript
class Viewport {
  render() {
    const quality = this.isIdle() ? 'high' : 'draft';
    
    if (quality === 'draft') {
      this.renderDraft();  // Lower resolution, fewer samples
    } else {
      this.renderHighQuality();  // Full resolution
    }
  }
  
  isIdle() {
    const idleThreshold = this.config.get('performance.idleThresholdMs') || 500;
    return Date.now() - this.lastInteraction > idleThreshold;
  }
}
```

## Common Pitfalls & Anti-Patterns

### ❌ Anti-Pattern 1: Hard-Coded Constants

```javascript
// ❌ BAD
const DEFAULT_ZOOM = 1.0;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 10.0;
const ZOOM_SPEED = 0.1;

// ✅ GOOD
const DEFAULT_ZOOM = config.get('camera.zoomDefault');
const MIN_ZOOM = config.get('camera.zoomMin');
const MAX_ZOOM = config.get('camera.zoomMax');
const ZOOM_SPEED = config.get('camera.zoomSpeed');
```

### ❌ Anti-Pattern 2: Tight Coupling

```javascript
// ❌ BAD: Viewport directly accesses parameter values
class Viewport {
  render() {
    const Z = window.app.parameters.find(p => p.name === 'Z').value;
    // ...
  }
}

// ✅ GOOD: Pass evaluated state as props
class Viewport {
  render(evaluatedState) {
    const Z = evaluatedState.parameters.Z;
    // ...
  }
}
```

### ❌ Anti-Pattern 3: Mutating Props

```javascript
// ❌ BAD
function updateParameter(param) {
  param.value = newValue;  // Mutating input
  return param;
}

// ✅ GOOD
function updateParameter(param, newValue) {
  return { ...param, value: newValue };  // Return new object
}
```

### ❌ Anti-Pattern 4: Ignoring Error States

```javascript
// ❌ BAD
const value = evaluateExpression(expr);  // Might throw

// ✅ GOOD
const result = evaluateExpression(expr);
if (!result.success) {
  showError(result.error);
  return;
}
const value = result.value;
```

### ❌ Anti-Pattern 5: Over-Engineering

```javascript
// ❌ BAD: Complex abstraction for simple case
class ParameterFactory {
  static createBuilder() {
    return new ParameterBuilder(new ValidationStrategy(...));
  }
}

// ✅ GOOD: Simple function for MVP
function createParameter(name, expression, config) {
  return {
    id: generateId(),
    name,
    expression,
    value: evaluate(expression),
    ...getDefaults(config)
  };
}
```

## Testing Strategy

### Unit Tests (Priority Order)

1. **Expression Engine** (CRITICAL)
   - Parse valid expressions
   - Evaluate with variable substitution
   - Handle errors gracefully
   - Resolve dependencies correctly

2. **Tweening Logic** (CRITICAL)
   - Linear interpolation
   - Easing functions
   - Edge cases (no keyframes, single keyframe, out of range)

3. **Config Manager**
   - Load configs from disk
   - Validate against schemas
   - Merge priority (project > user > defaults)
   - Handle missing config files

4. **Desmos Parser**
   - Extract numeric definitions
   - Skip non-numeric expressions
   - Parse slider metadata
   - Handle malformed JSON

### Integration Tests

1. **Save/Load Roundtrip**
   - Create project with all features
   - Save to JSON
   - Load from JSON
   - Verify state matches exactly

2. **Parameter Dependencies**
   - Define `k = 2 * Z`
   - Change `Z`
   - Verify `k` updates automatically

3. **Keyframe Interpolation**
   - Create 3 keyframes
   - Scrub timeline
   - Verify smooth interpolation
   - Check different easing curves

4. **Desmos Import Flow**
   - Load Desmos JSON
   - Verify parameter count
   - Check warnings for skipped items
   - Validate scene bounds

### Manual Testing Checklist

- [ ] Create blank project, define 3 parameters
- [ ] Drag sliders, viewport updates immediately
- [ ] Create 3 keyframes, scrub timeline smoothly
- [ ] Load Desmos JSON, parameters populate
- [ ] Export PNG, file matches viewport
- [ ] Export MP4, animation plays correctly
- [ ] Save project, reload, state identical
- [ ] Change grid style preset, see immediate effect
- [ ] Switch easing curve, see different motion
- [ ] Test with invalid expressions, see error messages

## Success Criteria for MVP

The MVP is complete when ALL of these work flawlessly:

### Core Functionality
- ✅ Create scene from scratch without Desmos JSON
- ✅ Define ≥ 5 parameters with expressions and dependencies
- ✅ Real-time viewport updates while dragging sliders (60fps)
- ✅ Import Desmos JSON, extract only numeric definitions
- ✅ Create ≥ 3 keyframes with different parameter values
- ✅ Scrub timeline, see smooth interpolation
- ✅ Export PNG that matches viewport exactly
- ✅ Export MP4 via Manim that matches previewed motion
- ✅ Save project, close app, reopen, get identical state

### Configuration System
- ✅ Load all presets from config directory
- ✅ Switch grid style preset, see immediate change
- ✅ Edit config value in UI, save as new preset
- ✅ Import external preset file
- ✅ Reset to defaults

### Error Handling
- ✅ Invalid expression shows error, doesn't crash
- ✅ Missing config file loads defaults, warns user
- ✅ Malformed project JSON shows clear error message
- ✅ Manim errors display stdout/stderr in dialog

### Performance
- ✅ Viewport renders at ≥ 60fps while scrubbing
- ✅ Parameter updates reflect within 16ms
- ✅ No lag when dragging sliders
- ✅ Project saves/loads in < 2 seconds

### Code Quality
- ✅ Zero hard-coded constants (all in config)
- ✅ No duplicated logic (DRY principle)
- ✅ All public APIs documented with JSDoc
- ✅ Unit tests pass for critical systems
- ✅ No console errors in production mode

## Documentation Requirements

### README.md
- Project overview
- Installation instructions
- Quick start guide
- Tech stack
- License

### USER_GUIDE.md
- Creating parameters
- Using the timeline
- Importing from Desmos
- Exporting animations
- Configuration system
- Keyboard shortcuts

### DEVELOPER.md
- Architecture overview
- Configuration system
- Adding new warps
- Adding new easing curves
- Testing strategy
- Contribution guidelines

### CONFIG_REFERENCE.md
- All config file formats
- Schema documentation
- Example presets
- Validation rules

## Final Checklist Before Deployment

- [ ] All MVP features implemented and tested
- [ ] No hard-coded values (everything in config)
- [ ] Error handling for all user actions
- [ ] Performance targets met (60fps, <16ms latency)
- [ ] Unit tests pass for core systems
- [ ] Integration tests pass
- [ ] Manual testing checklist complete
- [ ] Documentation written (README, USER_GUIDE, DEVELOPER)
- [ ] Config examples provided
- [ ] Manim integration tested on target platforms
- [ ] Project files validate against schema
- [ ] No console errors or warnings

---

## Quick Reference: Decision Tree

```
User requests feature
    │
    ├─ Is it in MVP scope?
    │   ├─ YES → Check if config exists
    │   │         ├─ Config exists → Implement using config
    │   │         └─ Config missing → Create config first, then implement
    │   └─ NO → Politely decline, suggest focusing on MVP
    │
    ├─ Does similar logic exist?
    │   ├─ YES → Refactor to DRY, then use
    │   └─ NO → Implement, but make it reusable
    │
    ├─ Does it need to be configurable?
    │   ├─ YES (is it a constant/style/behavior?) → Add to config
    │   └─ NO (is it truly implementation detail?) → OK to hard-code
    │
    └─ Test it
        ├─ Unit test if core logic
        ├─ Integration test if multi-system
        └─ Manual test for UX
```

## Phase 2 Implementation Guide (CURRENT)

**Status**: Ready to begin after Phase 1 completion

### Implementation Order for Phase 2

1. **Create Scene Type Definitions** (`src/scene/types.ts`)
   - `SceneConfig` interface (spaceType, bounds, gridStyleId)
   - `CameraState` interface (x, y, zoom, rotation)
   - `Point2D`, `Bounds2D` types

2. **Build Camera Class** (`src/scene/Camera.ts`)
   - State: position (x, y), zoom, rotation
   - Methods: `pan(dx, dy)`, `zoom(factor)`, `reset()`, `fitToBounds()`
   - Use config values: `camera.panSpeed`, `camera.zoomSpeed`, `camera.zoomMin/Max`
   - Serialize/deserialize for save/load

3. **Build Space Class** (`src/scene/Space.ts`)
   - Cartesian coordinate system (Polar in later phase)
   - Bounds calculation from config
   - World-to-screen coordinate transformation
   - Screen-to-world coordinate transformation (for mouse interactions)

4. **Build Grid Renderer** (`src/scene/Grid.ts`)
   - Load GridStyleConfig from ConfigManager
   - Render major grid lines
   - Render minor grid lines
   - Render axes with arrows
   - Render labels with configurable precision
   - Apply background color

5. **Build Viewport Component** (`src/scene/Viewport.tsx`)
   - Canvas element with React ref
   - Render loop using `requestAnimationFrame`
   - Mouse event handlers (drag to pan, wheel to zoom)
   - FPS counter (toggle from `userSettings.viewport.showFps`)
   - Draft/high quality mode switching

6. **Integrate into App** (`src/App.tsx`)
   - Replace demo section with Viewport component
   - Add camera controls UI (reset, bookmarks)
   - Add space configuration (bounds, grid style selector)
   - Performance metrics display

### Data Structures for Phase 2

```typescript
// src/scene/types.ts
export interface SceneConfig {
  spaceType: 'cartesian' | 'polar';
  bounds: {
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
  };
  gridStyleId: string;
  allQuadrants: boolean;
}

export interface CameraState {
  x: number;
  y: number;
  zoom: number;
  rotation: number; // degrees, 0 for MVP
}

export interface Point2D {
  x: number;
  y: number;
}

export interface Bounds2D {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}
```

### Configuration Needed (Already Exists!)

✅ Grid styles loaded from `public/config/presets/grid-styles/`
✅ Camera settings in `public/config/defaults.json`
✅ Performance settings (debounce, FPS) in config

### Success Criteria for Phase 2

- [ ] Grid renders with correct style from config
- [ ] Mouse drag pans the camera smoothly
- [ ] Mouse wheel zooms in/out with limits from config
- [ ] Grid style can be switched live from UI
- [ ] FPS counter shows ≥60fps during idle
- [ ] Performance remains smooth (no jank) during pan/zoom
- [ ] Camera state can be reset to default
- [ ] All grid elements respect visibility toggles

---

## Getting Started Immediately (ARCHIVE - Phase 1 Complete)

~~1. **Choose tech stack** (ask user if not specified)~~ ✅ Done: React + TypeScript + Vite
~~2. **Initialize project** (React/Svelte + Canvas + math.js)~~ ✅ Done
~~3. **Create config directory** structure with default JSONs~~ ✅ Done: 22+ files
~~4. **Build ConfigManager** first (load, validate, get, set)~~ ✅ Done

**NEXT (Phase 2)**:
5. **Build Expression Engine** (parse, evaluate, dependencies) - Phase 3
6. **Implement Scene + Viewport** (grid rendering, camera) - **START HERE**
7. **Build Parameter UI** (CRUD, controls, real-time updates) - Phase 3
8. **Add Keyframes + Timeline** (storage, tweening, playback) - Phase 5
9. **Implement Desmos Import** (parse, extract, map) - Phase 4
10. **Add Warp System** (registry, identity + one warp) - Phase 6
11. **Integrate Manim Export** (template, subprocess) - Phase 7
12. **Build Project Save/Load** (serialize, validate) - Phase 8

---

**Remember**: Configuration first, DRY always, real-time performance non-negotiable.

When in doubt, ask: "Is this configurable? Is this reusable? Does this perform well?"

If YES to all three, proceed. If NO to any, refactor first.
