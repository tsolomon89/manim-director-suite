# Manim Director Suite — Editor & Pipeline Spec (v0.1)

## 0) Purpose

A local-first desktop/web app for authoring math animations via **Markdown + TeX-style math** (Desmos/GeoGebra-like typing), with:

* Live preview (OpenGL) of expressions mapped to Manim objects.
* **Parameter lifting** (turn numeric literals into named parameters).
* **Keyframes** and **tweening** across parameters.
* Deterministic final render with Manim.
* Optional **analysis hooks** for data/ML post-processing.

The goal: type expressions like

* `b=\sin\left(x\cdot f\left(k\right)\right)`
* `d=\left[1+\frac{1}{-e^{i\tau t\,\frac{1}{4}}},1+e^{i\tau t\,\frac{1}{4}},3-e^{i\tau t\,\frac{1}{4}},3+\frac{1}{e^{i\tau t\,\frac{1}{4}}}\right]`
  …see a live preview, record keyframes for parameters, then tween & render with Manim.

---

## 1) Input Language (Authoring)

**Document format**: Markdown with TeX math delimiters.

* **Inline math**: `$ … $` or `\( … \)`
* **Display math**: `$$ … $$` or `\[ … \]`
* **Expressions** are entered as lines (like Desmos). Each line can be an assignment or a drawable:

  * Assignment: `a=2.5`, `f(x)=\sin(\tau x)`
  * Drawable: `y=\sin(x)`, parametric, implicit, lists, piecewise, etc.

**Constants/symbols** (built-in): `\tau, \pi, e, i` with complex mode toggle.

**Typing shortcuts (editor assists)**

* `/` → `\frac{▮}{▮}`
* `sqrt` → `\sqrt{▮}`
* `^` after selection → wrap in `{}`
* `sin`/`cos`/`tan`/`exp` → `\sin(▮)` etc.
* `vec` → `\left[▮,▮,▮\right]`
* `join(` autocompletes comma-separated list; supports nested.
* Brackets auto-pair: `() [] {}` with cursor placement.

**Expression kinds**

* **Cartesian**: `y = f(x)` or `f(x)=…` then `y=f(x)`
* **Parametric**: `\left\{ x(t),\, y(t) \right\}` with `t\in[a,b]` (domain via separate control or inline tag, see §2.4)
* **Implicit**: `F(x,y)=0`
* **Lists/Vectors**: `\left[ e_1, e_2, … \right]` (supports `join(...)`)
* **Piecewise**: `\begin{cases} e_1 & c_1 \\ e_2 & c_2 \end{cases}`

---

## 2) Parameter Lifting & Annotation

**Rule**: Numeric literals eligible for animation can be **lifted** into named parameters. The editor provides two ways:

### 2.1 Automatic lift (opt-in)

* Select a numeric literal (e.g., `1/4` in `e^{i\tau t\,1/4}`) → `Make parameter…` → choose a **name** and optional range.
* The literal is replaced by a symbol (e.g., `q`) and registered as a parameter with a `ValueTracker`.

### 2.2 Inline tag syntax (author-controlled)

* Append a **tag** to the expression line or to a selected symbol:

  * **Parameter tag**: `#param(name=q, min=-2, max=2, default=0.25, ease=smooth)`
  * **Domain tag**: `#domain(t=[0,1])`
  * **Style tag**: `#style(color="#c33", stroke=2, fill=none)`
* Tags can appear at line-end or in a separate metadata panel. Multiple tags allowed: `… #param(name=q,…) #domain(t=[0,1])`.

### 2.3 Registry (single source of truth)

The app maintains a **Parameter Registry**:

```json
{
  "params": {
    "q": {"min": -2, "max": 2, "default": 0.25, "ease": "smooth"},
    "k": {"min": 0,  "max": 10, "default": 1}
  }
}
```

### 2.4 Domains & time

* Parametric `t` defaults to `[0,1]` unless tagged. Global playback time `T` is independent from parametric symbols; maps to keyframe time.

---

## 3) Intermediate Representation (IR)

**Purpose**: decouple authoring/Desmos-JSON from Manim.

```json
{
  "version": 1,
  "scene": {
    "width": 14.222, "height": 8.0, "axes": {"x": [-4,4,1], "y": [-3,3,1]}
  },
  "expressions": [
    {
      "id": "e1",
      "latex": "y=\\sin(q\\,x)",
      "kind": "cartesian",
      "symbols": ["x","q"],
      "params": ["q"],
      "domain": {},
      "style": {"stroke": 3, "color": "#000"}
    },
    {
      "id": "e2",
      "latex": "\\left[1+\\frac{1}{-e^{i\\tau t\\,q}}, 1+e^{i\\tau t\\,q}, 3-e^{i\\tau t\\,q}, 3+\\frac{1}{e^{i\\tau t\\,q}}\\right]",
      "kind": "list",
      "symbols": ["t","q"],
      "params": ["q"],
      "domain": {"t": [0,1]}
    }
  ],
  "params": {
    "q": {"min": 0, "max": 1, "default": 0.25, "ease": "smooth"}
  }
}
```

---

## 4) Keyframes & Tweening

**Keyframe file** (per scene):

```json
{
  "version": 1,
  "fps": 30,
  "params": ["q","k"],
  "frames": [
    {"t": 0.0, "values": {"q": 0.25, "k": 1}},
    {"t": 2.0, "values": {"q": 0.75}},
    {"t": 5.0, "values": {"q": 0.1, "k": 3}, "easing": "linear"}
  ]
}
```

**Playback**: Between consecutive frames, animate each `ValueTracker` to the target with `run_time = Δt` and `rate_func = easing`.

**Easing**: `linear | smooth | ease_in | ease_out | cubic_bezier(a,b,c,d)`.

**Deterministic render**: same file drives both preview and final render.

---

## 5) Desmos JSON Import

**Source**: `expressions.list` array with objects: `{ latex, color, hidden, fill, lineStyle, points, … }`.

**Mapping** (selected):

* `latex` → IR.latex (normalized TeX)
* `hidden` → IR.style.visible=false
* `color`/`lineStyle` → IR.style
* Table/Lists → IR.kind=`list`, items → child expressions
* Restrictions/domain → IR.domain (e.g., `t∈[a,b]`)
* Numeric literals annotated/lifted via tag UI after import

**Complex mode**: If Desmos state has complex toggled, import as such; otherwise allow explicit `#complex(true)` tag.

---

## 6) Rendering Pipeline

### 6.1 Live Preview (local)

* **Renderer**: ManimCE OpenGL.
* **Scene**: A persistent Python process hosts a `PreviewScene` that constructs Manim objects from the IR, wrapping drawables in `always_redraw(lambda: …)` that reference `ValueTracker`s.
* **Bridge**: UI edits send small JSON diffs over IPC (ZeroMQ/WebSocket/QLocalSocket). The scene applies diffs and redraws.

### 6.2 Final Render

* Batch runner loads the same IR + Keyframes and performs `self.play(tracker.animate.set_value(…), run_time=…)` sequences to generate mp4/gif.
* Output frame digests + per-frame metrics (if enabled) are emitted for provenance.

---

## 7) Analysis Hooks (optional)

A Python hook interface evaluated per frame or per segment:

```python
class AnalysisHook:
    def on_segment_start(self, t0, t1, params, scene): pass
    def on_frame(self, t, params, scene): pass
    def on_segment_end(self, t1, params, scene): pass
```

Examples: sample intersections, curvature, areas, distances; dump to CSV/Parquet; run ML post-pass.

---

## 8) UI Architecture

**Option A (Desktop-first)**

* **Shell**: PySide6 / PyQt6.
* **Editor**: Monaco or QCodeEditor with Markdown+TeX highlighting and snippet engine.
* **Math typeset**: KaTeX in a side preview panel.
* **Timeline**: QGraphicsView-based ruler + keyframe lanes.
* **IPC**: QLocalSocket or websockets to the preview process.

**Option B (Local web/Electron)**

* **Frontend**: React + Vite; CodeMirror 6 + math snippets; KaTeX preview.
* **Backend**: FastAPI/Uvicorn spawns the Manim preview process; Electron wraps both for a packaged desktop app.

---

## 9) Editor Behaviors (Detailed)

### 9.1 Snippets/expansions

* `/` → `\frac{•}{•}` (tabstops)
* `sqrt` → `\sqrt{•}`
* `sin`/`cos`/`tan`/`exp` → `\sin(•)` etc.
* `vec` → `\left[•,•\right]`
* `join(` → inserts `join(•,•)` with n-argument support.
* Auto-insert `\left`/`\right` for `()` and `[]` when size grows.

### 9.2 Linting

* Parenthesis/bracket balance
* Unknown symbols vs parameter registry
* Domain-tag consistency (warn if using `t` without a domain in parametric forms)

### 9.3 Lift Parameter UX

* Cursor on number → `Alt+P` opens dialog to create `#param` with default range.
* Registry panel lists all parameters; sliders live-link to preview.

---

## 10) Semantics Mapping to Manim

* **Cartesian** `y=f(x)`: `Axes.plot(lambda x: eval_ast(x, params))`
* **Parametric** `{x(t),y(t)}`: `ParametricFunction(lambda t: np.array([x(t),y(t),0]), t_range=[a,b])`
* **Implicit** `F(x,y)=0`: contour sampler to polyline; cached per frame.
* **Lists/Vectors**: arrays of points or expressions → `VGroup` with appropriate mobjects.
* **`join(...)`**: N pieces concatenated along parameter/time; optional continuity enforcement at seams.

---

## 11) Project Structure

```
project.mds/               # root folder for a scene project
  scene.md                 # Markdown + TeX source
  scene.ir.json            # normalized IR
  params.json              # parameter registry (author-specified)
  keyframes.json           # animation timeline
  analysis.py              # optional hooks
  outputs/
    preview/               # transient images
    renders/               # mp4/gif
    metrics/               # csv/parquet
```

---

## 12) Roadmap

* **v0.1**: IR, param lifting, local preview for cartesian/parametric, manual keyframes → tween render.
* **v0.2**: Timeline UI, easing editor, complex mode, `join` semantics, list/vector drawing.
* **v0.3**: Implicit curves, region fills, image/text labels, export presets.
* **v0.4**: Analysis hooks UI, batch experiments, ML post-processing.

---

## 13) Example: Complex arcs list + join

**Authoring**

```md
$d = \left[1+\frac{1}{-e^{i\tau t\,q}},\;1+e^{i\tau t\,q},\;3-e^{i\tau t\,q},\;3+\frac{1}{e^{i\tau t\,q}}\right]$ #domain(t=[0,1]) #param(name=q,min=0,max=1,default=1/4)

$y=\sin(kx)$ #param(name=k,min=-4,max=4,default=1)
```

**Keyframes**

```json
{"fps":30,"params":["q","k"],"frames":[
 {"t":0,"values":{"q":0.25,"k":1}},
 {"t":2,"values":{"q":0.75}},
 {"t":5,"values":{"q":0.1,"k":3}}
]}
```

Outcome: live preview uses `ValueTracker(q)`, `ValueTracker(k)`. Final render reproduces the same motion deterministically.

---

## 14) Open Questions / Constraints

* TeX→AST coverage (we will support a well-defined subset; fallback to explicit Python lambdas for exotic constructs).
* Complex plotting conventions (Argand vs 2D curve families); switchable modes.
* Performance: implicit/region fills require meshing; cache & reuse between frames.
* Parity: KaTeX display vs Manim computation must agree on operator precedence and function semantics.

---

## 15) Acceptance Criteria (v0.1)

1. Author can type Markdown+TeX; editor assists expand snippets.
2. Numeric literal → parameter via tag or lift dialog.
3. Registry sliders move the preview in real time.
4. Keyframe JSON drives tweened Manim render.
5. IR is exported/imported deterministically.
