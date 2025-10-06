# 🎯 EXECUTION PLAN - Manim Director Suite v2.0

**Created**: 2025-10-06
**Based On**: User feedback on FEATURE_PROPOSALS.md
**Current Version**: v1.0.0 (MVP Complete)
**Target**: High & Medium priority features in logical dependency order

---

## 📋 Executive Summary

This document defines the ACTUAL implementation order based on:
1. ✅ User-assigned priorities (High/Medium/Low)
2. ✅ Technical dependencies
3. ✅ Logical development flow
4. ⚠️ Critical design questions that need investigation

**Focus**: Implement High & Medium priority features ONLY. Skip Low/Very Low.

---

## 🚨 CRITICAL DESIGN QUESTIONS (Investigate First)

Before starting implementation, we need to answer these fundamental questions:

### Q1: Canvas Video Export vs Manim - Strategy Decision
**User Question**: "If we can do video export from canvas, what's the point of Manim?"

**Investigation Needed**:
- Research MediaRecorder API for canvas recording
- Compare quality: Canvas recording vs Manim-rendered video
- Test performance: Can canvas maintain 60 FPS during recording?
- Feature comparison: What does Manim provide that canvas doesn't?
  - LaTeX rendering quality
  - Vector graphics vs raster
  - Mathematical precision
  - Professional animation features

**Impact**: If canvas video works well, could simplify entire export pipeline
**Timeline**: 2-3 days research before Phase 1
**Decision Point**: Determines if we prioritize F24 (Manim Live) or F25 (Canvas Video)

---

### Q2: Advanced Coloring System - Architecture Design
**User Note**: "This is VERY IMPORTANT and COMPLEX - needs to be fleshed out completely"

**What needs design**:
1. **Coloring Modes**:
   - Escape-time (Mandelbrot-style)
   - Distance fields (proximity to paths/curves)
   - Tension/heat maps (parameter impact visualization)
   - Mathematical function-based colors
   - Gradient rules and parameters

2. **Questions**:
   - How do users define coloring functions?
   - UI for gradient editor?
   - Performance for real-time coloring of 100K+ points?
   - Integration with GPU renderer?

**Comparison Research**:
- What does Desmos do? (limited coloring)
- What does GeoGebra do? (parameter-based coloring)
- How can we do it better/more powerful/more elegant?

**Impact**: Core to fractal rendering (P11) and data visualization
**Timeline**: 3-4 days design + prototyping before Phase 2
**Deliverable**: Coloring system spec document

---

### Q3: 3D Scene + Manim Integration
**User Question**: "Need to plan this better. How does this interact with Manim?"

**Investigation Needed**:
- Manim 3D capabilities (what can it render?)
- Three.js → Manim export path (how to translate?)
- Should we:
  - Option A: Keep 3D preview-only, export to Manim 2D projections
  - Option B: Full 3D Manim integration
  - Option C: Separate 3D canvas export (skip Manim for 3D)

**Impact**: Determines Phase 12 scope and complexity
**Timeline**: 2-3 days research
**Decision Point**: Before starting P10 (3D Camera System)

---

### Q4: LaTeX Rendering - Viewer vs Export
**User Note**: "Need to figure out translation between real-time viewer and Manim render"

**Technical Challenge**:
- Real-time viewer: Use KaTeX (browser-based, fast)
- Manim export: Uses LaTeX + dvisvgm (different system)
- How to ensure consistency?

**Design Options**:
- Option A: Dual rendering - KaTeX for preview, LaTeX commands for Manim
- Option B: Pre-render LaTeX to SVG, embed in both systems
- Option C: WebAssembly LaTeX engine (consistent everywhere)

**Impact**: Critical for F28 (LaTeX Overlay)
**Timeline**: 2-3 days prototyping
**Deliverable**: LaTeX rendering strategy document

---

## 🔥 PHASE 1: Core Data Pipeline (Weeks 1-3)
**Goal**: Enable Mandelbrot sets, tessellations, massive point datasets

### Priority Order (by dependency)

| Order | ID | Feature | Days | Why Now? |
|-------|-----|---------|------|----------|
| 1.1 | **P1** | Coordinate Point/List Plotting | 4 | **Foundation** - everything depends on this |
| 1.2 | **F4** | Complex Number Visualization | 5 | Required for P11 (fractals) |
| 1.3 | **F20** | Implicit Function Plotting | 6 | **User: "Critical for parameter/function parsing"** |
| 1.4 | **P7** | Multi-Value Function Handling | 6 | Needed before GPU rendering |
| 1.5 | **Q2** | Advanced Coloring System Design | 4 | **DESIGN PHASE** - spec before implementation |
| 1.6 | **P12** | Gradient/Color Mapping | 5 | Implements coloring system spec |

**Total**: ~30 days (6 weeks with design)

**Deliverable**: Can plot `k=([0..1000],[0..1000])` with complex numbers and programmatic coloring

**Branch Strategy**:
```bash
git checkout -b develop
git checkout -b feature/P1-coordinate-plotting
# ... implement, test, merge to develop
git checkout -b feature/F4-complex-numbers
# ... etc
```

---

## 🎨 PHASE 2: Fractal & Performance (Weeks 4-6)
**Goal**: Mandelbrot/Julia sets with GPU acceleration

| Order | ID | Feature | Days | Why Now? |
|-------|-----|---------|------|----------|
| 2.1 | **P11** | Fractal/Iterative Function System | 7 | Depends on P1, F4, P12 |
| 2.2 | **P9** | Adaptive Point Sampling | 3 | Performance for massive datasets |
| 2.3 | **P8** | GPU-Accelerated Rendering | 10 | **Critical** - WebGL shaders for 10K+ points |
| 2.4 | **F36** | Web Workers for Eval | 4 | Offload heavy math from main thread |
| 2.5 | **F37** | Canvas Off-Screen Rendering | 3 | Smoother playback |
| 2.6 | **F38** | Memoization Cache | 2 | Cache expensive calculations |

**Total**: ~29 days (6 weeks)

**Deliverable**: Fully functional Mandelbrot set rendering at 60 FPS with 10K+ points

---

## 📐 PHASE 3: Advanced Geometry (Weeks 7-8)
**Goal**: Polygons, paths, intersection analysis

| Order | ID | Feature | Days | Why Now? |
|-------|-----|---------|------|----------|
| 3.1 | **P2** | Polygon Rendering | 3 | Depends on P1 |
| 3.2 | **P3** | Advanced Path Rendering | 5 | Curved paths, modulo grouping |
| 3.3 | **P6** | Intersection Geometry | 5 | Find intersections (self & between functions) |
| 3.4 | **P4** | Function Path Calculations | 4 | Area under curve, arc length |
| 3.5 | **P5** | Polygon/Area Analysis | 3 | Area, perimeter, centroid |

**Total**: ~20 days (4 weeks)

**Deliverable**: Full geometric analysis suite

---

## 📊 PHASE 4: Advanced Math Functions (Weeks 9-10)
**Goal**: Parametric, polar, vector fields, calculus

| Order | ID | Feature | Days | Why Now? |
|-------|-----|---------|------|----------|
| 4.1 | **F6** | Parametric Curves | 4 | `x(t), y(t)` plotting |
| 4.2 | **F7** | Polar Coordinates | 5 | `r(θ)` mode with circular grid |
| 4.3 | **F19** | Vector Field Plotting | 6 | 2D vector fields: `F(x,y) = <P,Q>` |
| 4.4 | **F18** | Derivative/Integral Plotting | 5 | **User: "What would Desmos do?"** - Research + implement |

**Total**: ~20 days (4 weeks)

**Deliverable**: Complete mathematical function suite

---

## 🎬 PHASE 5: Export & Rendering Strategy (Weeks 11-12)
**Goal**: Decide on export approach, implement winning strategy

| Order | ID | Feature | Days | Why Now? |
|-------|-----|---------|------|----------|
| 5.1 | **Q1** | Canvas vs Manim Investigation | 3 | **DECISION POINT** - determines rest of phase |
| 5.2 | **F25** | Canvas Video Export (if viable) | 7 | OR F24 Manim Live Render |
| 5.3 | **F27** | Multi-Format Image Export | 3 | PNG, SVG, JPEG, WebP |
| 5.4 | **F23** | Multi-Layer Rendering System | 8 | **User: "Critical for 100M+ points"** - layer compositing |

**Total**: ~21 days (4 weeks + decision time)

**Deliverable**: High-quality export pipeline (canvas or Manim)

---

## 🎯 PHASE 6: Space & Visualization (Weeks 13-14)
**Goal**: Warps, transformations, quadrant navigation

| Order | ID | Feature | Days | Why Now? |
|-------|-----|---------|------|----------|
| 6.1 | **F1** | Space Transformation UI | 3 | UI controls for existing warps |
| 6.2 | **F2** | Curved Grid Rendering | 5 | Non-Euclidean grids |
| 6.3 | **F13** | Grid Snap Toggle | 2 | Snap camera/values to grid |
| 6.4 | **F14** | Quadrant/Region Bookmarks | 3 | **User: "Snap to sectors (+x,+y), etc"** |
| 6.5 | **F29** | Point/Line Annotations | 3 | Mark points, draw reference lines |

**Total**: ~16 days (3 weeks)

**Deliverable**: Enhanced spatial navigation and non-Euclidean visualization

---

## 📝 PHASE 7: Annotations & Documentation (Weeks 15-16)
**Goal**: LaTeX overlays, in-app docs system

| Order | ID | Feature | Days | Why Now? |
|-------|-----|---------|------|----------|
| 7.1 | **Q4** | LaTeX Rendering Strategy | 3 | **INVESTIGATION** - KaTeX vs Manim |
| 7.2 | **F28** | LaTeX Overlay System | 5 | Depends on Q4 decision |
| 7.3 | **F46** | In-App Documentation System | 6 | **User: "CRITICAL for AI context"** - MD reader in app |
| 7.4 | **F31** | Project Templates & Sandbox | 4 | **User: "Work backwards from specific use cases"** |

**Total**: ~18 days (4 weeks)

**Deliverable**: LaTeX annotations + AI-readable docs system

---

## 🚀 PHASE 8: Performance & Quality (Weeks 17-18)
**Goal**: Tests, CI/CD, command palette

| Order | ID | Feature | Days | Why Now? |
|-------|-----|---------|------|----------|
| 8.1 | **F35** | Command Palette | 4 | Ctrl+K for power users |
| 8.2 | **F43** | Unit Tests Expansion | 5 | 100% coverage |
| 8.3 | **F44** | Integration Tests | 5 | End-to-end workflows |
| 8.4 | **F45** | CI/CD Pipeline | 4 | GitHub Actions |
| 8.5 | **F30** | Dark/Light Theme | 2 | User preference |

**Total**: ~20 days (4 weeks)

**Deliverable**: Production-ready quality assurance

---

## ⏸️ DEFERRED FEATURES (Not in Execution Plan)

These are user-marked as **Low** or **Very Low** priority:

| ID | Feature | Priority | Reason to Defer |
|----|---------|----------|-----------------|
| F8 | Keyboard Shortcuts | Low | Nice-to-have UX |
| F9 | Undo/Redo System | Low | Not core functionality |
| F10 | Multi-Select Parameters | Low | Advanced UX |
| F11 | Parameter Folders/Groups | Low | Organization feature |
| F15 | Expression Autocomplete | Low | **User: "Only for Greeks"** |
| F16 | Live Error Preview | Unknown | **User: "Not sure if needed"** |
| F21 | Animation Presets | Very Low | Templates not critical |
| F22 | Custom Bezier Easing | Low | Already have presets |
| F32 | Project Templates | Very Low | Covered by F31 |
| F34 | Cloud Storage | Very Low | Nice-to-have |
| F40 | Mobile/Tablet | Very Low | Desktop-first |
| F41 | Screen Reader | Very Low | Accessibility later |
| F42 | High Contrast Mode | Very Low | Accessibility later |
| F47 | Video Tutorials | Rejected | Not needed |
| F48 | Example Projects Gallery | Unknown | Covered by F31 |
| F49 | Plugin System | Rejected | Premature |
| F50 | WebAssembly Math Engine | Unknown | **User: "What difference would this make?"** |

---

## ⚠️ SPECIAL CASES - Need 3D Planning

| ID | Feature | Status | Why Special? |
|----|---------|--------|--------------|
| **P10** | 3D Camera System | Medium | **User: "How does this interact with Manim?"** |
| **F3** | 3D Scene Support | Medium | Requires Q3 investigation |

**Decision**: Defer until Q3 (3D + Manim strategy) is resolved. Potentially becomes Phase 9 or v2.1 feature.

---

## 📊 Timeline Summary

| Phase | Weeks | Key Deliverable | Status |
|-------|-------|-----------------|--------|
| **INVESTIGATIONS** | 1-2 | Design decisions for Q1-Q4 | Before Phase 1 |
| **Phase 1** | 1-6 | Coordinate plotting + complex + coloring | Core |
| **Phase 2** | 7-12 | Fractals + GPU rendering | Core |
| **Phase 3** | 13-16 | Geometry analysis | Core |
| **Phase 4** | 17-20 | Advanced math functions | Core |
| **Phase 5** | 21-24 | Export strategy | Core |
| **Phase 6** | 25-27 | Space transformations | Enhancement |
| **Phase 7** | 28-31 | Annotations + docs | Enhancement |
| **Phase 8** | 32-35 | Quality & performance | Polish |

**Total**: 35 weeks (~8-9 months) for High/Medium priority features

---

## 🎯 Immediate Next Steps

### Week 0: Critical Investigations (Before coding)

1. **Q1 Investigation** (3 days): Canvas video export viability
   ```javascript
   // Test MediaRecorder API with canvas
   const stream = canvas.captureStream(60);
   const recorder = new MediaRecorder(stream, {
     mimeType: 'video/webm;codecs=vp9',
     videoBitsPerSecond: 8000000
   });
   // Compare quality vs Manim
   ```

2. **Q2 Design** (4 days): Advanced coloring system architecture
   - Research Desmos/GeoGebra coloring
   - Design coloring function DSL
   - Prototype gradient editor UI
   - Write spec document

3. **Q4 Design** (3 days): LaTeX rendering strategy
   - Test KaTeX rendering to canvas
   - Test SVG export from KaTeX
   - Design LaTeX → Manim translation layer

**Total**: 10 days investigation before coding starts

---

### Week 1: Setup Development Environment

```bash
# Create develop branch
git checkout -b develop
git push -u origin develop

# Start first feature
git checkout -b feature/P1-coordinate-plotting

# Install new dependencies (if needed from investigations)
npm install katex three @types/three
npm install --save-dev @types/katex
```

---

### Week 2-3: Implement P1 (Coordinate Plotting)

**Implementation Checklist**:
- [ ] Extend ExpressionEngine to parse tuple syntax: `(x, y)`
- [ ] Add list range parser: `[0..Z]` → `[0, 1, 2, ..., Z]`
- [ ] Handle mixed lists: `([0,1,2], a)` → 3 points
- [ ] Create PointPlotter class (similar to FunctionPlotter)
- [ ] Add point rendering modes: dots, circles, crosses
- [ ] Update FunctionPanelNew UI to support coordinate input
- [ ] Add coordinate validation
- [ ] Write unit tests for coordinate parsing
- [ ] Integration test: plot 1000-point grid
- [ ] Documentation + examples

**Success Criteria**:
```typescript
// User can input:
k = (0, 0)                  // Single point
k = ([0..10], [0..10])      // 121-point grid
k = ([0,1,2,3], 5)          // 4 points at y=5
```

---

## 🔄 Git Workflow

```bash
# For each feature:

# 1. Branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/[ID]-[name]

# 2. Implement feature
# ... code, test, document ...

# 3. Test locally
npm run test           # Unit tests
npm run build          # Production build
npm run dev            # Manual testing

# 4. Push and create PR
git add .
git commit -m "feat([ID]): [description]

- Implementation details
- Tests added
- Documentation updated

Closes #[issue-number]"

git push -u origin feature/[ID]-[name]

# 5. Create PR: feature/[ID] → develop
# 6. After merge, delete branch
git checkout develop
git pull origin develop
git branch -d feature/[ID]-[name]
```

---

## 📝 Notes & Decisions Log

### Decision Log Template
```markdown
**Decision**: [What was decided]
**Date**: YYYY-MM-DD
**Rationale**: [Why this decision]
**Impact**: [What this affects]
**Alternatives Considered**: [What else was considered]
```

### Key Decisions (To be filled as we go)

**D1: Canvas vs Manim Export**
- **Date**: TBD (after Q1 investigation)
- **Decision**: [TBD]
- **Rationale**: [TBD]

**D2: Coloring System Architecture**
- **Date**: TBD (after Q2 design)
- **Decision**: [TBD]
- **Rationale**: [TBD]

**D3: 3D + Manim Integration**
- **Date**: TBD (after Q3 investigation)
- **Decision**: [TBD]
- **Rationale**: [TBD]

**D4: LaTeX Rendering Strategy**
- **Date**: TBD (after Q4 design)
- **Decision**: [TBD]
- **Rationale**: [TBD]

---

## ✅ Ready to Execute!

**Current Status**: Week 0 - Investigations phase
**Next Milestone**: Complete Q1, Q2, Q4 investigations
**First Feature**: P1 - Coordinate Point/List Plotting

**When ready to begin**:
```bash
git checkout -b develop
git push -u origin develop
```

Then start investigations! 🚀
