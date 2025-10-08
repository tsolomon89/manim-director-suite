# Fractal System Integration Guide

## Quick Start: Wire Fractals into App.tsx

This guide shows exactly how to integrate the fractal system into your existing application.

---

## Step 1: Update App.tsx State

Add fractal state alongside existing function state:

```typescript
// Add imports
import { FractalManager } from './engine/FractalManager';
import type { FractalFunction, FractalType } from './engine/fractal-types';
import { FractalPanel } from './ui/FractalPanel';
import { FractalRenderer } from './scene/FractalRenderer';

// In App component, add fractal state:
const [fractals, setFractals] = useState<FractalFunction[]>([]);
const fractalManagerRef = useRef<FractalManager>(new FractalManager());
const fractalRendererRef = useRef<FractalRenderer | null>(null);
```

---

## Step 2: Add Fractal Event Handlers

```typescript
// Create fractal
const handleFractalCreate = (type: FractalType, config: any) => {
  const manager = fractalManagerRef.current;
  let result;

  if (config.preset) {
    // From preset
    result = manager.createFromPreset(config.preset);
  } else if (type === 'newton') {
    // Newton from roots
    result = manager.createNewtonFromRoots(
      config.roots,
      config.rootColors,
      { maxIterations: config.maxIterations }
    );
  } else if (type === 'mandelbrot') {
    // Mandelbrot
    result = manager.createMandelbrot(config);
  } else if (type === 'julia') {
    // Julia set
    result = manager.createJulia(config.juliaParameter, config);
  }

  if (result?.success && result.fractal) {
    setFractals([...fractals, result.fractal]);
  } else {
    console.error('Fractal creation failed:', result?.error);
  }
};

// Delete fractal
const handleFractalDelete = (id: string) => {
  fractalManagerRef.current.delete(id);
  setFractals(fractals.filter(f => f.id !== id));
};

// Toggle visibility
const handleFractalToggle = (id: string) => {
  fractalManagerRef.current.toggleVisibility(id);
  setFractals([...fractalManagerRef.current.getAll()]);
};

// Update fractal
const handleFractalUpdate = (id: string, updates: Partial<FractalFunction>) => {
  fractalManagerRef.current.updateFractal(id, updates);
  setFractals([...fractalManagerRef.current.getAll()]);
};

// Update roots (for Newton fractals)
const handleRootUpdate = (id: string, roots: Complex[]) => {
  fractalManagerRef.current.updateNewtonRoots(id, roots);
  setFractals([...fractalManagerRef.current.getAll()]);
};
```

---

## Step 3: Initialize Fractal Renderer

Add useEffect to create renderer when viewport is ready:

```typescript
useEffect(() => {
  const canvas = document.getElementById('fractal-canvas') as HTMLCanvasElement;
  if (!canvas) return;

  // Only initialize once
  if (fractalRendererRef.current) return;

  // Create renderer for first visible fractal
  const visibleFractal = fractals.find(f => f.visible);
  if (!visibleFractal) return;

  try {
    const renderer = new FractalRenderer({
      canvas,
      fractalFunction: visibleFractal,
      viewportBounds: {
        xMin: -2,
        xMax: 2,
        yMin: -2,
        yMax: 2,
      },
    });

    fractalRendererRef.current = renderer;
    renderer.render();
  } catch (error) {
    console.error('Failed to create fractal renderer:', error);
  }

  return () => {
    fractalRendererRef.current?.dispose();
    fractalRendererRef.current = null;
  };
}, [fractals]);
```

---

## Step 4: Render Fractal on Viewport Updates

Update fractal rendering when viewport changes:

```typescript
useEffect(() => {
  if (!fractalRendererRef.current) return;

  const visibleFractal = fractals.find(f => f.visible);
  if (!visibleFractal) return;

  // Update fractal function if changed
  fractalRendererRef.current.setFractalFunction(visibleFractal);

  // Update viewport bounds from camera
  fractalRendererRef.current.setViewportBounds({
    xMin: camera.x - camera.zoom,
    xMax: camera.x + camera.zoom,
    yMin: camera.y - camera.zoom,
    yMax: camera.y + camera.zoom,
  });

  // Render
  fractalRendererRef.current.render();
}, [fractals, camera]);
```

---

## Step 5: Add FractalPanel to Layout

Update JSX to include fractal panel:

```typescript
return (
  <div className="app">
    <header>
      <h1>Parametric Keyframe Studio</h1>
    </header>

    <div className="main-layout">
      {/* Left sidebar */}
      <div className="left-sidebar">
        <ParameterPanel {...parameterPanelProps} />
        <FunctionPanel {...functionPanelProps} />

        {/* ADD THIS */}
        <FractalPanel
          fractals={fractals}
          onFractalCreate={handleFractalCreate}
          onFractalUpdate={handleFractalUpdate}
          onFractalDelete={handleFractalDelete}
          onFractalToggle={handleFractalToggle}
          onRootUpdate={handleRootUpdate}
        />
      </div>

      {/* Center viewport */}
      <div className="viewport">
        {/* Existing canvas for functions */}
        <canvas id="main-canvas" />

        {/* ADD THIS: Overlay canvas for fractals */}
        <canvas
          id="fractal-canvas"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: 'none', // Let mouse events pass through
            zIndex: 10, // Above main canvas
          }}
        />
      </div>

      {/* Right sidebar */}
      <div className="right-sidebar">
        <TimelinePanel {...timelinePanelProps} />
      </div>
    </div>
  </div>
);
```

---

## Step 6: Handle Canvas Resize

Make sure both canvases resize together:

```typescript
useEffect(() => {
  const handleResize = () => {
    const mainCanvas = document.getElementById('main-canvas') as HTMLCanvasElement;
    const fractalCanvas = document.getElementById('fractal-canvas') as HTMLCanvasElement;

    if (mainCanvas && fractalCanvas) {
      const width = mainCanvas.clientWidth;
      const height = mainCanvas.clientHeight;

      mainCanvas.width = width;
      mainCanvas.height = height;

      fractalCanvas.width = width;
      fractalCanvas.height = height;

      // Update fractal renderer
      fractalRendererRef.current?.resize(width, height);
      fractalRendererRef.current?.render();
    }
  };

  window.addEventListener('resize', handleResize);
  handleResize(); // Initial size

  return () => window.removeEventListener('resize', handleResize);
}, []);
```

---

## Step 7: Add Export Support

Extend your existing export function to handle fractals:

```typescript
import { ManimFractalExporter } from './export/ManimFractalExporter';

const handleExport = () => {
  // Export regular functions
  const regularScript = ManimGenerator.generateScript(...);

  // Export fractals
  const fractalScript = fractals.length > 0
    ? ManimFractalExporter.generateMultiFractalScript(
        fractals.filter(f => f.visible),
        {
          resolution: '1080p',
          fps: 60,
          quality: 'high',
          backgroundColor: '#000000',
        }
      )
    : '';

  // Combine or keep separate
  const fullScript = regularScript + '\n\n' + fractalScript;

  // Download or execute
  downloadFile('animation.py', fullScript);
};
```

---

## Step 8: Add Keyboard Shortcuts (Optional)

Add shortcuts for quick fractal creation:

```typescript
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'n': // Ctrl+N: Newton fractal
          e.preventDefault();
          handleFractalCreate('newton', { preset: 'newton-cubic' });
          break;

        case 'm': // Ctrl+M: Mandelbrot
          e.preventDefault();
          handleFractalCreate('mandelbrot', {});
          break;

        case 'j': // Ctrl+J: Julia set
          e.preventDefault();
          handleFractalCreate('julia', {
            juliaParameter: { real: -0.7, imag: 0.27 },
          });
          break;
      }
    }
  };

  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, []);
```

---

## Step 9: Add Fractal to Project Save/Load

Extend your project file format:

```typescript
interface ProjectFile {
  version: string;
  parameters: Parameter[];
  functions: FunctionDefinition[];
  fractals: FractalFunction[];  // ADD THIS
  keyframes: Keyframe[];
  camera: CameraState;
  // ... other fields
}

// In save function
const saveProject = () => {
  const project: ProjectFile = {
    version: '2.0.0',
    parameters: parameterManager.exportState(),
    functions: functionManager.exportState(),
    fractals: fractalManagerRef.current.exportState(),  // ADD THIS
    keyframes: keyframeManager.exportState(),
    camera: cameraState,
  };

  const json = JSON.stringify(project, null, 2);
  downloadFile('project.pkstudio', json);
};

// In load function
const loadProject = (json: string) => {
  const project: ProjectFile = JSON.parse(json);

  // ... load parameters, functions, etc.

  // ADD THIS: Load fractals
  if (project.fractals) {
    fractalManagerRef.current.importState(project.fractals);
    setFractals([...fractalManagerRef.current.getAll()]);
  }
};
```

---

## Step 10: Test Integration

Test checklist:

- [ ] Create Newton fractal from preset
- [ ] Create Newton fractal from custom roots
- [ ] Create Mandelbrot set
- [ ] Create Julia set
- [ ] Toggle fractal visibility
- [ ] Delete fractal
- [ ] Pan/zoom viewport (fractal should update)
- [ ] Export to Manim
- [ ] Save/load project with fractals
- [ ] Resize window (canvases should resize)

---

## Troubleshooting

### Issue: WebGL not supported
**Solution:** Add fallback message
```typescript
if (!canvas.getContext('webgl')) {
  alert('WebGL not supported. Fractals require a modern browser with WebGL support.');
}
```

### Issue: Fractal doesn't render
**Solution:** Check console for shader compilation errors. Ensure uniforms are set correctly.

### Issue: Performance is slow
**Solution:** Reduce `maxIterations` or lower resolution multiplier:
```typescript
fractal.renderConfig.maxIterations = 50; // Instead of 256
fractal.renderConfig.resolutionMultiplier = 0.5; // Half resolution
```

### Issue: Colors look wrong
**Solution:** Verify hex color format (must include #):
```typescript
rootColors: ['#FF0000', '#00FF00', '#0000FF'] // Correct
rootColors: ['FF0000', '00FF00', '0000FF']   // Wrong!
```

---

## CSS Additions

Add styles for fractal panel:

```css
/* src/ui/FractalPanel.css (or add to FunctionPanel.css) */

.fractal-create-selector {
  margin-bottom: 1rem;
}

.mode-buttons {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.mode-buttons button {
  flex: 1;
  padding: 0.5rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: pointer;
}

.mode-buttons button.active {
  background: var(--accent-color);
  color: white;
}

.roots-editor {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.root-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.root-input {
  width: 80px;
  padding: 0.25rem;
}

.root-color {
  width: 40px;
  height: 30px;
  cursor: pointer;
}

.remove-root-btn {
  background: var(--danger-color);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
}

.add-root-btn {
  background: var(--accent-color);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem;
  cursor: pointer;
  margin-top: 0.5rem;
}

.fractal-type-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background: var(--accent-color);
  color: white;
  border-radius: 4px;
  font-size: 0.8rem;
  margin-right: 0.5rem;
}

.iterations-info {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.root-colors-display {
  display: flex;
  gap: 0.25rem;
  margin-top: 0.5rem;
}

.root-color-indicator {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1px solid var(--border-color);
}
```

---

## Next Steps

1. **Test the integration** - Create fractals and verify rendering
2. **Add documentation** - Write user guide for fractal features
3. **Optimize performance** - Profile and improve shader code if needed
4. **Add more presets** - Create interesting fractal configurations
5. **Implement domain coloring** - Add phase/magnitude visualization

---

**You're done!** 🎉

The fractal system is now fully integrated. Users can create Newton fractals, Mandelbrot sets, and Julia sets, manipulate roots, and export to Manim.
