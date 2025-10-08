# Getting Started

Welcome to **Parametric Keyframe Studio**! This guide will help you get started with creating mathematical animations.

## Quick Start

### Basic Setup (Frontend Only)
```bash
npm install && npm run dev
```
Open browser: `http://localhost:5000`

### Full Setup (With Video Export) ⭐ Recommended
```bash
npm install && npm run dev:full
```
This starts both frontend and backend in one terminal!

**Prerequisites for video export**:
- Install Manim: `pip install manim`

### First Steps

1. **Create a parameter**: Click "Add Parameter" to create a numeric parameter
2. **Plot a function**: Add a function like `f(x) = sin(k*x)` where `k` is your parameter
3. **Animate**: Add keyframes and scrub the timeline to see your animation
4. **Export**: Render as MP4 video or export as PNG

## Core Concepts

### Parameters

Parameters are numeric values that control your visualizations. They can be:
- **Constants**: `k = 710`
- **Expressions**: `rate = 2*pi`
- **Animated**: Change over time via keyframes

### Functions

Functions define what to plot on the canvas:
- **Explicit**: `f(x) = x^2`
- **Anonymous**: `y = sin(x)` (shorthand)
- **Parametric**: Functions of parameters like `f(x) = k*x^2`

### Keyframes

Keyframes capture the state of your scene at specific points in time:
- **Position 0**: Starting state
- **Position 5**: Midpoint
- **Position 10**: Ending state

The system smoothly interpolates between keyframes.

## Your First Animation

Let's create a simple sine wave animation:

### Step 1: Create a Parameter

1. Open the **Parameters** panel
2. Click **"+ Parameter"**
3. Name: `k`
4. Value: `1`
5. Set slider range: `0` to `10`

### Step 2: Plot a Function

1. Open the **Functions** panel
2. Click **"+ Function"**
3. Expression: `f(x) = sin(k*x)`
4. Choose a color
5. Click **"Add"**

### Step 3: Add Keyframes

1. Open the **Timeline** panel
2. At time `0`, click **"Add Keyframe"**
3. Set `k = 1`
4. Scrub to time `5`
5. Change `k` to `5`
6. Add another keyframe
7. Press **Play** to see the animation!

## Next Steps

- **Import from Desmos**: Load your Desmos graphs
- **Export**: Save as PNG or generate Manim scripts
- **Explore**: Try complex expressions and multiple parameters

Check out the other guides for more details!

## Keyboard Shortcuts

- `Space`: Play/Pause
- `Ctrl+S`: Save project
- `Ctrl+K`: Add keyframe
- `Ctrl+Z`: Undo (coming soon)

---

**Need help?** Check the other documentation sections or visit the [GitHub repository](https://github.com/tsolomon89/manim-director-suite).
