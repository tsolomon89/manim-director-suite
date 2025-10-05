# Parametric Keyframe Studio - User Guide

**Version 1.0 | Last Updated: 2025-10-05**

Welcome to Parametric Keyframe Studio, your tool for creating mathematical animations through parametric keyframes!

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Basic Concepts](#basic-concepts)
3. [Creating Your First Animation](#creating-your-first-animation)
4. [Working with Parameters](#working-with-parameters)
5. [Function Plotting](#function-plotting)
6. [Timeline & Keyframes](#timeline--keyframes)
7. [Camera Controls](#camera-controls)
8. [Importing from Desmos](#importing-from-desmos)
9. [Exporting Animations](#exporting-animations)
10. [Configuration & Presets](#configuration--presets)
11. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Installation

```bash
# Clone the repository
git clone https://github.com/tsolomon89/manim-director-suite.git
cd manim-director-suite

# Install dependencies
npm install

# Start the development server
npm run dev
```

The application will open at [http://localhost:3000](http://localhost:3000)

### System Requirements

- **Node.js**: 18.0 or higher
- **Browser**: Chrome, Firefox, Edge (latest version)
- **Optional**: Python 3.8+ with Manim Community for video export

---

## Basic Concepts

### Parameters

**Parameters** are numeric values that can change over time. Examples:
- `Z = 710` (a constant)
- `k = 2.5` (another constant)
- `T = 1.999` (a third constant)

Parameters are the "dials" you can animate to create motion.

### Functions

**Functions** are mathematical expressions that plot curves. Examples:
- `f(x) = sin(x)`
- `g(t) = t² - 4t + 3`
- `h(x) = exp(-x²) * cos(5x)`

Functions use independent variables (like `x` or `t`) to create visualizations.

### Keyframes

**Keyframes** are snapshots of your scene at specific times. You set parameter values at different keyframes, and the system smoothly interpolates between them to create animation.

### Timeline

The **timeline** shows all your keyframes and allows you to scrub through time to preview your animation.

---

## Creating Your First Animation

### Step 1: Create a Parameter

1. Click the **"+ Add Parameter"** button in the Parameters panel
2. Enter a name (e.g., `Z`)
3. Set the initial value (e.g., `710`)
4. Choose a slider range (e.g., min: `0`, max: `1000`)
5. Click **"Create"**

### Step 2: Create Keyframes

1. Make sure the timeline is at time `0`
2. Click **"+ Add Keyframe"**
3. This captures the current parameter value (`Z = 710`)
4. Move the timeline slider to time `5`
5. Change the parameter value (e.g., `Z = 200`)
6. Click **"+ Add Keyframe"** again

### Step 3: Preview Animation

1. Drag the timeline scrubber from `0` to `5`
2. Watch as `Z` smoothly interpolates from `710` to `200`
3. The viewport updates in real-time

### Step 4: Add a Function (Optional)

1. Click **"+ Add Function"** in the Functions panel
2. Create an independent variable `x` (min: `-10`, max: `10`)
3. Enter the function: `f(x) = sin(Z * x / 100)`
4. The function plot will update as `Z` changes!

---

## Working with Parameters

### Creating Parameters

**Method 1: Manual Entry**
1. Click **"+ Add Parameter"**
2. Enter name, value, and range
3. Select UI control type (slider, number input, stepper)

**Method 2: Import from Desmos**
1. Export your Desmos graph as JSON
2. Click **"Import from Desmos"**
3. Select which parameters to import

### Parameter Types

**Numeric Parameters**:
- Single values: `Z = 710`
- Sliders with min/max ranges
- Can be animated via keyframes

### Editing Parameters

1. Click the parameter name to edit
2. Change the value using:
   - Slider (drag left/right)
   - Number input (type exact value)
   - Stepper (click +/- buttons)
3. Changes apply immediately

### Deleting Parameters

1. Hover over the parameter
2. Click the **trash icon**
3. Confirm deletion

**Warning**: Deleting a parameter removes it from all keyframes!

---

## Function Plotting

### Creating a Function

1. **Create Independent Variable** (if not exists):
   - Click **"+ Add Variable"**
   - Symbol: `x`
   - Range: `-10` to `10`
   - Step: `0.1`

2. **Create Function**:
   - Click **"+ Add Function"**
   - Name: `f`
   - Expression: `sin(x)`
   - Select independent variable: `x`

3. **View Plot**:
   - The function plots immediately on the grid
   - Default color: first color in active color scheme

### Supported Functions

**Trigonometric**:
- `sin(x)`, `cos(x)`, `tan(x)`
- `asin(x)`, `acos(x)`, `atan(x)`

**Exponential & Logarithmic**:
- `exp(x)`, `log(x)`, `ln(x)`, `log10(x)`

**Algebraic**:
- `sqrt(x)`, `abs(x)`, `pow(x, n)`

**Greek Symbols**:
- Type `\pi` or `pi` for π
- Type `\tau` or `tau` for τ
- Type `\alpha` for α, `\beta` for β, etc.

### Implicit Multiplication

The engine automatically inserts multiplication:
- `2x` → `2*x`
- `2πx` → `2*π*x`
- `sin(x)cos(y)` → `sin(x)*cos(y)`

### Function Colors

1. Click the color swatch next to the function name
2. Select a color from the palette
3. Or use the color scheme selector for coordinated colors

---

## Timeline & Keyframes

### Creating Keyframes

**Method 1: Capture Current State**
1. Set parameters to desired values
2. Position timeline at target time
3. Click **"+ Add Keyframe"**

**Method 2: Clone Existing Keyframe**
1. Right-click a keyframe marker
2. Select **"Clone"**
3. Choose new time

### Editing Keyframes

1. Click a keyframe marker to select it
2. Edit in the Keyframe Inspector:
   - **Label**: Descriptive name
   - **Time**: Position on timeline
   - **Parameters**: Which values to include
   - **Easing**: Interpolation curve

### Include Flags

Each parameter in a keyframe has an **include** checkbox:
- ✅ **Included**: Interpolates to next keyframe value
- ☐ **Excluded**: Holds current value (no animation)

**Example**:
```
KF1 (t=0): Z=710 ✅, k=2 ☐
KF2 (t=5): Z=200 ✅, k=5 ☐

Result: Z animates 710→200, k stays at 2
```

### Easing Curves

Choose how values interpolate between keyframes:

| Curve | Description | Use Case |
|-------|-------------|----------|
| **Linear** | Constant speed | Simple movements |
| **Smooth Step** | Ease in and out | Natural motion |
| **Ease In** | Slow start, fast end | Acceleration |
| **Ease Out** | Fast start, slow end | Deceleration |
| **Ease In-Out** | Slow start and end | Smooth transitions |

### Timeline Controls

- **Play/Pause**: ▶️/⏸️ buttons
- **Scrub**: Drag the playhead
- **Jump to Keyframe**: Click keyframe marker
- **Loop**: Toggle loop mode
- **Speed**: Adjust playback speed (0.25x - 4x)

---

## Camera Controls

### Pan & Zoom

**Mouse**:
- **Pan**: Click and drag viewport
- **Zoom**: Scroll wheel

**Keyboard**:
- **Arrow Keys**: Pan camera
- **+/-**: Zoom in/out

**UI Controls**:
- Pan speed slider
- Zoom level input
- Reset button (returns to default view)

### Camera Animation

1. **Create Keyframe at t=0**:
   - Set camera position (x=0, y=0, zoom=1)
   - Check "Include Camera" ✅

2. **Create Keyframe at t=5**:
   - Set new camera position (x=10, y=5, zoom=2)
   - Check "Include Camera" ✅

3. **Preview**:
   - Scrub timeline
   - Camera smoothly moves from position 1 to position 2

### Camera Bookmarks

1. Set camera to desired view
2. Click **"Save Bookmark"**
3. Name it (e.g., "Overview", "Close-up")
4. Click bookmark to instantly jump to that view

---

## Importing from Desmos

### Export from Desmos

1. Open your Desmos graph
2. Click the menu (three lines)
3. Select **"Export"** → **"Export Graph State"**
4. Save the JSON file

### Import into Parametric Keyframe Studio

1. Click **"Import from Desmos"**
2. Select your JSON file
3. Review the import preview:
   - ✅ **Numeric definitions** (e.g., `Z=710`) will be imported
   - ⚠️ **Lists** (e.g., `[0...Z-1]`) will be skipped
   - ⚠️ **Complex plots** will be skipped
   - ⚠️ **Graphable expressions** will be skipped

4. Check/uncheck parameters to import
5. Click **"Import Selected"**

### What Gets Imported

**Supported**:
- Numeric parameters: `Z = 710`
- Derived expressions: `k = log(T) / log(τ)`
- Slider metadata (min, max, step)
- Viewport bounds
- Folder structure (preserved in metadata)

**Not Supported** (MVP):
- List ranges: `n = [0...Z-1]`
- Complex numbers: `f = k * e^(iτ^k)`
- Graphable expressions: `sin(n*f)`
- Parametric/polar plots

---

## Exporting Animations

### Export PNG (Single Frame)

1. Set timeline to desired frame
2. Click **"Export"** → **"PNG"**
3. Choose resolution:
   - 720p (1280×720)
   - 1080p (1920×1080)
   - 1440p (2560×1440)
   - 4K (3840×2160)
4. Click **"Export"**
5. Image saves to downloads folder

### Export Manim Script

1. Click **"Export"** → **"Manim Script"**
2. Configure settings:
   - **Resolution**: 720p, 1080p, 4K
   - **Frame Rate**: 24, 30, 60 FPS
   - **Quality**: Draft, Medium, High
   - **Background Color**: Transparent or custom

3. Click **"Generate Script"**
4. Python file saves to downloads folder

### Render with Manim

```bash
# Install Manim Community (if not installed)
pip install manim

# Render the exported script
manim -pql output.py ParametricScene

# Quality flags:
# -ql = low quality (fast preview)
# -qm = medium quality
# -qh = high quality
# -qk = 4K quality
```

---

## Configuration & Presets

### Grid Styles

**Built-in Presets**:
- **Cartesian Dark**: High contrast for presentations
- **Polar Light**: Light background with radial grid
- **Minimal**: Clean, simple grid
- **Blueprint**: Engineering-style blue background

**Switching Grid Styles**:
1. Click **"Settings"** → **"Grid Style"**
2. Select preset from dropdown
3. Grid updates immediately

### Color Schemes

**Built-in Presets**:
- **Scientific**: Bright primary colors
- **Vibrant**: High-saturation palette
- **Monochrome**: Grayscale only

**Applying Color Schemes**:
1. Click **"Settings"** → **"Color Scheme"**
2. Select preset
3. All function colors update

### Creating Custom Presets

1. **Modify Settings**:
   - Adjust grid colors, line widths, spacing
   - Change label fonts and sizes

2. **Save as Preset**:
   - Click **"Save as Preset"**
   - Enter name (e.g., "My Dark Theme")
   - Preset saves to `config/presets/grid-styles/`

3. **Export Preset**:
   - Click **"Export Preset"**
   - JSON file downloads
   - Share with others!

4. **Import Preset**:
   - Click **"Import Preset"**
   - Select JSON file
   - Preset appears in dropdown

---

## Troubleshooting

### Common Issues

#### **Parameters Not Updating**

**Problem**: Slider moves but function doesn't update

**Solution**:
1. Check if function uses the parameter in its expression
2. Verify parameter name spelling matches
3. Refresh the page if issue persists

#### **Keyframes Not Interpolating**

**Problem**: Values jump instead of smoothly transitioning

**Solution**:
1. Check if parameter has **Include** ✅ checked in both keyframes
2. Verify keyframes are at different times
3. Try different easing curve

#### **Desmos Import Shows Warnings**

**Problem**: Some parameters skipped during import

**Solution**:
- Lists (`[0...Z-1]`) are not supported in MVP
- Complex expressions may need simplification
- Graphables can't be imported (use Functions panel instead)

#### **Manim Export Fails**

**Problem**: Manim script generates errors

**Solution**:
1. Check Manim Community is installed: `pip show manim`
2. Verify Python version: `python --version` (need 3.8+)
3. Run script with verbose flag: `manim -pql --verbose output.py`
4. Check error output for missing dependencies

#### **Slow Performance**

**Problem**: Viewport lags when scrubbing timeline

**Solution**:
1. Reduce number of points in functions (increase step size)
2. Lower viewport quality (Settings → Performance → Draft Mode)
3. Disable minor grid (Settings → Grid → Hide Minor Grid)
4. Close other browser tabs

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| **Space** | Play/Pause timeline |
| **← →** | Pan camera left/right |
| **↑ ↓** | Pan camera up/down |
| **+ -** | Zoom in/out |
| **Ctrl+S** | Save project |
| **Ctrl+O** | Open project |
| **Ctrl+Z** | Undo (parameter changes) |
| **Ctrl+Y** | Redo |
| **Delete** | Delete selected keyframe |
| **Home** | Jump to timeline start |
| **End** | Jump to timeline end |

---

## Tips & Best Practices

### 1. **Start Simple**
Begin with 1-2 parameters and basic functions. Add complexity gradually.

### 2. **Use Descriptive Names**
Name parameters meaningfully:
- ✅ Good: `wavelength`, `amplitude`, `frequency`
- ❌ Bad: `a`, `b`, `c`

### 3. **Keyframe Sparingly**
You only need keyframes at inflection points. The system interpolates smoothly between them.

### 4. **Test Easing Curves**
Try different easing curves to see what looks best. "Smooth Step" is a good default.

### 5. **Save Often**
Use **Ctrl+S** to save your project frequently. Auto-save happens every 30 seconds by default.

### 6. **Use Camera Bookmarks**
Save useful camera angles as bookmarks for quick navigation.

### 7. **Export High Quality**
For final renders, use 1080p or 4K with high quality settings. Draft mode is for previews only.

---

## Next Steps

Now that you've mastered the basics:

1. **Explore Examples**: Check `examples/` folder for sample projects
2. **Read DEVELOPER.md**: Learn about the architecture
3. **Read CONFIG_REFERENCE.md**: Deep dive into customization
4. **Join Community**: Share your animations!

---

## Need Help?

- **GitHub Issues**: https://github.com/tsolomon89/manim-director-suite/issues
- **Documentation**: Check [README.md](README.md) and [DEVELOPER.md](DEVELOPER.md)

Happy animating! 🎬✨
