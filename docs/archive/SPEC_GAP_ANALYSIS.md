# 🔍 Expression UX Spec Gap Analysis

**Date**: 2025-10-04
**Status**: Critical Review
**Compliance**: ~70% (lower than initially assessed)

---

## 🚨 Critical Gaps Identified

### ❌ 1. Parameters Are NOT Numeric-Only (SPEC VIOLATION)

**Spec Says** (§6):
> Parameters are **numeric-only** (scalars or lists) and **never contain operators**

**What We Built**:
- ParameterManager allows expressions like `k = 2*Z`
- Parameters can have dependencies
- Full expression evaluation in parameters

**Gap**:
- ❌ Parameters accept operators and expressions
- ❌ No enforcement of "numeric-only" constraint
- ⚠️ ParameterPanel guards against operators in CREATE but not UPDATE
- ⚠️ Backend ParameterManager still evaluates expressions

**Fix Required**:
1. **Strict validation**: Parameters can ONLY be numeric literals (e.g., `710`, `3.14`)
2. **No expressions**: Remove expression evaluation from ParameterManager
3. **No dependencies**: Parameters are constants or user-set values
4. **Show error + action**: "Use Function Panel for expressions" button

---

### ❌ 2. Independent Variable NOT Implemented as Parameter

**Spec Says** (§3):
> The app carries an **Independent Variable** parameter object (default name `x`)
> Every function references an **independent param** by name

**What We Built**:
- ✅ IndependentVariableManager exists
- ✅ Stores domain {min, max, step}
- ❌ Independent variables are SEPARATE from Parameters
- ❌ Not visible in Parameter Panel
- ❌ Can't be edited as a parameter

**Gap**:
- ❌ Independent variable `x` should BE a Parameter with `role: "independent"`
- ❌ Should appear in Parameter Panel
- ❌ User should edit domain through parameter controls

**Fix Required**:
1. **Merge concepts**: IndependentVariable → Parameter with role
2. **Show in UI**: Display `x` in Parameter Panel with role badge 🔢
3. **Domain controls**: Min/max/step sliders in Parameter card
4. **Function linking**: Functions reference parameter by ID, not separate manager

---

### ❌ 3. Implicit Multiplication NOT Implemented

**Spec Says** (§7):
> Any two adjacent identifiers/numbers imply multiplication: `abc` ≡ `a*b*c`, `2x` ≡ `2*x`

**What We Built**:
- ❌ No implicit multiplication parsing
- ❌ `2x` would fail to parse
- ❌ `ax_{mode}` would not parse as `a * x_{mode}`

**Gap**:
- Math.js requires explicit `*` operators
- No pre-processing to insert implicit multiplication
- Users must type `2*x` instead of `2x`

**Fix Required**:
1. **Pre-processor**: Insert `*` between adjacent tokens before math.js
2. **Rules**:
   - `2x` → `2*x`
   - `ax` → `a*x`
   - `x(y)` → `x*(y)` if `x` is not a function
   - `x_{k}y` → `x_{k}*y`

---

### ❌ 4. Anonymous Plot (`y = expr`) NOT Implemented

**Spec Says** (§1):
> `y = expr` is a convenience form for defining an anonymous plotted expression

**What We Built**:
- ✅ Parser recognizes `y` as anonymous kind
- ❌ No UI support
- ❌ No rendering of anonymous plots
- ❌ FunctionPanelNew requires full `f(x) = ...` syntax

**Gap**:
- Can't type `y = sin(x)` as shorthand
- Must always specify function name

**Fix Required**:
1. **Accept in UI**: FunctionPanel accepts `y = expr`
2. **Auto-expand**: Convert to `anonymous(x) = expr` internally
3. **Display**: Show as "y" in UI, hide function name
4. **Link to x**: Auto-link to default independent variable

---

### ⚠️ 5. Token Boundary Detection for `pi` NOT Implemented

**Spec Says** (§2):
> Bare name mapping (e.g., `pi` → `π`) only triggers at **token boundaries** to avoid `spin` → `sπn`

**What We Built**:
- ✅ SymbolRegistry has regex for token boundaries
- ⚠️ Regex may not catch all edge cases
- ⚠️ No comprehensive tests for `spin`, `pirate`, etc.

**Gap**:
- Needs thorough testing with words containing `pi`, `tau`, etc.

**Fix Required**:
1. **Test suite**: Verify `spin`, `pirate`, `capital` don't transform
2. **Refine regex**: Ensure word boundaries work correctly
3. **Edge cases**: Handle `2pi` (should become `2*π` with implicit mult)

---

### ⚠️ 6. Function Calls (`f(g)`) Ambiguity NOT Resolved

**Spec Says** (§8):
> `f(g)` calls `f` with the **current value** of symbol `g` (a Parameter)
> To call function `g`, use `f(g(x))`

**What We Built**:
- ❌ No distinction between calling `f` with parameter `g` vs calling function `g`
- ❌ Math.js will try to evaluate `f(g)` where both are functions → error
- ❌ No validation or hints

**Gap**:
- Can't detect if user meant `f(g)` (value) vs `f(g(x))` (composition)
- No UI hints to correct this

**Fix Required**:
1. **Detect in Binder**: Check if `g` is a function
2. **Error message**: "Did you mean `f(g(x))`?" if `g` is a function
3. **Allow parameter values**: `f(g)` works if `g` is a parameter

---

### ⚠️ 7. Fraction Rendering NOT Fully Implemented

**Spec Says** (§2):
> `/` is division and pretty-renders as a fraction: `a/b` → `\frac{a}{b}`

**What We Built**:
- ✅ MathRenderer has fraction CSS
- ⚠️ Only handles simple cases: `a/b`
- ❌ Doesn't handle `(a+b)/(c+d)` with grouped terms

**Gap**:
- Complex fractions may not render correctly
- No support for nested fractions

**Fix Required**:
1. **Improve regex**: Match parenthesized groups
2. **Test cases**: `(a+b)/c`, `a/(b+c)`, `(a+b)/(c+d)`
3. **Nested fractions**: May need recursive rendering

---

### ❌ 8. List Syntax (`[0...Z]`) NOT Implemented

**Spec Says** (§5):
> When a function references a list (e.g., `n=[0...Z]`), expressions broadcast elementwise

**What We Built**:
- ❌ No list parsing
- ❌ No list parameter support
- ❌ No broadcasting semantics

**Gap**:
- Complete feature missing (OK for MVP, but spec mentions it)

**Fix Required**:
- **Phase 2 Feature** (defer for now)

---

### ⚠️ 9. Collision Detection NOT Implemented

**Spec Says** (§1):
> The app **detects collisions** with existing Parameters/Functions and prompts user to rename

**What We Built**:
- ✅ ParameterPanel checks for duplicate names
- ⚠️ FunctionPanelNew checks for duplicate names
- ❌ No collision detection ACROSS panels (parameter vs function)
- ❌ No prompt to rename, just error message

**Gap**:
- Can create parameter `f` and function `f(x)` without warning
- No renaming flow

**Fix Required**:
1. **Cross-panel check**: Function names can't collide with parameter names
2. **Rename dialog**: "Name 'f' already exists. Choose different name: [_____]"
3. **Suggestions**: Offer `f_{1}`, `f_{new}` as options

---

### ⚠️ 10. Expression Editing Flow NOT Fully Spec'd

**Spec Says** (§5):
> Expression (read-only pretty math on blur; editable on focus)

**What We Built**:
- ✅ Click to edit (FunctionPanelNew)
- ❌ Not truly "focus/blur" - requires click on edit icon
- ⚠️ Pretty rendering on blur works

**Gap**:
- Minor UX difference from spec

**Fix Required**:
- **Optional**: Make expression directly focusable (remove edit icon)

---

## 📊 Gap Summary

| Feature | Status | Priority | Effort |
|---------|--------|----------|--------|
| 1. Numeric-only Parameters | ❌ Missing | 🔴 CRITICAL | 4h |
| 2. Independent Var as Parameter | ❌ Missing | 🔴 CRITICAL | 6h |
| 3. Implicit Multiplication | ❌ Missing | 🟡 HIGH | 3h |
| 4. Anonymous Plot `y = expr` | ❌ Missing | 🟡 HIGH | 2h |
| 5. Token Boundary (pi/tau) | ⚠️ Partial | 🟢 MEDIUM | 1h |
| 6. Function Call Ambiguity | ❌ Missing | 🟢 MEDIUM | 2h |
| 7. Fraction Rendering | ⚠️ Partial | 🟢 LOW | 2h |
| 8. List Syntax | ❌ Missing | ⚪ DEFER | -- |
| 9. Collision Detection | ⚠️ Partial | 🟡 HIGH | 3h |
| 10. Focus/Blur Editing | ⚠️ Partial | 🟢 LOW | 1h |

**Total Estimated Effort**: ~24 hours for full spec compliance

---

## 🎯 Revised Compliance Assessment

### Current Implementation

| Component | Compliance | Notes |
|-----------|-----------|-------|
| SymbolRegistry | 90% | Missing token boundary tests |
| ExpressionEngine | 85% | Missing implicit mult pre-processing |
| ParameterManager | 40% | ⚠️ Violates numeric-only constraint |
| IndependentVariableManager | 50% | ⚠️ Should be merged with Parameters |
| FunctionManager | 80% | Missing anonymous plots, call validation |
| Binder | 70% | Missing function call ambiguity detection |
| MathRenderer | 75% | Partial fraction rendering |
| ParameterPanel | 65% | Accepts expressions (should reject) |
| FunctionPanel | 80% | Missing anonymous plot support |

**Overall Compliance**: **~70%** (revised from 95%)

---

## 🚨 Critical Issues

### Issue #1: Parameter Expression Evaluation (ARCHITECTURAL)

**Problem**: Current ParameterManager evaluates expressions and tracks dependencies, violating "numeric-only" constraint.

**Impact**:
- Users can create invalid parameters like `k = 2*Z`
- Confuses parameter vs function roles
- DependencyGraph is built for parameters (shouldn't exist)

**Solution**:
```typescript
// ❌ CURRENT (WRONG)
interface Parameter {
  expression: string;  // Can be "2*Z"
  value: number;       // Evaluated from expression
  dependencies: string[];  // Tracks what it depends on
}

// ✅ CORRECT (SPEC-COMPLIANT)
interface Parameter {
  value: number | number[];  // Direct value only
  // NO expression field
  // NO dependencies field
  role?: 'independent' | 'slider' | 'constant-approx';
  domain?: { min, max, step };  // For sliders and independent vars
}
```

**Required Changes**:
1. Remove `expression` from Parameter interface
2. Remove `dependencies` from Parameter interface
3. Remove DependencyGraph usage for parameters
4. ParameterManager only stores/retrieves numeric values
5. UI enforces numeric input only

---

### Issue #2: Independent Variable Architecture (ARCHITECTURAL)

**Problem**: IndependentVariableManager is separate from ParameterManager, but spec says independent variable IS a parameter.

**Impact**:
- Users can't see `x` in Parameter Panel
- Can't edit domain through normal parameter controls
- Confusing mental model

**Solution**:
```typescript
// ✅ SPEC-COMPLIANT
const xParameter: Parameter = {
  id: 'param-x',
  name: 'x',
  value: 0,  // Current value (not used for plotting)
  role: 'independent',
  domain: { min: -10, max: 10, step: 0.05 },
  uiControl: {
    type: 'slider',  // Or custom domain editor
    min: -10,
    max: 10,
    step: 0.05
  }
};

// Functions reference the parameter
const func: FunctionDefinition = {
  // ...
  independentVarId: 'param-x',  // Links to parameter ID
};
```

**Required Changes**:
1. Remove IndependentVariableManager
2. Create independent variable as Parameter with role
3. Show in Parameter Panel with special UI (domain controls)
4. Functions link to parameter ID instead of separate manager

---

### Issue #3: Implicit Multiplication Pre-Processing

**Problem**: Users must type explicit `*` operators, but spec says `2x` should work.

**Impact**:
- Poor UX (Desmos allows `2x`)
- Spec violation

**Solution**:
```typescript
function insertImplicitMultiplication(expr: string): string {
  // 2x → 2*x
  expr = expr.replace(/(\d)([a-zA-Zα-ωΑ-Ω])/g, '$1*$2');

  // xy → x*y (unless x is followed by subscript or function call)
  expr = expr.replace(/([a-zA-Zα-ωΑ-Ω])([a-zA-Zα-ωΑ-Ω])/g, (match, a, b) => {
    // Check if followed by _{...} or (
    if (!isSubscriptOrCall(expr, match.index + 1)) {
      return `${a}*${b}`;
    }
    return match;
  });

  // x(y) → x*(y) if x is not a function
  // ... more rules

  return expr;
}
```

**Required Changes**:
1. Add pre-processor in ExpressionEngine
2. Call before math.js parsing
3. Test extensively with edge cases

---

## ✅ What We Got Right

### Strengths

1. ✅ **SymbolRegistry** - Greek symbol normalization works
2. ✅ **LHS Parsing** - Single letter + subscript validation
3. ✅ **MathRenderer** - Pretty display with glyphs
4. ✅ **Auto-parameterization** - Free symbol detection works
5. ✅ **Function Stats** - Computation implemented
6. ✅ **UI Components** - Parameter/Function panels exist
7. ✅ **Type Safety** - Full TypeScript coverage
8. ✅ **Configuration** - Token map externalized

---

## 🔧 Action Plan

### Phase A: Critical Fixes (Must Do)

**Priority 1: Fix Parameter Architecture** (6-8 hours)
1. Remove expression evaluation from ParameterManager
2. Change Parameter interface to value-only
3. Remove DependencyGraph for parameters
4. Update ParameterPanel to reject expressions entirely
5. Add "Make this a Function" conversion flow

**Priority 2: Merge Independent Variable** (4-6 hours)
1. Remove IndependentVariableManager
2. Create `x` as Parameter with role: 'independent'
3. Add domain editing UI in Parameter Panel
4. Update FunctionManager to use parameter ID
5. Test domain changes propagate to functions

**Priority 3: Implicit Multiplication** (3-4 hours)
1. Implement pre-processor
2. Add to ExpressionEngine.normalizeExpression()
3. Test with: `2x`, `xy`, `x(y)`, `2pi`, etc.
4. Edge cases: `x_{k}y`, subscripts

### Phase B: High-Priority Features (6-8 hours)

**Priority 4: Anonymous Plots** (2 hours)
1. Accept `y = expr` in FunctionPanel
2. Create anonymous function internally
3. Display as "y" in UI

**Priority 5: Collision Detection** (3 hours)
1. Check across Parameter + Function panels
2. Show rename dialog
3. Offer suggestions

**Priority 6: Function Call Validation** (2 hours)
1. Detect `f(g)` where both are functions
2. Show error: "Did you mean `f(g(x))`?"

### Phase C: Polish (3-4 hours)

**Priority 7: Token Boundary Tests** (1 hour)
**Priority 8: Improved Fractions** (2 hours)
**Priority 9: Focus/Blur Editing** (1 hour)

---

## 📅 Timeline Estimate

| Phase | Hours | Days (Full-Time) |
|-------|-------|-----------------|
| Phase A (Critical) | 13-18h | 2-3 days |
| Phase B (High-Pri) | 6-8h | 1 day |
| Phase C (Polish) | 3-4h | 0.5 day |
| **Total** | **22-30h** | **3.5-4.5 days** |

---

## 🎯 Recommended Approach

### Option 1: Full Spec Compliance (Recommended)

Complete all of Phase A + B before integration.

**Pros**:
- Fully spec-compliant
- No architectural rework later
- Clean mental model for users

**Cons**:
- 3-4 days additional work

### Option 2: Minimal Viable (Faster)

Fix only the critical architectural issues (Phase A), defer features.

**Pros**:
- 2-3 days work
- Core architecture correct

**Cons**:
- Missing features (anonymous plots, implicit mult)
- Partial spec compliance

### Option 3: Ship As-Is (Not Recommended)

Proceed with current implementation.

**Pros**:
- No additional work

**Cons**:
- ❌ Violates core spec principles
- ❌ Confusing UX (parameters with expressions?)
- ❌ Architectural debt

---

## 💡 Recommendations

**I strongly recommend Option 1 (Full Compliance)**:

1. The architectural issues (#1, #2) are **fundamental** - fixing them later would require major refactoring
2. Implicit multiplication (#3) is **expected by users** (Desmos-like)
3. The effort (3-4 days) is reasonable for solid foundation
4. Avoids confusing users with "parameters that have expressions"

**Next Steps**:
1. Approve approach (Option 1 or 2)
2. Implement Phase A (critical fixes)
3. Test thoroughly
4. Implement Phase B (features)
5. Integrate into App.tsx

---

**Status**: ⚠️ **SIGNIFICANT GAPS IDENTIFIED**
**Recommendation**: **FIX BEFORE INTEGRATION**
**Estimated Additional Time**: 22-30 hours (3-4 days)
