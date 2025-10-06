# Configuration Reference

Complete reference for all configuration files in Parametric Keyframe Studio.

## Table of Contents

1. [Configuration System Overview](#configuration-system-overview)
2. [Default Configuration](#default-configuration)
3. [Preset Categories](#preset-categories)
   - [Grid Styles](#grid-styles)
   - [Color Schemes](#color-schemes)
   - [Easing Curves](#easing-curves)
   - [Warps](#warps)
4. [User Settings](#user-settings)
5. [Creating Custom Presets](#creating-custom-presets)
6. [Configuration Schema](#configuration-schema)

---

## Configuration System Overview

All visual styles, behaviors, and defaults in Parametric Keyframe Studio are defined in JSON configuration files located in `public/config/`. This enables:

- **Zero hard-coded values** - Everything is configurable
- **Live preset switching** - Change styles without restarting
- **User customization** - Create and save custom presets
- **Deterministic reproduction** - Same config = same output

### Directory Structure

```
public/config/
├── defaults.json                    # System-wide defaults
├── presets/
│   ├── grid-styles/                # Grid rendering styles
│   │   ├── cartesian-dark.json
│   │   ├── cartesian-light.json
│   │   ├── polar-dark.json
│   │   └── polar-light.json
│   ├── color-schemes/              # Color palettes
│   │   ├── scientific.json
│   │   ├── vibrant.json
│   │   └── monochrome.json
│   ├── easing-curves/              # Animation easing functions
│   │   ├── linear.json
│   │   ├── smoothstep.json
│   │   ├── ease-in.json
│   │   ├── ease-out.json
│   │   └── ease-in-out.json
│   └── warps/                      # Space transformation functions
│       ├── identity.json
│       └── radial.json
└── user-settings.json              # User preferences (auto-saved)
```

---

## Default Configuration

**File**: [`public/config/defaults.json`](public/config/defaults.json)

System-wide default values loaded at startup. Used as fallbacks when specific configs are missing.

### Structure

```json
{
  "parameters": {
    "defaults": {
      "min": -10,
      "max": 10,
      "step": 0.1
    }
  },
  "camera": {
    "panSpeed": 1.0,
    "zoomSpeed": 0.1,
    "zoomMin": 0.1,
    "zoomMax": 10.0,
    "zoomDefault": 1.0
  },
  "timeline": {
    "defaultDuration": 10,
    "snapThreshold": 0.1,
    "playbackSpeed": 1.0,
    "loopMode": "once"
  },
  "viewport": {
    "defaultWidth": 800,
    "defaultHeight": 600,
    "backgroundColor": "#000000"
  },
  "export": {
    "defaultResolution": "1920x1080",
    "defaultFps": 30,
    "defaultQuality": "medium"
  }
}
```

### Key Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `parameters.defaults.min` | number | -10 | Default parameter minimum |
| `parameters.defaults.max` | number | 10 | Default parameter maximum |
| `parameters.defaults.step` | number | 0.1 | Default parameter step size |
| `camera.panSpeed` | number | 1.0 | Camera pan sensitivity |
| `camera.zoomSpeed` | number | 0.1 | Camera zoom sensitivity |
| `camera.zoomMin` | number | 0.1 | Minimum zoom level |
| `camera.zoomMax` | number | 10.0 | Maximum zoom level |
| `timeline.defaultDuration` | number | 10 | Default timeline length (seconds) |
| `timeline.snapThreshold` | number | 0.1 | Snap-to-keyframe distance |
| `export.defaultResolution` | string | "1920x1080" | Default export resolution |
| `export.defaultFps` | number | 30 | Default export frame rate |

---

## Preset Categories

### Grid Styles

**Location**: `public/config/presets/grid-styles/`

Defines the visual appearance of the coordinate grid, axes, and labels.

#### cartesian-dark.json

High-contrast grid for dark backgrounds (presentations, video).

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

#### cartesian-light.json

Clean grid for light backgrounds (documents, papers).

```json
{
  "id": "cartesian-light",
  "name": "Light Cartesian",
  "description": "Clean style for documents",
  "axes": {
    "color": "#000000",
    "width": 2,
    "showArrows": true,
    "arrowSize": 10
  },
  "majorGrid": {
    "color": "#CCCCCC",
    "width": 1,
    "spacing": 1.0,
    "visible": true
  },
  "minorGrid": {
    "color": "#E0E0E0",
    "width": 0.5,
    "spacing": 0.2,
    "visible": true
  },
  "labels": {
    "show": true,
    "color": "#333333",
    "fontSize": 12,
    "fontFamily": "sans-serif",
    "precision": 2
  },
  "background": "#FFFFFF"
}
```

#### polar-dark.json

Polar coordinate system (radial grid).

```json
{
  "id": "polar-dark",
  "name": "Dark Polar",
  "description": "Polar coordinates for dark backgrounds",
  "axes": {
    "color": "#FFFFFF",
    "width": 2,
    "showArrows": false,
    "arrowSize": 0
  },
  "majorGrid": {
    "color": "#444444",
    "width": 1,
    "spacing": 1.0,
    "visible": true,
    "radial": true,
    "angleSpacing": 30
  },
  "minorGrid": {
    "color": "#2A2A2A",
    "width": 0.5,
    "spacing": 0.5,
    "visible": true,
    "radial": true,
    "angleSpacing": 15
  },
  "labels": {
    "show": true,
    "color": "#CCCCCC",
    "fontSize": 12,
    "fontFamily": "monospace",
    "precision": 1,
    "angleLabels": true
  },
  "background": "#000000"
}
```

#### Grid Style Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier |
| `name` | string | Yes | Display name |
| `description` | string | No | Brief description |
| `axes.color` | string | Yes | Hex color for axes |
| `axes.width` | number | Yes | Line width (px) |
| `axes.showArrows` | boolean | Yes | Show arrowheads |
| `axes.arrowSize` | number | If arrows | Arrow size (px) |
| `majorGrid.color` | string | Yes | Major grid line color |
| `majorGrid.width` | number | Yes | Line width (px) |
| `majorGrid.spacing` | number | Yes | Grid spacing (units) |
| `majorGrid.visible` | boolean | Yes | Show/hide major grid |
| `minorGrid.color` | string | Yes | Minor grid line color |
| `minorGrid.width` | number | Yes | Line width (px) |
| `minorGrid.spacing` | number | Yes | Grid spacing (units) |
| `minorGrid.visible` | boolean | Yes | Show/hide minor grid |
| `labels.show` | boolean | Yes | Show axis labels |
| `labels.color` | string | If shown | Label text color |
| `labels.fontSize` | number | If shown | Font size (px) |
| `labels.fontFamily` | string | If shown | Font family |
| `labels.precision` | number | If shown | Decimal places |
| `background` | string | Yes | Background color |

---

### Color Schemes

**Location**: `public/config/presets/color-schemes/`

Color palettes for functions, parameters, and UI elements.

#### scientific.json

Classic scientific/academic colors.

```json
{
  "id": "scientific",
  "name": "Scientific",
  "description": "Classic academic palette",
  "primary": "#0066CC",
  "secondary": "#CC3333",
  "accent": "#00AA66",
  "functionColors": [
    "#FF6B35",
    "#004E89",
    "#1AE5BE",
    "#FCAB10",
    "#F71735"
  ],
  "parameterColor": "#888888",
  "highlightColor": "#FFD700"
}
```

#### vibrant.json

Bright, high-contrast colors for presentations.

```json
{
  "id": "vibrant",
  "name": "Vibrant",
  "description": "High contrast for presentations",
  "primary": "#FF2D55",
  "secondary": "#5E5CE6",
  "accent": "#32D74B",
  "functionColors": [
    "#FF453A",
    "#FF9F0A",
    "#FFD60A",
    "#32D74B",
    "#64D2FF",
    "#BF5AF2"
  ],
  "parameterColor": "#98989D",
  "highlightColor": "#FFD60A"
}
```

#### monochrome.json

Grayscale palette for printing/accessibility.

```json
{
  "id": "monochrome",
  "name": "Monochrome",
  "description": "Grayscale for printing",
  "primary": "#000000",
  "secondary": "#666666",
  "accent": "#333333",
  "functionColors": [
    "#000000",
    "#2D2D2D",
    "#5A5A5A",
    "#878787",
    "#B4B4B4"
  ],
  "parameterColor": "#999999",
  "highlightColor": "#000000"
}
```

#### Color Scheme Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier |
| `name` | string | Yes | Display name |
| `description` | string | No | Brief description |
| `primary` | string | Yes | Primary UI color |
| `secondary` | string | Yes | Secondary UI color |
| `accent` | string | Yes | Accent/highlight color |
| `functionColors` | string[] | Yes | Array of function colors |
| `parameterColor` | string | Yes | Default parameter color |
| `highlightColor` | string | Yes | Selection highlight |

---

### Easing Curves

**Location**: `public/config/presets/easing-curves/`

Animation interpolation functions (easing curves).

#### linear.json

Constant velocity interpolation.

```json
{
  "id": "linear",
  "name": "Linear",
  "description": "Constant speed",
  "type": "function",
  "formula": "t",
  "mathjs": "t"
}
```

#### smoothstep.json

Smooth acceleration and deceleration (cubic).

```json
{
  "id": "smoothstep",
  "name": "Smooth Step",
  "description": "Smooth ease in and out",
  "type": "function",
  "formula": "t * t * (3 - 2 * t)",
  "mathjs": "t * t * (3 - 2 * t)"
}
```

#### ease-in.json

Slow start, fast end (cubic).

```json
{
  "id": "ease-in",
  "name": "Ease In",
  "description": "Slow start, fast end",
  "type": "function",
  "formula": "t^3",
  "mathjs": "t^3"
}
```

#### ease-out.json

Fast start, slow end (cubic).

```json
{
  "id": "ease-out",
  "name": "Ease Out",
  "description": "Fast start, slow end",
  "type": "function",
  "formula": "1 - (1 - t)^3",
  "mathjs": "1 - (1 - t)^3"
}
```

#### ease-in-out.json

Slow start and end, fast middle.

```json
{
  "id": "ease-in-out",
  "name": "Ease In-Out",
  "description": "Slow start and end",
  "type": "function",
  "formula": "t < 0.5 ? 4 * t^3 : 1 - (-2 * t + 2)^3 / 2",
  "mathjs": "t < 0.5 ? 4 * t^3 : 1 - (-2 * t + 2)^3 / 2"
}
```

#### Easing Curve Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier |
| `name` | string | Yes | Display name |
| `description` | string | No | Brief description |
| `type` | string | Yes | "function" or "bezier" |
| `formula` | string | If function | Mathematical formula |
| `mathjs` | string | If function | Math.js expression |
| `controlPoints` | number[] | If bezier | Bezier control points |

**Creating Custom Easing Curves:**

The `mathjs` field accepts any valid math.js expression where `t` is the normalized time [0, 1]:
- Linear: `"t"`
- Quadratic: `"t^2"`
- Cubic: `"t^3"`
- Sine: `"sin(t * pi / 2)"`
- Custom: `"t < 0.3 ? t / 0.3 : (t - 0.3) / 0.7"`

---

### Warps

**Location**: `public/config/presets/warps/`

Space transformation functions that distort the coordinate grid.

#### identity.json

No transformation (pass-through).

```json
{
  "id": "identity",
  "name": "Identity",
  "description": "No transformation",
  "type": "identity",
  "formula": "(x, y) => (x, y)"
}
```

#### radial.json

Radial distortion (magnification/shrinking from origin).

```json
{
  "id": "radial",
  "name": "Radial Distortion",
  "description": "Radial magnification/shrinking",
  "type": "radial",
  "formula": "(x, y, intensity) => { const r = sqrt(x^2 + y^2); const scale = 1 + intensity * r; return (x * scale, y * scale); }",
  "parameters": {
    "intensity": {
      "default": 0.1,
      "min": -1.0,
      "max": 1.0,
      "step": 0.05,
      "description": "Distortion strength (negative = shrink, positive = magnify)"
    }
  }
}
```

#### Warp Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier |
| `name` | string | Yes | Display name |
| `description` | string | No | Brief description |
| `type` | string | Yes | "identity", "radial", "custom" |
| `formula` | string | Yes | Transformation function |
| `parameters` | object | No | Configurable parameters |

**Warp Parameters:**

Each warp can have configurable parameters:

```json
"parameters": {
  "paramName": {
    "default": 0.5,
    "min": 0.0,
    "max": 1.0,
    "step": 0.1,
    "description": "Parameter description"
  }
}
```

---

## User Settings

**File**: `public/config/user-settings.json`

User preferences, auto-saved when changed in the UI.

### Structure

```json
{
  "viewport": {
    "showGrid": true,
    "showAxes": true,
    "showLabels": true,
    "showFps": false,
    "antialiasing": true
  },
  "timeline": {
    "snapToKeyframes": true,
    "showTimecodes": true,
    "waveformHeight": 60
  },
  "parameters": {
    "showValues": true,
    "showExpressions": true,
    "groupByFolder": false
  },
  "export": {
    "lastResolution": "1920x1080",
    "lastFps": 30,
    "lastQuality": "medium",
    "lastFormat": "mp4"
  },
  "ui": {
    "theme": "dark",
    "fontSize": 14,
    "sidebarWidth": 300,
    "timelineHeight": 150
  },
  "recentProjects": [
    "/path/to/project1.pkstudio",
    "/path/to/project2.pkstudio"
  ],
  "performance": {
    "maxFps": 60,
    "enableGpuAcceleration": true,
    "lowPowerMode": false
  }
}
```

### User Settings Schema

| Category | Setting | Type | Default | Description |
|----------|---------|------|---------|-------------|
| **Viewport** | `showGrid` | boolean | true | Show coordinate grid |
| | `showAxes` | boolean | true | Show X/Y axes |
| | `showLabels` | boolean | true | Show axis labels |
| | `showFps` | boolean | false | Show FPS counter |
| | `antialiasing` | boolean | true | Enable antialiasing |
| **Timeline** | `snapToKeyframes` | boolean | true | Snap playhead to keyframes |
| | `showTimecodes` | boolean | true | Show time labels |
| | `waveformHeight` | number | 60 | Timeline height (px) |
| **Parameters** | `showValues` | boolean | true | Show current values |
| | `showExpressions` | boolean | true | Show expressions |
| | `groupByFolder` | boolean | false | Group by folder |
| **Export** | `lastResolution` | string | "1920x1080" | Last used resolution |
| | `lastFps` | number | 30 | Last used frame rate |
| | `lastQuality` | string | "medium" | Last used quality |
| **UI** | `theme` | string | "dark" | UI theme |
| | `fontSize` | number | 14 | Base font size |
| | `sidebarWidth` | number | 300 | Sidebar width (px) |
| | `timelineHeight` | number | 150 | Timeline height (px) |
| **Performance** | `maxFps` | number | 60 | Target frame rate |
| | `enableGpuAcceleration` | boolean | true | Use GPU rendering |
| | `lowPowerMode` | boolean | false | Reduce performance |

---

## Creating Custom Presets

### Step 1: Copy Existing Preset

Copy a preset from the appropriate category:

```bash
cp public/config/presets/grid-styles/cartesian-dark.json \
   public/config/presets/grid-styles/my-custom-grid.json
```

### Step 2: Edit Configuration

Modify the JSON file:

```json
{
  "id": "my-custom-grid",        // ⚠️ Must be unique!
  "name": "My Custom Grid",       // Display name
  "description": "My custom grid style",
  "axes": {
    "color": "#00FF00",           // Change colors
    "width": 3,                   // Adjust widths
    // ...
  }
  // ... rest of config
}
```

### Step 3: Reload Configuration

The ConfigManager will automatically detect and load your new preset on next app start. In development mode, configs are hot-reloaded.

### Step 4: Select in UI

Your preset will appear in the appropriate dropdown:
- **Grid Styles**: Settings → Grid Style → "My Custom Grid"
- **Color Schemes**: Settings → Color Scheme → "My Custom Grid"
- **Easing Curves**: Timeline → Easing → "My Custom Grid"

### Validation

Presets are validated on load. If invalid, you'll see an error:

```
❌ Invalid preset 'my-custom-grid':
  - Missing required field: axes.color
  - Invalid value for axes.width: must be > 0
```

---

## Configuration Schema

### Grid Style Schema (TypeScript)

```typescript
interface GridStyleConfig {
  id: string;
  name: string;
  description?: string;
  axes: {
    color: string;           // Hex color
    width: number;           // px, > 0
    showArrows: boolean;
    arrowSize?: number;      // px, if arrows shown
  };
  majorGrid: {
    color: string;
    width: number;
    spacing: number;         // coordinate units
    visible: boolean;
    radial?: boolean;        // For polar grids
    angleSpacing?: number;   // degrees, if radial
  };
  minorGrid: {
    color: string;
    width: number;
    spacing: number;
    visible: boolean;
    radial?: boolean;
    angleSpacing?: number;
  };
  labels: {
    show: boolean;
    color?: string;
    fontSize?: number;       // px
    fontFamily?: string;
    precision?: number;      // decimal places
    angleLabels?: boolean;   // Show angle labels (polar)
  };
  background: string;        // Hex color
}
```

### Color Scheme Schema (TypeScript)

```typescript
interface ColorSchemeConfig {
  id: string;
  name: string;
  description?: string;
  primary: string;           // Hex color
  secondary: string;
  accent: string;
  functionColors: string[];  // Array of hex colors
  parameterColor: string;
  highlightColor: string;
}
```

### Easing Curve Schema (TypeScript)

```typescript
interface EasingCurveConfig {
  id: string;
  name: string;
  description?: string;
  type: 'function' | 'bezier';
  formula?: string;          // If type = function
  mathjs?: string;           // Math.js expression
  controlPoints?: number[];  // If type = bezier [x1, y1, x2, y2]
}
```

### Warp Schema (TypeScript)

```typescript
interface WarpConfig {
  id: string;
  name: string;
  description?: string;
  type: 'identity' | 'radial' | 'custom';
  formula: string;           // Transformation function
  parameters?: {
    [key: string]: {
      default: number;
      min: number;
      max: number;
      step: number;
      description?: string;
    };
  };
}
```

---

## Configuration Loading Priority

Configs are loaded and merged in this order (later overrides earlier):

1. **System Defaults** (`defaults.json`)
2. **Built-in Presets** (`presets/**/*.json`)
3. **User Presets** (custom files in presets/)
4. **User Settings** (`user-settings.json`)
5. **Project Config** (saved in `.pkstudio` file)

### Example Merge

```json
// 1. System defaults
{ "camera": { "zoomSpeed": 0.1 } }

// 2. User settings (overrides)
{ "camera": { "zoomSpeed": 0.5 } }

// 3. Project config (overrides all)
{ "camera": { "zoomSpeed": 0.2 } }

// Result:
{ "camera": { "zoomSpeed": 0.2 } }  // From project
```

---

## Tips and Best Practices

### 1. Use Descriptive IDs

```json
// ❌ Bad
{ "id": "preset1" }

// ✅ Good
{ "id": "cartesian-dark-high-contrast" }
```

### 2. Keep Colors Consistent

Use the same color scheme across related presets:

```json
// grid-styles/dark.json
{ "background": "#000000", "axes": { "color": "#FFFFFF" } }

// color-schemes/dark.json
{ "primary": "#FFFFFF", "background": "#000000" }
```

### 3. Test with Extreme Values

When creating custom presets, test with:
- Very small numbers (0.001)
- Very large numbers (1000)
- Negative values
- Zero

### 4. Document Custom Formulas

```json
{
  "id": "bounce",
  "name": "Bounce Easing",
  "description": "Bouncing effect at the end (springs back before settling)",
  "type": "function",
  "formula": "t < 0.9 ? t : t + 0.1 * sin(30 * (t - 0.9))",
  "mathjs": "t < 0.9 ? t : t + 0.1 * sin(30 * (t - 0.9))"
}
```

### 5. Version Your Presets

Add version info for future compatibility:

```json
{
  "id": "my-preset",
  "version": "1.0.0",
  "compatibleWith": ">=1.0.0",
  // ... rest
}
```

---

## Troubleshooting

### Preset Not Appearing

**Cause**: Invalid JSON or missing required fields

**Solution**: Check browser console for errors:
```
❌ Failed to load preset 'my-grid': Invalid JSON at line 15
```

Fix the JSON and reload the app.

### Config Changes Not Applying

**Cause**: Config cached or project override active

**Solution**:
1. Clear browser cache
2. Check if project has config overrides (`.pkstudio` file)
3. Reset to defaults: Settings → Reset All

### Colors Look Wrong

**Cause**: Hex color format incorrect

**Solution**: Always use 6-digit hex with `#`:
- ✅ `"#FF0000"` (red)
- ❌ `"FF0000"` (missing #)
- ❌ `"#F00"` (shorthand not supported)

### Easing Curve Not Smooth

**Cause**: Formula returns values outside [0, 1]

**Solution**: Easing functions must satisfy:
- `f(0) = 0`
- `f(1) = 1`
- `f(t) ∈ [0, 1]` for all `t ∈ [0, 1]`

Test your formula:
```javascript
const f = (t) => /* your formula */;
console.log(f(0));  // Should be 0
console.log(f(1));  // Should be 1
console.log(f(0.5)); // Should be 0-1
```

---

## See Also

- [USER_GUIDE.md](USER_GUIDE.md) - User documentation
- [DEVELOPER.md](DEVELOPER.md) - Developer guide
- [CLAUDE.md](CLAUDE.md) - Project instructions
- [ConfigManager.ts](src/config/ConfigManager.ts) - Config loading code

---

**Version**: 1.0.0
**Last Updated**: 2025-10-05
