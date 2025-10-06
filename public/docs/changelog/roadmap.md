# 🚀 Next Level Roadmap

## Current State Assessment

### ✅ What We Have (Phases 1-4 Complete)
- **Configuration System** ✅ - Fully operational, zero hard-coded values
- **Scene & Viewport** ✅ - Interactive 2D grid with pan/zoom camera
- **Parameters & Expressions** ✅ - math.js integration, dependency resolution
- **Function Plotting** ✅ - Real-time visualization with parameter integration
- **UI Framework** ✅ - 3-column layout, settings panels, parameter/function controls

### 🎯 What's Missing to Transform This into a Powerful Tool

---

## TIER 1: Essential Integration (Make it Useful)

### 1. **Actually PLOT Parameter-Driven Functions** 🎨 ✅ **COMPLETE**
**Status**: ✅ Implemented in Phase 4

**What Was Built**:
```typescript
// Add to Viewport or new Plotter component
function plotParametricFunction(
  expression: string,
  parameters: Record<string, number>,
  domain: { min: number; max: number; step: number }
) {
  const points: Point2D[] = [];

  for (let x = domain.min; x <= domain.max; x += domain.step) {
    const y = evaluateExpression(expression, { ...parameters, x });
    if (y.success) {
      points.push({ x, y: y.value! });
    }
  }

  // Render points on grid
  renderCurve(points, style);
}

// Example usage:
// User creates: Z=710, k=2*Z
// User plots: y = sin(k * x)
// Result: Live curve that updates when Z slider moves
```

**Features Delivered**:
- ✅ Function plotter UI (add function, specify expression)
- ✅ Live curve rendering on canvas
- ✅ Multiple functions with different colors
- ✅ Update curves when parameters change
- ⏳ Point/scatter plot mode (future)
- ⏳ Parametric curves: x(t), y(t) (future)

**Status**: ✅ Phase 4 Complete - Parameters visualized in real-time!

---

### 2. **Complete Grid Configuration Integration** 📐 ✅ **COMPLETE**
**Status**: ✅ Implemented in Phase 2 & 4

**Implementation Status**:
1. ✅ GridConfigPanel in App's right sidebar
2. ✅ Grid.ts uses GridRenderConfig
3. ✅ Adaptive grid scaling implemented
4. ✅ Polar/radial rendering modes available
5. ✅ Dashed/dotted line styles working
6. ✅ Opacity and effects functional

**Code Changes**:
```typescript
// In App.tsx
const [gridConfig, setGridConfig] = useState<GridRenderConfig>(getDefaultGridConfig());

<GridConfigPanel
  config={gridConfig}
  onChange={setGridConfig}
/>

<Viewport
  gridConfig={gridConfig}  // Pass to viewport
  ...
/>

// In Grid.ts - use gridConfig instead of GridStyleConfig
render(ctx, camera, viewport, gridConfig) {
  // Apply opacity
  ctx.globalAlpha = gridConfig.axes.opacity;

  // Apply line style
  if (gridConfig.majorGrid.style === 'dashed') {
    ctx.setLineDash([5, 5]);
  }

  // Adaptive scaling
  const spacing = calculateAdaptiveSpacing(
    gridConfig.majorGrid.spacing,
    camera.zoom,
    gridConfig.majorGrid.minSpacing,
    gridConfig.majorGrid.maxSpacing
  );
}
```

**Status**: ✅ Complete - Professional-grade visualization control operational

---

### 3. **Space Transformation System** 🌀
**The Big Feature**: Warp space itself, not just objects

**Two Modes to Implement**:

**Mode A: Object Transformation** (Traditional)
- Parameters affect plotted functions
- Grid stays Euclidean
- Example: `y = sin(k*x)` where k changes

**Mode B: Space Transformation** (Advanced)
- Grid itself warps/curves
- Functions plotted in "warped coordinates"
- Example: Radial distortion, conformal maps, non-Euclidean geometry

**Implementation**:
```typescript
interface SpaceTransform {
  type: 'none' | 'radial' | 'conformal' | 'logarithmic' | 'custom';
  intensity: number;
  center?: Point2D;
  customFunction?: (p: Point2D) => Point2D;
}

// Apply to grid rendering
function renderWarpedGrid(grid: Grid, transform: SpaceTransform) {
  for (let x = xMin; x <= xMax; x += spacing) {
    const line: Point2D[] = [];
    for (let y = yMin; y <= yMax; y += step) {
      const warped = applyTransform({ x, y }, transform);
      line.push(worldToScreen(warped, camera, viewport));
    }
    ctx.stroke(line); // Curved grid line!
  }
}

// UI: Transform selector
<select onChange={setTransformType}>
  <option value="none">Euclidean Space</option>
  <option value="radial">Radial Distortion</option>
  <option value="conformal">Conformal Map</option>
  <option value="logarithmic">Logarithmic Space</option>
</select>
<input
  type="range"
  value={intensity}
  onChange={setIntensity}
  label="Warp Intensity"
/>
```

**Visual Examples**:
- **Radial**: Grid bends outward from center (like gravitational lensing)
- **Logarithmic**: Exponential spacing (common in Desmos complex plots)
- **Conformal**: Angle-preserving transformations

**Complexity**: High | **Impact**: Very High - Unique feature, educational tool

---

## TIER 2: Animation & Keyframes (The Core Vision)

### 4. **Keyframe System** ⏱️
**Goal**: Record parameter states over time, generate smooth animations

**Data Structure** (already defined in CLAUDE.md):
```typescript
interface Keyframe {
  id: string;
  time: number; // seconds
  label: string;
  snapshot: {
    parameters: Record<string, { value: number; include: boolean; easing: string }>;
    camera: CameraState & { include: boolean };
    warp?: { type: string; intensity: number; include: boolean };
  };
}
```

**Features**:
- Timeline UI (horizontal scrubber)
- Add keyframe button (snapshot current state)
- Keyframe markers (draggable)
- Playhead with play/pause controls
- Scrub timeline → see parameters interpolate
- Per-parameter easing curve selection

**Tweening Engine**:
```typescript
function getValueAtTime(
  currentTime: number,
  keyframes: Keyframe[],
  paramId: string
): number {
  const before = findKeyframeBefore(currentTime, keyframes);
  const after = findKeyframeAfter(currentTime, keyframes);

  const t = (currentTime - before.time) / (after.time - before.time);
  const easingFn = getEasingFunction(before.snapshot.parameters[paramId].easing);

  return lerp(
    easingFn(t),
    before.snapshot.parameters[paramId].value,
    after.snapshot.parameters[paramId].value
  );
}
```

**UI Layout**:
```
┌─────────────────────────────────────────┐
│          Main Viewport (Canvas)         │
│                                         │
└─────────────────────────────────────────┘
┌──────────────────────────────────────────┐
│  Timeline                        [Play]  │
│  ├─────●────────────●──────●────────┤   │
│  0s   2s         5s      8s       10s   │
└──────────────────────────────────────────┘
```

**Complexity**: High | **Impact**: ESSENTIAL - This is the project's core purpose!

---

### 5. **Manim Export** 🎬
**Goal**: Generate Python script → render publication-quality video

**Template System**:
```python
# Generated Manim script
from manim import *

class ParametricAnimation(Scene):
    def construct(self):
        # Scene setup from config
        axes = Axes(x_range=[{{xMin}}, {{xMax}}], ...)
        self.add(axes)

        # Initial parameter values
        Z = ValueTracker(710)
        k = always_redraw(lambda: 2 * Z.get_value())

        # Define function that depends on parameters
        curve = always_redraw(lambda:
            axes.plot(lambda x: sin(k.get_value() * x))
        )
        self.add(curve)

        # Keyframe 1 → 2: Animate Z from 710 to 1
        self.play(
            Z.animate.set_value(1),
            rate_func={{easingFunction}},
            run_time={{duration}}
        )

        # Camera movement
        self.play(
            self.camera.frame.animate.move_to([{{x}}, {{y}}, 0]),
            run_time={{duration}}
        )
```

**Implementation**:
1. Template engine (fill variables from project state)
2. Keyframe → Manim animation mapping
3. Easing curve → Manim rate_func conversion
4. Subprocess to run: `manim -qh output.py ParametricAnimation`
5. Progress tracking, error handling

**Complexity**: Medium-High | **Impact**: High - Delivers on "film-quality output"

---

## TIER 3: Advanced Features (Professional Tool)

### 6. **Desmos Import** 📥
**Goal**: Load existing Desmos graphs, extract parameters

**Parser** (structure in CLAUDE.md):
```typescript
function parseDesmosJSON(json: string) {
  const data = JSON.parse(json);

  // Extract viewport bounds
  const bounds = data.graph.viewport;

  // Extract numeric definitions
  const parameters = data.expressions.list
    .filter(expr => expr.type === 'expression')
    .filter(expr => isNumericDefinition(expr.latex))
    .map(expr => ({
      name: extractName(expr.latex), // "Z" from "Z=710"
      expression: extractExpression(expr.latex), // "710"
      slider: expr.slider // { min, max, step }
    }));

  return { bounds, parameters };
}
```

**UI Flow**:
1. File upload (drop JSON file)
2. Preview extracted parameters
3. Checkboxes to select which to import
4. Warning for unsupported features (lists, complex, graphables)
5. Import button → creates parameters

**Complexity**: Medium | **Impact**: Medium-High - Great UX, lowers barrier to entry

---

### 7. **Complex Number Support** 🔢
**Goal**: `f = e^(i*tau*q)` actually works as complex

**Current**: math.js evaluates `i` but treats as real
**Needed**: Full complex arithmetic

**Implementation**:
```typescript
// Use math.js complex mode
const math = create(all, {
  number: 'complex'
});

// Evaluate complex expression
const result = math.evaluate('e^(i*pi)');
// → Complex {re: -1, im: 0}

// Plot on 2D plane
// Option 1: Magnitude as height/color
plotComplex(x, expression, 'magnitude');

// Option 2: Real vs Imaginary
plotComplex(x, expression, 'real');
plotComplex(x, expression, 'imaginary');

// Option 3: Conformal map (f(z) visualization)
for (let x of domain) {
  for (let y of domain) {
    const z = { re: x, im: y };
    const w = evaluateComplex(expression, { q: z });
    plotPoint(w.re, w.im, colorByPhase(w));
  }
}
```

**Complexity**: High | **Impact**: High - Educational, mathematically rich

---

### 8. **List-Based Plotting** (Desmos `[0...Z-1]` syntax) 📊
**Goal**: `n=[0...Z-1]` creates multiple points/curves

**Parser**:
```typescript
function parseListExpression(latex: string) {
  // Match: [start...end] or [start, start+step, ..., end]
  const rangeMatch = latex.match(/\[(\w+)\.\.\.(\w+)\]/);

  if (rangeMatch) {
    const [_, start, end] = rangeMatch;
    return {
      type: 'range',
      variable: extractVariable(latex),
      start: evaluateExpression(start),
      end: evaluateExpression(end)
    };
  }
}

// Use in plotting
const n = createListVariable('[0...Z-1]', { Z: 710 });
// → [0, 1, 2, ..., 709]

for (const value of n) {
  plotPoint(value, sin(value * f));
}
```

**Complexity**: Medium-High | **Impact**: High - Enables Desmos-style discrete plots

---

### 9. **Project Save/Load** 💾
**Goal**: Persist entire project state to JSON file

**Structure**:
```json
{
  "version": "1.0.0",
  "metadata": {
    "name": "My Animation",
    "created": "2025-10-03T...",
    "modified": "2025-10-03T..."
  },
  "parameters": [...], // All parameters
  "functions": [...], // Plotted functions
  "keyframes": [...], // Timeline keyframes
  "scene": {
    "bounds": {...},
    "gridConfig": {...},
    "cameraBookmarks": [...]
  },
  "rendering": {
    "resolution": "1920x1080",
    "fps": 60
  }
}
```

**Features**:
- Save project to .json file
- Load project from file
- Deterministic reproduction (same file → same output)
- Export/import presets

**Complexity**: Low-Medium | **Impact**: Essential - Makes tool practical

---

## TIER 4: Polish & UX (Production Ready)

### 10. **Keyboard Shortcuts** ⌨️
```
Space       - Play/pause animation
← →         - Prev/next keyframe
Ctrl+S      - Save project
Ctrl+Z/Y    - Undo/redo
K           - Add keyframe at current time
Delete      - Delete selected keyframe
1-9         - Jump to camera bookmark
```

### 11. **Undo/Redo System** ↩️
- Track all state changes
- Command pattern implementation
- Visual undo/redo buttons
- Stack size limit (configurable)

### 12. **Performance Optimization** ⚡
- Web Workers for expression evaluation
- Canvas off-screen rendering
- Memoization of expensive calculations
- Adaptive quality (lower while dragging)

### 13. **Accessibility** ♿
- Keyboard navigation
- Screen reader support
- High contrast mode
- Configurable UI scale

---

## Implementation Priority Recommendation

### ✅ Phase 4 Complete: Parameters Visualized
1. ✅ **Function Plotter** (Tier 1.1) - COMPLETE
   - ✅ Plotted functions in viewport
   - ✅ Color/style controls
   - ✅ Live updates with parameter changes
2. ✅ **Grid Config Integration** (Tier 1.2) - COMPLETE
   - ✅ UI connected to renderer
   - ✅ Adaptive scaling
3. ⏳ **Space Transforms** (Tier 1.3) - PARTIAL
   - ✅ Radial warp infrastructure ready
   - ⏳ UI controls for transform intensity (future)

**Achievement**: Parameters now DO something visual - tool is immediately useful!

### Phase 5 (Next Sprint): Timeline & Animation
4. **Keyframe System** (Tier 2.4)
5. **Manim Export** (Tier 2.5)

**Why**: Delivers on the core vision - "keyframe storytelling"

### Phase 6: Data Import/Export
6. **Desmos Import** (Tier 3.6)
7. **Project Save/Load** (Tier 3.9)

**Why**: Professional workflow, data portability

### Phase 7: Advanced Math
8. **Complex Numbers** (Tier 3.7)
9. **List Plotting** (Tier 3.8)

**Why**: Expands mathematical capabilities

### Phase 8: Polish
10. **Shortcuts, Undo, Perf, A11y** (Tier 4)

---

## ✅ Completed: Function Plotter (Phase 4)

The function plotter has been fully implemented with:

```typescript
// src/scene/FunctionPlotter.ts (IMPLEMENTED)
export class FunctionPlotter {
  plotFunction(
    expression: string,
    parameters: Record<string, number>,
    domain: { min: number; max: number; step: number },
    ctx: CanvasRenderingContext2D,
    space: Space,
    camera: CameraState,
    viewport: ViewportDimensions
  ) {
    const engine = new ExpressionEngine();
    ctx.beginPath();

    let started = false;
    for (let x = domain.min; x <= domain.max; x += domain.step) {
      const result = engine.evaluate(expression, { ...parameters, x });

      if (result.success && isFinite(result.value!)) {
        const screenPoint = space.worldToScreen(
          { x, y: result.value! },
          camera,
          viewport
        );

        if (!started) {
          ctx.moveTo(screenPoint.x, screenPoint.y);
          started = true;
        } else {
          ctx.lineTo(screenPoint.x, screenPoint.y);
        }
      }
    }

    ctx.strokeStyle = '#F5A623';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}
```

Integrated in App:
```typescript
// IMPLEMENTED in src/App.tsx
const [functions, setFunctions] = useState<PlottedFunction[]>([]);

// In viewport (WORKING)
functions.forEach(fn => {
  plotter.plotFunction(
    fn,
    parameterValues,
    ctx, camera, viewport,
    { clipToBounds: true }
  );
});
```

---

## Summary: Progress & Next Steps

**✅ Completed (Phases 1-4)**:
1. ✅ Function plotting - Parameters visualized in real-time
2. ✅ Grid configuration panel - Professional-grade controls
3. ✅ Basic space transformation infrastructure

**🎯 Short Term (Phase 5 - Next 2 Weeks)**:
4. Timeline with keyframes
5. Basic Manim export
6. Project save/load

**📅 Medium Term** (Phase 6-7 - 1 Month):
7. Desmos import
8. Complex numbers
9. Polish & optimize

**🎯 Current Priority**:
**Phase 5 - Keyframes & Timeline** to enable animation generation from the existing parametric function system!

**Achievement Unlocked**: Users can already see `y = sin(k*x)` drawn on the grid and watch it morph in real-time as k changes! ✅
