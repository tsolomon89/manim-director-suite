# Advanced Grid System - Implementation Progress

## ✅ Completed

### 1. Parameter Syntax Help (`ParameterSyntaxHelp.tsx`)
- **Added**: Comprehensive expression syntax documentation
- **Features**:
  - ? button in parameter panel header
  - Dropdown help panel with examples
  - Basic expressions (constants, variables, arithmetic)
  - Mathematical functions (sin, cos, log, exp, etc.)
  - Constants (pi, e, tau, phi)
  - Complex expression guidance (`exp(i*tau*q)` vs LaTeX)
  - Variable naming rules
  - Desmos import examples
  - Tips for dependencies

**Answer to "How do I format?"**: Use `exp(i*tau*q)` NOT `e^{i\tau q}`
- LaTeX braces `{` `}` not supported in MVP
- Use function syntax: `exp()`, `sin()`, `log()`
- Standard operators: `+`, `-`, `*`, `/`, `^`

### 2. Comprehensive Grid Configuration Types (`GridConfig.ts`)
Defined `GridRenderConfig` interface with **exhaustive** controls:

**Visibility** (5 toggles):
- showAxes, showMajorGrid, showMinorGrid, showLabels, showOriginLabel

**Coordinate Systems** (3 types):
- cartesian, polar, radial

**Grid Scaling** (4 settings):
- adaptiveScaling: Auto-adjust density based on zoom
- scaleWithZoom: Grid lines follow zoom level
- fixedGridAtDepth: 3D-like depth layering
- gridDepth: Z-depth value

**Axes Configuration** (7 properties):
- color, width, opacity
- showArrows, arrowSize, arrowStyle (filled/outline/line)
- extendBeyondBounds

**Major Grid** (8 properties):
- color, width, opacity, spacing
- minSpacing/maxSpacing: Pixel thresholds for adaptive scaling
- style: solid/dashed/dotted
- dashPattern: Custom dash patterns

**Minor Grid** (7 properties):
- color, width, opacity, spacing
- subdivisions: Per major division
- style: solid/dashed/dotted
- fadeWithZoom: Auto-fade when zoomed out

**Labels** (11 properties):
- color, fontSize, fontFamily, fontWeight, opacity
- precision: Decimal places
- showFractions: Display as fractions
- orientation: horizontal/aligned/perpendicular
- offset: Distance from axis
- scientific: Scientific notation
- fadeWithZoom

**Polar/Radial Specific** (5 properties):
- showAngleLines, angleStep (degrees)
- showCircles, circleStep (radius)
- centerAtOrigin

**Advanced Rendering** (6 properties):
- antialiasing
- shadowBlur, shadowColor, shadowOpacity
- glowEffect, glowIntensity

**Animation** (3 properties):
- animateChanges, transitionDuration, easingFunction

**Background** (5 properties):
- color, opacity
- gradient, gradientColors, gradientAngle

### 3. Grid Configuration Panel UI (`GridConfigPanel.tsx`)
Created comprehensive UI with **collapsible sections**:

**8 Configuration Sections**:
1. 👁️ Visibility - All show/hide toggles
2. 📐 Coordinate System - Cartesian/Polar/Radial radio buttons
3. 🔍 Grid Scaling - Adaptive scaling, spacing sliders
4. ⊹ Axes Styling - Color, width, opacity, arrows
5. ▦ Major Grid - Color, width, opacity, style
6. ▢ Minor Grid - Color, width, opacity, fade
7. 🏷️ Labels - Font, size, precision, notation
8. 🎨 Background - Color, opacity

**Control Types**:
- Checkboxes for toggles
- Radio buttons for mutually exclusive options
- Color pickers for all colors
- Sliders for numerical values with live display
- Dropdowns for style selections

## 🚧 In Progress / Next Steps

### Immediate Tasks

1. **Integrate GridConfigPanel into App**
   - Add to right sidebar
   - Connect to grid state
   - Update viewport when config changes

2. **Enhance Grid Renderer** (`Grid.ts`)
   - Use `GridRenderConfig` instead of `GridStyleConfig`
   - Implement adaptive scaling logic
   - Add polar/radial rendering modes
   - Implement line styles (dashed, dotted)
   - Add opacity and shadow effects

3. **Implement Adaptive Grid Scaling**
   ```typescript
   // Pseudo-code for adaptive scaling
   calculateGridSpacing(baseSpacing, zoom, viewport) {
     const screenSpacing = baseSpacing * zoom;

     if (screenSpacing < minSpacing) {
       // Too dense - increase spacing by powers of 10
       return baseSpacing * 10;
     }

     if (screenSpacing > maxSpacing) {
       // Too sparse - decrease spacing
       return baseSpacing / 10;
     }

     return baseSpacing;
   }
   ```

4. **Add Polar/Radial Grid Rendering**
   ```typescript
   renderPolarGrid() {
     // Radial circles at regular intervals
     for (let r = 0; r <= maxRadius; r += circleStep) {
       drawCircle(origin, r);
     }

     // Angle lines from origin
     for (let angle = 0; angle < 360; angle += angleStep) {
       drawLine(origin, angle, maxRadius);
     }
   }
   ```

5. **Space Transformation System**
   **Two modes to implement**:

   **Mode A: Transform Objects (Move Points)**
   - Grid stays fixed
   - Plotted points/functions transform
   - Like moving objects in fixed space
   - Use: Animate function parameters

   **Mode B: Transform Space (Warp Grid)**
   - Grid itself warps/curves
   - Points stay in "local coordinates"
   - Like bending spacetime
   - Use: Non-Euclidean visualization

   ```typescript
   interface TransformMode {
     type: 'object' | 'space';
     activeTransform: Transform;
   }

   // Object mode: Apply to points before rendering
   if (mode === 'object') {
     const transformedPoint = applyTransform(point, transform);
     render(transformedPoint);
   }

   // Space mode: Apply to grid coordinates
   if (mode === 'space') {
     const warpedGrid = applyTransformToGrid(grid, transform);
     render(normalPoints, warpedGrid);
   }
   ```

### Mathematical Implementation Details

**Adaptive Scaling Algorithm**:
```typescript
function getOptimalGridSpacing(
  baseSpacing: number,
  zoom: number,
  viewport: ViewportDimensions
): { major: number; minor: number } {
  // Calculate screen pixels per world unit
  const pixelsPerUnit = zoom;
  const screenSpacing = baseSpacing * pixelsPerUnit;

  // Target: 20-100 pixels between major grid lines
  const targetMin = 20;
  const targetMax = 100;

  let scale = 1;

  // If too dense, scale up by powers of 10
  while (screenSpacing * scale < targetMin) {
    scale *= 10;
  }

  // If too sparse, scale down
  while (screenSpacing * scale > targetMax && scale > 0.1) {
    scale /= 10;
  }

  // Try nice subdivisions (2, 2.5, 5)
  const candidates = [scale, scale * 2, scale * 2.5, scale * 5];
  const best = candidates.find(c => {
    const spacing = baseSpacing * pixelsPerUnit * c;
    return spacing >= targetMin && spacing <= targetMax;
  }) || scale;

  return {
    major: baseSpacing * best,
    minor: (baseSpacing * best) / 5
  };
}
```

**Polar Grid Mathematics**:
```typescript
function renderPolarGrid(ctx: CanvasRenderingContext2D, config: GridRenderConfig) {
  const { polar, camera, viewport } = config;

  // Radial circles (r = constant)
  for (let r = polar.circleStep; r <= maxRadius; r += polar.circleStep) {
    ctx.beginPath();
    ctx.arc(centerX, centerY, r * zoom, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Angular lines (θ = constant)
  const angleRadians = (polar.angleStep * Math.PI) / 180;
  for (let θ = 0; θ < Math.PI * 2; θ += angleRadians) {
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
      centerX + maxRadius * zoom * Math.cos(θ),
      centerY + maxRadius * zoom * Math.sin(θ)
    );
    ctx.stroke();
  }
}
```

**Space Warping Example (Radial Distortion)**:
```typescript
function applyRadialWarp(point: Point2D, intensity: number): Point2D {
  const r = Math.sqrt(point.x ** 2 + point.y ** 2);
  const angle = Math.atan2(point.y, point.x);

  // Apply radial distortion
  const warpedR = r * (1 + intensity * r);

  return {
    x: warpedR * Math.cos(angle),
    y: warpedR * Math.sin(angle)
  };
}

// Apply to grid
for (let x = xMin; x <= xMax; x += spacing) {
  const points = [];
  for (let y = yMin; y <= yMax; y += spacing) {
    const warped = applyRadialWarp({ x, y }, warpIntensity);
    points.push(worldToScreen(warped));
  }
  drawPolyline(points); // Draw warped grid line
}
```

## Configuration Hierarchy

```
App State
  ├─ GridRenderConfig (comprehensive, runtime)
  │   ├─ Derived from GridStyleConfig preset
  │   └─ User customizations overlay
  │
  ├─ GridStyleConfig (presets in config/)
  │   └─ Basic styles for quick switching
  │
  └─ Live Controls
      └─ GridConfigPanel modifies GridRenderConfig
```

## User Workflow

1. **Start**: Select base grid style preset (cartesian-dark, etc.)
2. **Customize**: Open Grid Configuration panel
3. **Adjust**: Modify any property in real-time
4. **Visualize**: See changes immediately in viewport
5. **Save**: Export configuration as preset (future)

## Questions Answered

### "Do we show all grids or just x-y axis?"
**Answer**: User configurable via visibility toggles
- Can show: axes only, major only, minor only, or any combination
- Independent controls for each layer

### "Do grids scale with zoom?"
**Answer**: User configurable via `scaleWithZoom` toggle
- **ON**: Grid spacing stays constant in world coordinates (grows/shrinks with zoom)
- **OFF**: Grid spacing stays constant in screen pixels (always same visual density)
- **ADAPTIVE**: Automatically adjusts to keep optimal visual density

### "Can I change the grid?"
**Answer**: Yes, exhaustively
- Spacing, subdivisions, colors, opacity, line styles
- All changes reflect in configuration, not coordinates
- Grid is visual aid, doesn't affect math

### "Do we move points or space?"
**Answer**: Both modes supported (to be implemented)
- **Object Transform**: Points move, grid stays fixed
- **Space Transform**: Grid warps, points in "local coords"
- User selects mode based on visualization needs

### "Show/hide numbers?"
**Answer**: Yes via `showLabels` toggle
- Plus: precision, orientation, offset, scientific notation
- Fade with zoom option for cleaner view when zoomed out

### "Polar or Cartesian?"
**Answer**: User selectable via `coordinateSystem` radio
- Cartesian (X, Y)
- Polar (r, θ) with angle lines and circles
- Radial (concentric circles without angles)

### "Fixed depth or persistent?"
**Answer**: User configurable
- `fixedGridAtDepth`: Toggle for 3D-like layering
- `gridDepth`: Z-depth value for multi-layer grids
- Allows "grid behind" vs "grid on same plane" aesthetics

### "Line thickness, opacity, color?"
**Answer**: All independently configurable
- Axes: width (0.5-5px), opacity (0-100%), color picker
- Major grid: width (0.5-3px), opacity, color
- Minor grid: width (0.25-2px), opacity, color
- Plus: shadow blur, glow effects

### "Grid style (solid/dashed/dotted)?"
**Answer**: Yes for both major and minor grids
- Solid, dashed, dotted dropdown
- Custom dash patterns supported in config

## Files Created This Session

```
src/ui/
├── ParameterSyntaxHelp.tsx       # Syntax documentation popup
├── ParameterSyntaxHelp.css       # Styling
├── GridConfigPanel.tsx           # Comprehensive grid controls
└── GridConfigPanel.css           # Panel styling

src/scene/
└── GridConfig.ts                 # Extended configuration types
```

## Next Integration Steps

1. Add `GridConfigPanel` to App's right sidebar
2. Replace `GridStyleConfig` with `GridRenderConfig` in Grid.ts
3. Implement adaptive scaling algorithm
4. Add polar rendering mode
5. Implement line style rendering (dashed/dotted)
6. Add space transformation mode selector

---

**Status**: Foundation complete, ready for integration and advanced rendering
