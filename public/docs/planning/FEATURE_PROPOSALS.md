# 🚀 Feature Proposals for Manim Director Suite

**Date Created**: 2025-10-05 **Status**: ✅ **ALL APPROVED** \- Ready for implementation **Current Version**: v1.0.0 (MVP Complete)

---

## How to Use This Document

- Review each feature proposal below  
- Mark **Status** column with your decision:  
  - ✅ **APPROVED** \- Ready to implement  
  - ⏳ **MAYBE** \- Needs more discussion  
  - ❌ **REJECT** \- Not needed  
- Add notes in **User Notes** column  
- Priority will be set after approval

---

## 🔥 TOP PRIORITY FEATURES (Advanced Geometry & Data Analysis)

These features enable complex visualizations like Mandelbrot sets, tessellations, and advanced geometric analysis.

| ID | Feature Name | Category | Effort | Impact | Status | User Notes | Consolidates |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| **P1** | **Coordinate Point/List Plotting** | Core Feature | Medium | Very High | ✅ | `k=(0,0)` plots point, `k=([0,1,2],a)` plots list, `k=([0..Z],[0..Z])` for ranges. Enables Mandelbrot, tessellations | Extends F5 |
| **P2** | **Polygon Rendering** | Geometry | Small | High | ✅ | `\polygon((0,1),(2,1),(3,2))` creates polygons from point lists. Auto-close shapes | New |
| **P3** | **Advanced Path Rendering** | Visualization | Medium | Very High | ✅ | Beyond straight lines: curved paths, modulo grouping (mod(2)=0 join separately from mod(2)=1), custom path functions | New |
| **P4** | **Function Path Calculations** | Analysis | Medium | High | ✅ | Area under curve, area between curve and axis/line, arc length, path integrals | Extends F17 |
| **P5** | **Polygon/Area Analysis** | Analysis | Small | High | ✅ | Calculate area of closed shapes (circles, n-gons), perimeter, centroid | Extends F17 |
| **P6** | **Intersection Geometry** | Analysis | Medium | Very High | ✅ | Find intersections within one function (self-intersections), between multiple functions, with grid lines | New |
| **P7** | **Multi-Value Function Handling** | Data Pipeline | Large | Very High | ✅ | Handle functions that output multiple values vs single values. Distinguish from Desmos list-of-lists. Smart rendering (don't plot all for preview, but export all) | New |
| **P8** | **GPU-Accelerated Rendering** | Performance | Large | Very High | ✅ | WebGL shader-based point/path rendering for massive datasets (10K+ points). Critical for Mandelbrot, fractals | Extends F36 |
| **P9** | **Adaptive Point Sampling** | Performance | Medium | High | ✅ | Intelligent LOD: fewer points during interaction, full resolution on export. Configurable density | Extends F39 |
| **P10** | **3D Camera System (Z-axis)** | Core Feature | Medium | High | ✅ | Clarify that zoom is Z-axis movement. Full XYZ camera with pan(X,Y), zoom(Z), rotate(pitch/yaw/roll) | Extends F3 |
| **P11** | **Fractal/Iterative Function System** | Math Engine | Large | Very High | ✅ | Support for iterative functions: `z_n+1 = f(z_n)` with orbit visualization, escape-time coloring (Mandelbrot, Julia sets) | New |
| **P12** | **Gradient/Color Mapping** | Visualization | Medium | High | ✅ | Map function values to colors (heatmaps, phase plots). Configurable gradients, orbit coloring for fractals | New |

---

## Feature Proposals (Existing \+ Consolidated)

**Note**: Features marked with ✅ are approved. Some are consolidated into priority features above.

| ID | Feature Name | Category | Effort | Impact | Status | Description | Priority | User Notes |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| **F1** | **Space Transformation UI** | Visualization | Small | High | ✅ | Add UI controls for existing warp system (intensity sliders, transform type selector) | Medium |  |
| **F2** | **Curved Grid Rendering** | Visualization | Medium | High | ✅ | Make grid lines actually curve based on warp function (non-Euclidean geometry) | Medium |  |
| **F3** | **3D Scene Support** | Core Feature | Large | Very High | ⏳ | **→ CONSOLIDATED INTO P10** \- Three.js integration, volumetric grid, orbit camera | Medium | **Need to plan this better. How does this interact with Manim?** |
| **F4** | **Complex Number Visualization** | Math Engine | Medium | High | ✅ | Full complex arithmetic, phase/magnitude plots, conformal mappings. **Supports P11** | High |  |
| **F5** | **List-Based Plotting** | Math Engine | Medium | High | ✅ | **→ CONSOLIDATED INTO P1** \- Desmos-style `n=[0...Z-1]` syntax | High |  |
| **F6** | **Parametric Curves** | Plotting | Small | Medium | ✅ | Plot `x(t), y(t)` parametric functions (not just y \= f(x)) | High |  |
| **F7** | **Polar Coordinates** | Plotting | Medium | Medium | ✅ | Plot `r(θ)` in polar mode, circular grid | High |  |
| **F8** | **Keyboard Shortcuts** | UX | Small | High | ⏳ | Space=play, ←→=keyframes, Ctrl+S=save, K=add keyframe, etc. | Low |  |
| **F9** | **Undo/Redo System** | UX | Medium | High | ⏳ | Command pattern for all state changes, Ctrl+Z/Y | Low |  |
| **F10** | **Multi-Select Parameters** | UX | Small | Medium | ⏳ | Select multiple params to batch-edit, group, or keyframe together | Low |  |
| **F11** | **Parameter Folders/Groups** | Organization | Small | Medium | ⏳ | Organize parameters into collapsible folders (like Desmos) | Low |  |
| **F12** | **Advanced Coloring System** | Visualization | Large | **CRITICAL** | ✅ | **RENAMED & ELEVATED**: Programmatic gradients, coloring functions, proximity-based coloring, tension/heat maps. Goes beyond simple color picker to support Mandelbrot-style escape-time coloring, distance fields, mathematical function-based colors. **CONSOLIDATED WITH P12** | **CRITICAL** | **User Note**: "How do we shade a plane and show tension on it or some parameter's impact via the visuals. Maybe color a plane relative to its proximity to some path. This is VERY IMPORTANT and COMPLEX - needs to be fleshed out completely. What would Desmos/GeoGebra do and how do we do it better/more powerful/more elegant?" |
| **F13** | **Grid Snap Toggle** | UX | Small | Low | ✅ | Snap camera/values to grid increments | High |  |
| **F14** | **Quadrant/Region Bookmarks** | UX | Small | Medium | ✅ | **ENHANCED**: Snap to sectors/regions: (+x,+y), (+x,-y), (-x,+y), (-x,-y), all-quadrants. Each bookmark includes optimal z/zoom for showing the region properly. | Medium | **User Note**: "Should be more like snap to sector or regions, not just arbitrary positions. Need to set z or zoom relative to showing the right space." |
| **F15** | **Expression Autocomplete** | UX | Medium | Medium | ⏳ | Suggest parameter names, functions while typing | Low | Would be better suited to only do this for greeks. Consider most common use case would be coping output from markdown from AI models and desmos.  |
| **F16** | **Live Error Preview** | UX | Small | High | ⏳ | Show expression errors inline as you type (before submitting) |  | Not sure if we need this debugging or its nice to have? |
| **F17** | **Function Statistics Panel** | Analysis | Small | Medium | ✅ | **→ EXTENDED BY P4, P5** \- Show min/max/zeros/asymptotes for selected function | **Unknown** |  |
| **F18** | **Derivative/Integral Plotting** | Math Engine | Medium | High | ✅ | Plot f'(x) and ∫f(x)dx alongside f(x) |  | What would desmos do? |
| **F19** | **Vector Field Plotting** | Visualization | Large | High | ✅ | Plot 2D vector fields: F(x,y) \= \<P(x,y), Q(x,y)\> | High |  |
| **F20** | **Implicit Function Plotting** | Plotting | Large | High | ✅ | Plot x² \+ y² \= r² style equations (contour plotting) | High | Think this is critical relative to how we handle parameters and function parsing and parameter checks |
| **F21** | **Animation Presets** | Timeline | Small | Medium | ⏳ | Pre-built animation templates (zoom in, rotate, oscillate) | Very Low |  |
| **F22** | **Keyframe Interpolation Curves** | Timeline | Medium | Medium | ✅ | Custom Bezier curves for easing (not just presets) | Low | Low priority  |
| **F23** | **Multi-Layer Rendering System** | Timeline | Large | High | ✅ | **ENHANCED**: Beyond multi-track timeline - support rendering to multiple layers/PNGs that can be composited. Critical for massive datasets (100M+ points) - break into layers and stack PNGs. Requires tree/planning UI in separate widget. | Medium | **User Note**: "More critically than timeline tracks: multi-layer rendering. When rendering hundreds of millions of points, break down to many layers on output and composite PNGs on top of one another." |
| **F24** | **Manim Live Render** | Export | Large | High | ✅ | Subprocess integration to render Manim video directly from app | Unknown | Do we need this for core functionality? |
| **F25** | **Canvas Video Export** | Export | Large | **HIGH** | ✅ | **CRITICAL QUESTION**: Real-time canvas recording to video (no Manim). If this works, fundamentally changes export strategy. | **HIGH** | **User Note**: "If we can do this, what's the point of Manim? NEED TO DIVE DEEPER into canvas video recording vs Manim quality/features." **INVESTIGATION REQUIRED** |
| **F26** | **GIF/Video Export (Canvas)** | Export | Small | Medium | ✅ | **MERGED WITH F25**: Export timeline as animated GIF or video directly from canvas (no Manim needed) | Low | Low Priority - same as F25 |
| **F27** | **Multi-Format Image Export** | Export | Medium | Medium | ✅ | **GENERALIZED**: Export current frame in multiple formats: PNG, SVG, JPEG, WebP. Unified export dialog. | Low | **User Note**: "Should be general 'Image' export with different formats, not just SVG." |
| **F28** | **LaTeX Overlay System** | Annotations | Medium | High | ✅ | **CRITICAL**: LaTeX text/equations as annotations. **Design Question**: How to render LaTeX in real-time canvas viewer vs Manim export? Need KaTeX for browser, but Manim uses different system. | High | **User Note**: "Core Manim function. Need to figure out translation between real-time viewer and Manim render." **DESIGN REQUIRED** |
| **F29** | **Point/Line Annotations** | Annotations | Small | Medium | ⏳ | Mark specific points, draw reference lines | High |  |
| **F30** | **Dark/Light Theme Toggle** | UI | Small | Low | ✅ | User preference for dark vs light mode | Low |  |
| **F31** | **Preset Import/Export** | Config | Small | Medium | ✅ | Share grid styles/color schemes as files | Medium | Ties to F32,**F48**This is important as we can preload and define some core experiments and things i want to visualize in the sandbox of the app we are building. Dont know what .pkstudio files are though. But the idea should be even though i am building a general use case app, lets build a ‘user project’ or template that is what i want to be plotting. That way we can work backwards making sure the program is as general as I want but still fit the specific use cases. |
| **F32** | **Project Templates** | Workflow | Medium | High | ⏳ | Start from templates (calculus, physics, complex analysis, fractals) | Very Low | Very Low Priority  |
| **F33** | **Collaborative Editing** | Advanced | X-Large | Medium | ❌ | Real-time multi-user editing (WebRTC/WebSockets) | N/A |  |
| **F34** | **Cloud Storage Integration** | Advanced | Large | Low | ⏳ | Save/load from Google Drive, Dropbox, etc. | Very Low | Very Low Priority  |
| **F35** | **Command Palette** | UX | Small | High | ✅ | Ctrl+K to search all commands/settings | High |  |
| **F36** | **Web Workers for Eval** | Performance | Medium | High | ✅ | **→ EXTENDED BY P8** \- Offload expression evaluation to background thread | High |  |
| **F37** | **Canvas Off-Screen Rendering** | Performance | Medium | Medium | ✅ | Pre-render to off-screen canvas for smoother playback | High |  |
| **F38** | **Memoization Cache** | Performance | Small | Medium | ✅ | Cache expensive calculations (already partial support) | High |  |
| **F39** | **Progressive Rendering** | Performance | Medium | High | ✅ | **→ CONSOLIDATED INTO P9** \- Low quality while animating, high quality on idle | High |  |
| **F40** | **Mobile/Tablet Support** | Accessibility | Large | Medium | ✅ | Touch gestures, responsive layout | Very Low | Very Low Priority  |
| **F41** | **Screen Reader Support** | Accessibility | Medium | Low | ✅ | ARIA labels, keyboard nav improvements | Very Low | Very Low Priority  |
| **F42** | **High Contrast Mode** | Accessibility | Small | Low | ✅ | Accessibility preset for vision impairment | Very Low | Very Low Priority  |
| **F43** | **Unit Tests Expansion** | Quality | Medium | High | ✅ | Increase coverage from current to 100% | High |  |
| **F44** | **Integration Tests** | Quality | Medium | High | ✅ | End-to-end workflow tests | High |  |
| **F45** | **CI/CD Pipeline** | DevOps | Medium | Medium | ✅ | GitHub Actions for auto-test and deploy | High |  |
| **F46** | **Documentation Site** | Docs | Large | High | ⏳ | Full docs website with tutorials, examples | High | CRITICAL\! Should be more KISS just a Docs page or view route in the app itself. We will actually use this for the documentation of the app and context for more AI work so this might be CRITICAL. NOT a full website, tutorial, examples. Basic MD reader for MD documents in the some folder in the app. This would include the read me. Changes logs, how to guides, etcs. We need some basic sorting, and navigation between types of content in the folder so many some meta data it it would be needed to know how to sort each doc when read in the app (and to help an AI too). So then we’d we’d also update [`Agents.md`](http://Agents.md) and [`Claude.md`](http://Claude.md) files to point to this folder for the Ai to learn more about the project as need as its own knowledge base and context repo. |
| **F47** | **Video Tutorials** | Docs | Large | Medium | ❌ | YouTube series on using the tool | N/A |  |
| **F48** | **Example Projects Gallery** | Docs | Medium | High | ⏳ | Pre-built .pkstudio files showcasing features (including Mandelbrot, tessellations) | Unknown |  |
| **F49** | **Plugin System** | Architecture | X-Large | High | ❌ | Allow custom transforms, plotters, exporters via plugins | N/A |  |
| **F50** | **WebAssembly Math Engine** | Performance | X-Large | Medium | ⏳ | Rewrite core math in Rust/WASM for speed | Unknown | What kind of difference would this make? |

---

## Quick Category Summary

| Category | Count | Top Priority Candidates |
| :---- | :---- | :---- |
| **Visualization** | 5 | F1, F2, F19 (vector fields) |
| **Math Engine** | 5 | F4 (complex), F5 (lists), F18 (derivatives) |
| **Plotting** | 4 | F6 (parametric), F7 (polar), F20 (implicit) |
| **UX** | 11 | F8 (shortcuts), F9 (undo), F35 (command palette) |
| **Timeline** | 3 | F23 (multi-track), F22 (bezier curves) |
| **Export** | 5 | F24 (live Manim), F26 (GIF), F27 (SVG) |
| **Annotations** | 2 | F28 (LaTeX), F29 (point markers) |
| **Performance** | 4 | F36 (web workers), F39 (progressive) |
| **Accessibility** | 3 | F40 (mobile), F41 (screen reader) |
| **Quality/DevOps** | 3 | F43 (tests), F45 (CI/CD) |
| **Docs** | 3 | F46 (docs site), F48 (examples) |
| **Advanced** | 3 | F49 (plugins), F33 (collaborative) |

---

## Notes for Prioritization

### Quick Wins (Small Effort, High Impact)

- **F1**: Space transform UI controls  
- **F8**: Keyboard shortcuts  
- **F16**: Live error preview  
- **F35**: Command palette

### Game Changers (High Impact, Worth the Effort)

- **F3**: 3D scene support  
- **F4**: Complex number visualization  
- **F19**: Vector field plotting  
- **F24**: Manim live render  
- **F32**: Project templates  
- **F46**: Documentation site  
- **F49**: Plugin system

### Low Priority (Low Impact or X-Large Effort)

- **F12**: Function color picker (cosmetic)  
- **F13**: Grid snap (minor convenience)  
- **F30**: Dark/light theme (already has grid styles)  
- **F33**: Collaborative editing (complex, niche use case)  
- **F50**: WebAssembly (premature optimization)

---

## 📋 Implementation Plan & Git Workflow

### Phase Breakdown (Recommended Order)

#### **PHASE 9: Data Pipeline Foundation** (Weeks 1-2)

**Goal**: Enable Mandelbrot sets, tessellations, advanced geometric visualization

| Feature | Branch Name | Estimated Days | Dependencies |
| :---- | :---- | :---- | :---- |
| **P1** \- Coordinate Point/List Plotting | `feature/P1-coordinate-plotting` | 3-4 | None |
| **P7** \- Multi-Value Function Handling | `feature/P7-multi-value-functions` | 5-6 | P1 |
| **P9** \- Adaptive Point Sampling | `feature/P9-adaptive-sampling` | 2-3 | P1, P7 |
| **P12** \- Gradient/Color Mapping | `feature/P12-gradient-coloring` | 3-4 | P1 |

**Deliverable**: Can plot `k=([0..100],[0..100])` with color gradients

---

#### **PHASE 10: Fractal & Iterative Systems** (Weeks 3-4)

**Goal**: Mandelbrot/Julia set rendering

| Feature | Branch Name | Estimated Days | Dependencies |
| :---- | :---- | :---- | :---- |
| **P11** \- Fractal/Iterative Functions | `feature/P11-fractal-system` | 6-7 | P1, P7, P12 |
| **F4** \- Complex Number Visualization | `feature/F4-complex-numbers` | 4-5 | P11 |
| **P8** \- GPU-Accelerated Rendering | `feature/P8-gpu-rendering` | 7-10 | P1, P7 |

**Deliverable**: Fully functional Mandelbrot set with escape-time coloring

---

#### **PHASE 11: Advanced Geometry** (Weeks 5-6)

**Goal**: Polygons, path analysis, intersections

| Feature | Branch Name | Estimated Days | Dependencies |
| :---- | :---- | :---- | :---- |
| **P2** \- Polygon Rendering | `feature/P2-polygons` | 2-3 | P1 |
| **P3** \- Advanced Path Rendering | `feature/P3-advanced-paths` | 4-5 | P1, P2 |
| **P4** \- Function Path Calculations | `feature/P4-path-calcs` | 3-4 | P1, P3 |
| **P5** \- Polygon/Area Analysis | `feature/P5-area-analysis` | 2-3 | P2 |
| **P6** \- Intersection Geometry | `feature/P6-intersections` | 4-5 | P1, P2 |

**Deliverable**: Full geometric analysis suite

---

#### **PHASE 12: 3D & Advanced Visualization** (Weeks 7-9)

**Goal**: 3D scenes, vector fields, space transformations

| Feature | Branch Name | Estimated Days | Dependencies |
| :---- | :---- | :---- | :---- |
| **P10** \- 3D Camera System | `feature/P10-3d-camera` | 5-6 | None |
| **F3** \- 3D Scene Support | `feature/F3-3d-scene` | 10-12 | P10 |
| **F19** \- Vector Field Plotting | `feature/F19-vector-fields` | 4-5 | F3 optional |
| **F1** \- Space Transformation UI | `feature/F1-warp-ui` | 2-3 | None |
| **F2** \- Curved Grid Rendering | `feature/F2-curved-grid` | 4-5 | F1 |

**Deliverable**: 3D volumetric visualization with warps

---

#### **PHASE 13: UX & Productivity** (Weeks 10-11)

**Goal**: Professional workflow improvements

| Feature | Branch Name | Estimated Days | Dependencies |
| :---- | :---- | :---- | :---- |
| **F8** \- Keyboard Shortcuts | `feature/F8-shortcuts` | 2-3 | None |
| **F9** \- Undo/Redo System | `feature/F9-undo-redo` | 4-5 | None |
| **F35** \- Command Palette | `feature/F35-command-palette` | 3-4 | None |
| **F16** \- Live Error Preview | `feature/F16-error-preview` | 2-3 | None |
| **F15** \- Expression Autocomplete | `feature/F15-autocomplete` | 3-4 | None |

**Deliverable**: Power-user features operational

---

#### **PHASE 14: Advanced Math** (Weeks 12-13)

**Goal**: Calculus, parametric, polar, implicit functions

| Feature | Branch Name | Estimated Days | Dependencies |
| :---- | :---- | :---- | :---- |
| **F6** \- Parametric Curves | `feature/F6-parametric` | 3-4 | None |
| **F7** \- Polar Coordinates | `feature/F7-polar` | 4-5 | None |
| **F18** \- Derivative/Integral Plotting | `feature/F18-calculus` | 5-6 | None |
| **F20** \- Implicit Function Plotting | `feature/F20-implicit` | 6-7 | None |

**Deliverable**: Full mathematical function suite

---

#### **PHASE 15: Export & Rendering** (Weeks 14-15)

**Goal**: Production-quality output

| Feature | Branch Name | Estimated Days | Dependencies |
| :---- | :---- | :---- | :---- |
| **F24** \- Manim Live Render | `feature/F24-live-manim` | 5-6 | None |
| **F25** \- Video Preview | `feature/F25-video-preview` | 3-4 | F24 |
| **F26** \- GIF Export | `feature/F26-gif-export` | 2-3 | None |
| **F27** \- SVG Export | `feature/F27-svg-export` | 3-4 | None |

**Deliverable**: Multi-format export pipeline

---

#### **PHASE 16: Annotations & Timeline** (Weeks 16-17)

**Goal**: Professional presentation features

| Feature | Branch Name | Estimated Days | Dependencies |
| :---- | :---- | :---- | :---- |
| **F28** \- LaTeX Overlay | `feature/F28-latex-overlay` | 4-5 | None |
| **F29** \- Point/Line Annotations | `feature/F29-annotations` | 2-3 | None |
| **F23** \- Multi-Track Timeline | `feature/F23-multitrack` | 7-8 | None |
| **F22** \- Custom Bezier Easing | `feature/F22-bezier-easing` | 3-4 | None |
| **F21** \- Animation Presets | `feature/F21-anim-presets` | 2-3 | None |

**Deliverable**: Professional animation authoring

---

#### **PHASE 17: Polish & Deployment** (Weeks 18-20)

**Goal**: Production-ready deployment

| Feature | Branch Name | Estimated Days | Dependencies |
| :---- | :---- | :---- | :---- |
| **F32** \- Project Templates | `feature/F32-templates` | 4-5 | All above |
| **F48** \- Example Projects Gallery | `feature/F48-examples` | 5-6 | F32 |
| **F45** \- CI/CD Pipeline | `feature/F45-cicd` | 3-4 | None |
| **F46** \- Documentation Site | `feature/F46-docs` | 7-10 | All above |
| **F40** \- Mobile/Tablet Support | `feature/F40-mobile` | 6-8 | None |

**Deliverable**: v2.0.0 release

---

### Git Branching Strategy

main (v1.0.0 \- MVP Complete)

  ↓

develop (integration branch for v2.0.0)

  ↓

  ├─ feature/P1-coordinate-plotting → merge to develop

  ├─ feature/P7-multi-value-functions → merge to develop

  ├─ feature/P9-adaptive-sampling → merge to develop

  ├─ feature/P11-fractal-system → merge to develop

  └─ ... (all features merge to develop)

develop (when stable) → merge to main → tag v2.0.0

### Protection Rules

1. **`main` branch**: Protected, production-ready only

   - No direct commits  
   - Requires PR approval  
   - Must pass all tests  
   - Tagged releases only (v1.0.0, v2.0.0, etc.)  
2. **`develop` branch**: Integration branch

   - Feature branches merge here  
   - Continuous testing  
   - Can be unstable  
   - Release candidates cut from here  
3. **Feature branches**: Short-lived, single-purpose

   - Branch from `develop`  
   - Naming: `feature/[ID]-[short-name]`  
   - Delete after merge  
   - Must pass tests before merge

### Workflow Commands

\# Initial setup (ONE TIME)

git checkout main

git checkout \-b develop

git push \-u origin develop

\# Starting new feature

git checkout develop

git pull origin develop

git checkout \-b feature/P1-coordinate-plotting

\# Work on feature

git add .

git commit \-m "feat(P1): Add coordinate point plotting"

git push \-u origin feature/P1-coordinate-plotting

\# Create PR: feature/P1 → develop

\# After approval and merge:

git checkout develop

git pull origin develop

git branch \-d feature/P1-coordinate-plotting

\# When develop is stable (all Phase 9-17 features complete)

git checkout main

git merge develop

git tag \-a v2.0.0 \-m "Release v2.0.0 \- Advanced Geometry & Data Analysis"

git push origin main \--tags

---

## 🎯 Immediate Next Steps

### Step 1: Create `develop` branch

git checkout \-b develop

git push \-u origin develop

### Step 2: Start Phase 9 (Data Pipeline Foundation)

Begin with **P1 \- Coordinate Point/List Plotting** as it's the foundation for all advanced features:

git checkout develop

git checkout \-b feature/P1-coordinate-plotting

### Step 3: Implementation Checklist for P1

- [ ] Extend ExpressionEngine to handle tuple syntax: `(x, y)`  
- [ ] Add list range parser: `[0..Z]`, `[0,1,2,3]`  
- [ ] Create PointPlotter class (similar to FunctionPlotter)  
- [ ] Add point rendering to Viewport  
- [ ] Update FunctionPanel UI to support coordinate input  
- [ ] Add tests for coordinate parsing  
- [ ] Documentation & examples

### Step 4: Test & Merge

npm run test

npm run build

\# If all pass:

git push origin feature/P1-coordinate-plotting

\# Create PR → develop

---

## 📊 Timeline Summary

| Phase | Duration | Features | Milestone |
| :---- | :---- | :---- | :---- |
| 9 | 2 weeks | P1, P7, P9, P12 | Data pipeline ready |
| 10 | 2 weeks | P11, F4, P8 | Fractals working |
| 11 | 2 weeks | P2-P6 | Geometry complete |
| 12 | 3 weeks | P10, F3, F19, F1, F2 | 3D operational |
| 13 | 2 weeks | F8, F9, F35, F15, F16 | UX polished |
| 14 | 2 weeks | F6, F7, F18, F20 | Advanced math done |
| 15 | 2 weeks | F24-F27 | Export complete |
| 16 | 2 weeks | F28, F29, F21-F23 | Presentation ready |
| 17 | 3 weeks | F32, F48, F45, F46, F40 | v2.0.0 release |

**Total**: \~20 weeks (5 months) to v2.0.0

---

## ✅ Ready to Begin\!

All features approved. Git workflow defined. Implementation phases organized.

**Current status**: On `main` branch with v1.0.0 MVP **Next action**: Create `develop` branch and start feature/P1-coordinate-plotting

Let me know when you're ready to begin Phase 9\! 🚀

