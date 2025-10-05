# Spec Alignment Fix: Anonymous Plots & Better Error Messages

**Date**: 2025-10-05
**Issue**: FunctionPanel rejected valid anonymous plots (`y = expr`) and showed unhelpful error for missing parentheses

---

## Problem

The user reported seeing this error:
> ⚠️ Left-hand side must be a function (e.g., f(x), g(t))

When typing: `f=sin(x)`

**Two issues identified:**

1. **Anonymous plots rejected**: `y = sin(x)` should be valid per spec §1 but was being rejected
2. **Unhelpful error for missing parentheses**: `f = sin(x)` should suggest `f(x) = sin(x)` instead of generic error

---

## Spec Reference

From [Expression UX & Workflow](CLAUDE.md) §1:

> **Valid LHS forms** (anything else is rejected with an inline error):
> - **Parameter:** `k = value`, `k_{fast} = value`, `k_{2} = value`.
> - **Function:** `f(x) = expr`, `g_{3}(x,y) = expr`.
>
> **Special cases**
> - `y = expr` is a convenience form for defining an *anonymous* plotted expression over the current independent variable (see §3).

---

## Fix Applied

### File: [src/ui/FunctionPanelNew.tsx](src/ui/FunctionPanelNew.tsx)

#### Before (Line 83-86):
```typescript
if (parseResult.lhs?.kind !== 'function') {
  setCreateError('Left-hand side must be a function (e.g., f(x), g(t))');
  return;
}
```

**Problem**: Rejected everything except `kind === 'function'`, including valid anonymous plots.

#### After (Line 83-95):
```typescript
// Accept function or anonymous plot (y = expr)
if (parseResult.lhs?.kind === 'function' || parseResult.lhs?.kind === 'anonymous') {
  // Valid: proceed
} else if (parseResult.lhs?.kind === 'parameter') {
  // User typed something like "f = sin(x)" without parentheses
  setCreateError(
    `Functions need parentheses. Did you mean ${parseResult.lhs.fullName}(x) = ... ?`
  );
  return;
} else {
  setCreateError('Left-hand side must be a function (e.g., f(x), g(t)) or anonymous plot (y = ...)');
  return;
}
```

**Improvements**:
1. ✅ Now accepts `kind === 'anonymous'` (for `y = expr`)
2. ✅ Provides specific error for missing parentheses: "Did you mean f(x) = ... ?"
3. ✅ Updated generic error to mention anonymous plots

#### Placeholder Update (Line 162):
**Before**: `"Full expression (e.g., f(x) = sin(k·x), g(t) = e^{t})"`
**After**: `"f(x) = sin(k·x) or y = cos(x) for quick plot"`

**Benefit**: Users now see that `y = expr` is a valid shorthand.

---

## User Experience Improvements

### Scenario 1: Anonymous Plot ✅
**User types**: `y = sin(x)`
**Before**: ❌ Error: "Left-hand side must be a function"
**After**: ✅ Creates anonymous function, displays as "y" in function list

### Scenario 2: Missing Parentheses ✅
**User types**: `f = sin(x)`
**Before**: ❌ Generic error: "Left-hand side must be a function"
**After**: ✅ Helpful error: "Functions need parentheses. Did you mean f(x) = ... ?"

### Scenario 3: Valid Function ✅
**User types**: `f(x) = sin(x)`
**Before**: ✅ Works
**After**: ✅ Works (no change)

---

## Testing

### Test Cases
- [x] `y = sin(x)` → Creates anonymous function
- [x] `y = cos(τ·x)` → Anonymous plot with Greek symbols
- [x] `f = sin(x)` → Error with suggestion "f(x) = ..."
- [x] `k = 710` → Error (parameters belong in Parameter panel)
- [x] `f(x) = 2x` → Valid function with implicit multiplication

---

## TypeScript Status

**New Errors**: 0
**Pre-existing Warnings**: 6 (unchanged, all unused variables)

---

## Spec Compliance

| Feature | Before | After | Spec Reference |
|---------|--------|-------|----------------|
| Anonymous plots (`y = expr`) | ❌ | ✅ | §1 Special cases |
| Function signature required | ✅ | ✅ | §1 Valid LHS |
| Helpful error for missing `()` | ❌ | ✅ | §10 Errors & hints |
| Placeholder shows both forms | ❌ | ✅ | UX best practice |

---

## Related Files

- ✅ [src/ui/FunctionPanelNew.tsx](src/ui/FunctionPanelNew.tsx) - Validation logic updated
- ✅ [src/engine/ExpressionEngine.ts](src/engine/ExpressionEngine.ts) - Already supports `kind: 'anonymous'` from Phase A
- ✅ [src/engine/FunctionManager.ts](src/engine/FunctionManager.ts) - Already expands `y = expr` to `anonymous(x) = expr`

---

## Next Steps

### Optional Improvements
1. Add visual indicator in function list when a function is anonymous (badge or icon)
2. Allow editing anonymous plots (convert to named function on first edit)
3. Add syntax highlighting in MathInput for `y =` pattern

### User Documentation
Update user guide to explain:
- Anonymous plots as a quick plotting feature
- When to use `f(x) = ...` vs `y = ...`
- How to convert anonymous plot to named function

---

## Conclusion

The FunctionPanel now correctly implements the spec's anonymous plot feature and provides much better error messages when users forget parentheses. This aligns with the Desmos-style UX goal where `y = expr` is a convenient shorthand for quick visualization.

**Impact**: Better UX, fewer user errors, spec-compliant behavior ✅
