# Documentation System Architecture

## 📖 Overview

This project uses a **self-documenting architecture** where reference documentation is automatically generated from the source of truth in TypeScript files.

**Key Principle:** Data is defined ONCE in code, documentation is generated automatically.

---

## 🗂️ Where Information Lives

### Source of Truth (TypeScript)

| Type of Information | Location | Auto-Docs? |
|---------------------|----------|------------|
| **Operators** | `src/engine/operator-types.ts` → `BUILTIN_OPERATORS` | ✅ Yes |
| **Fractal Presets** | `src/engine/fractal-types.ts` → `FRACTAL_PRESETS` | ✅ Yes |
| **Complex Numbers** | `src/engine/complex-types.ts` → `Complex` class | ✅ Yes |
| **Config Types** | `src/config/types.ts` → TypeScript interfaces | ⚠️ Manual |
| **Parameters** | Runtime - created by user/Desmos import | ❌ No |
| **Functions** | Runtime - created by user | ❌ No |
| **Keyframes** | Runtime - created by user | ❌ No |

---

## 📚 Documentation Structure

```
public/docs/
├── index.json              # Master catalog (manually curated)
├── user-guide/             # User-facing guides (manual)
│   ├── getting-started.md
│   ├── parameters.md
│   ├── functions.md
│   ├── timeline.md
│   └── export.md
├── reference/              # Technical reference (AUTO-GENERATED + manual)
│   ├── operators.md        # ✨ AUTO-GENERATED from operator-types.ts
│   ├── fractal-presets.md  # ✨ AUTO-GENERATED from fractal-types.ts
│   ├── complex-numbers.md  # ✨ AUTO-GENERATED from complex-types.ts
│   ├── expression-syntax.md
│   ├── keyboard-shortcuts.md
│   ├── config-system.md
│   └── file-formats.md
├── developer/              # Developer docs (manual)
│   ├── architecture.md
│   ├── testing.md
│   ├── contributing.md
│   └── api-reference.md
├── changelog/              # Version history (manual)
│   ├── v1.0.0.md
│   ├── v2.0.0.md
│   └── roadmap.md
└── archive/                # Historical docs
    └── ...
```

---

## 🔄 Auto-Documentation Flow

```
┌─────────────────────────────────────────────────────────────┐
│  Source of Truth (TypeScript)                                │
│  ─────────────────────────────────────────────────────────  │
│  • src/engine/operator-types.ts → BUILTIN_OPERATORS         │
│  • src/engine/fractal-types.ts → FRACTAL_PRESETS            │
│  • src/engine/complex-types.ts → Complex class              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ 1. Developer edits source files
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  Documentation Generator                                     │
│  ─────────────────────────────────────────────────────────  │
│  src/docs/DocumentationGenerator.ts                         │
│                                                              │
│  Methods:                                                    │
│  • generateOperatorReference()                              │
│  • generateFractalPresets()                                 │
│  • generateComplexNumberGuide()                             │
│  • updateIndexJson()                                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ 2. Generate markdown files
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  Generated Documentation (Markdown)                          │
│  ─────────────────────────────────────────────────────────  │
│  public/docs/reference/                                     │
│  • operators.md        (from BUILTIN_OPERATORS)             │
│  • fractal-presets.md  (from FRACTAL_PRESETS)               │
│  • complex-numbers.md  (from Complex class)                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ 3. Update index
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  Documentation Index                                         │
│  ─────────────────────────────────────────────────────────  │
│  public/docs/index.json                                     │
│  • Adds new auto-generated docs to catalog                  │
│  • Tags with "auto-generated"                               │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ 4. Serve via in-app docs viewer
                       ▼
┌─────────────────────────────────────────────────────────────┐
│  In-App Documentation Viewer (http://localhost:3000/docs)   │
│  ─────────────────────────────────────────────────────────  │
│  User sees up-to-date reference docs automatically          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Usage

### Manual Generation

Run once to generate all docs:

```bash
npm run docs:generate
```

This will:
1. Compile TypeScript (`tsconfig.docs.json`)
2. Run `DocumentationGenerator.ts`
3. Generate markdown files in `public/docs/reference/`
4. Update `public/docs/index.json`

### Watch Mode (Development)

Automatically regenerate docs when source files change:

```bash
npm run docs:watch
```

Watches:
- `src/engine/operator-types.ts`
- `src/engine/fractal-types.ts`
- `src/engine/complex-types.ts`

---

## 📝 Adding a New Operator

**1. Define in Source of Truth:**

```typescript
// src/engine/operator-types.ts
export const BUILTIN_OPERATORS: Record<string, OperatorDefinition> = {
  // ... existing operators ...

  myNewOp: {
    id: 'myNewOp',
    name: 'My New Operator',
    category: 'special',
    arity: 'binary',
    signature: {
      params: ['number', 'number'],
      returns: 'number',
    },
    latex: '\\operatorname{myNewOp}\\left({{{a}}}, {{{b}}}\\right)',
    description: 'Does something amazing',
    examples: [
      'myNewOp(1, 2) → 3',
      'myNewOp(x, y)',
    ],
    implementation: (a, b) => a + b,
  },
};
```

**2. Generate Documentation:**

```bash
npm run docs:generate
```

**3. Documentation is Updated Automatically:**

- `public/docs/reference/operators.md` now includes `My New Operator`
- `public/docs/index.json` updated
- Available at `http://localhost:3000/docs` immediately

**No manual documentation writing required!** ✨

---

## 📝 Adding a New Fractal Preset

**1. Define in Source of Truth:**

```typescript
// src/engine/fractal-types.ts
export const FRACTAL_PRESETS = {
  // ... existing presets ...

  'my-fractal': {
    name: 'My Custom Fractal',
    fractalType: 'newton' as FractalType,
    newtonConfig: {
      coefficients: [
        { real: -1, imag: 0 },
        { real: 1, imag: 0 },
      ],
      rootColors: ['#FF0000', '#0000FF'],
    },
  },
};
```

**2. Generate Documentation:**

```bash
npm run docs:generate
```

**3. Documentation is Updated Automatically:**

- `public/docs/reference/fractal-presets.md` now includes `My Custom Fractal`
- Usage examples auto-generated
- Available in docs viewer instantly

---

## 🔍 How Data is Stored

### 1. **Operators** (Static Configuration)

**Source:** `src/engine/operator-types.ts`

```typescript
export const BUILTIN_OPERATORS: Record<string, OperatorDefinition> = {
  integrate: {
    id: 'integrate',
    name: 'Definite Integral',
    category: 'calculus',
    arity: 'variadic',
    signature: { params: ['function', 'number', 'number'], returns: 'number', variadic: true },
    latex: '\\int_{{{lower}}}^{{{upper}}} {{{expr}}} \\, d{{{var}}}',
    description: 'Compute definite integral of expression from lower to upper bound',
    examples: ['\\int_{0}^{1} x^2 dx'],
  },
  // ... 19 more operators
};
```

**Accessed via:** `OperatorRegistry` class

**Extensible:** Yes, users can register custom operators at runtime

```typescript
operatorRegistry.register(customOperatorDef);
```

---

### 2. **Fractal Presets** (Static Configuration)

**Source:** `src/engine/fractal-types.ts`

```typescript
export const FRACTAL_PRESETS = {
  'newton-cubic': {
    name: 'Newton Cubic (z³ - 1)',
    fractalType: 'newton' as FractalType,
    newtonConfig: {
      coefficients: [
        { real: -1, imag: 0 },
        { real: 0, imag: 0 },
        { real: 0, imag: 0 },
        { real: 1, imag: 0 },
      ],
      rootColors: ['#FF0000', '#00FF00', '#0000FF'],
    },
  },
  // ... 4 more presets
};
```

**Accessed via:** `FractalManager.createFromPreset(id)`

**Extensible:** Presets are read-only, but users create custom fractals via manager

---

### 3. **Complex Numbers** (Class Implementation)

**Source:** `src/engine/complex-types.ts`

```typescript
export class Complex implements ComplexNumber {
  constructor(public real: number, public imag: number) {}

  add(other: Complex): Complex { /* ... */ }
  multiply(other: Complex): Complex { /* ... */ }
  // ... all methods documented
}
```

**Accessed via:** Direct instantiation

```typescript
const z = new Complex(3, 4);
const w = Complex.fromString("2-i");
```

---

### 4. **Parameters** (Runtime Data)

**Storage:** In-memory, managed by `ParameterManager`

**Persistence:** Project save files (`.pkstudio` JSON)

```json
{
  "parameters": [
    {
      "id": "param-001",
      "name": "k",
      "value": 5,
      "domain": { "min": 0, "max": 10 },
      "uiControl": { "type": "slider", "min": 0, "max": 10, "step": 0.1 }
    }
  ]
}
```

**Documentation:** User guide (`public/docs/user-guide/parameters.md`) - manually written

---

### 5. **Functions** (Runtime Data)

**Storage:** In-memory, managed by `FunctionManager`

**Persistence:** Project save files

```json
{
  "functions": [
    {
      "id": "func-001",
      "lhs": { "kind": "function", "name": "f", "formalParams": ["x"] },
      "expression": "sin(k*x)",
      "style": { "color": "#3B82F6" }
    }
  ]
}
```

**Documentation:** User guide (`public/docs/user-guide/functions.md`) - manually written

---

### 6. **Fractals** (Runtime Data)

**Storage:** In-memory, managed by `FractalManager`

**Persistence:** Project save files

```json
{
  "fractals": [
    {
      "id": "fractal-001",
      "fractalType": "newton",
      "newtonConfig": {
        "roots": [
          { "real": 1, "imag": 0 },
          { "real": -0.5, "imag": 0.866 }
        ],
        "rootColors": ["#FF0000", "#00FF00"]
      }
    }
  ]
}
```

**Documentation:** Auto-generated (`public/docs/reference/fractal-presets.md`) + User guide

---

## 📋 Documentation Types

### ✅ Auto-Generated (Reference)

These are **always up-to-date** with code:

- **Operators** (`operators.md`)
  - Source: `BUILTIN_OPERATORS` in `operator-types.ts`
  - Includes: syntax, examples, type signatures, LaTeX

- **Fractal Presets** (`fractal-presets.md`)
  - Source: `FRACTAL_PRESETS` in `fractal-types.ts`
  - Includes: configurations, usage examples, preset IDs

- **Complex Numbers** (`complex-numbers.md`)
  - Source: `Complex` and `ComplexPolynomial` classes
  - Includes: API methods, examples, polynomial operations

### ✏️ Manually Written (Guides)

These require manual updates:

- **User Guides** (getting started, parameters, functions, timeline, export)
- **Developer Docs** (architecture, testing, contributing, API)
- **Changelogs** (version history, roadmap)

**When to update:**
- New features added
- UI/UX changes
- Breaking changes
- New keyboard shortcuts

---

## 🎯 Best Practices

### For Developers

**1. When adding a new operator:**
```typescript
// ✅ DO: Add to BUILTIN_OPERATORS with complete metadata
export const BUILTIN_OPERATORS = {
  myop: {
    id: 'myop',
    name: 'My Operator',
    description: 'Clear, concise description',
    examples: ['myop(1, 2)', 'myop(x, y)'],
    // ... all fields
  },
};

// ❌ DON'T: Scatter operator logic without central definition
```

**2. When adding a fractal preset:**
```typescript
// ✅ DO: Add to FRACTAL_PRESETS
export const FRACTAL_PRESETS = {
  'my-preset': { /* config */ },
};

// ❌ DON'T: Hard-code presets in UI components
```

**3. Always run after changes:**
```bash
npm run docs:generate
```

**4. Check generated docs:**
```bash
# View in browser
npm run dev
# Navigate to http://localhost:3000/docs
```

---

### For Documentation Writers

**1. Auto-generated files have headers:**
```markdown
# Operator Reference

> **Auto-generated from `src/engine/operator-types.ts`**
> Last updated: 2025-01-07T12:34:56.789Z

⚠️ DO NOT EDIT THIS FILE MANUALLY - Changes will be overwritten
```

**2. Manual files should note their source:**
```markdown
# Parameters Guide

> Manual documentation - feel free to edit

This guide explains how to work with parameters...
```

**3. Cross-reference between docs:**
```markdown
See also:
- [Operator Reference](operators.md) - Auto-generated list of all operators
- [Expression Syntax](expression-syntax.md) - How to write expressions
```

---

## 🚀 Future Enhancements

### Planned (Not Yet Implemented)

1. **Type-level documentation extraction**
   - Parse JSDoc comments from TypeScript
   - Generate API reference from interfaces

2. **Example code validation**
   - Run example code snippets as tests
   - Ensure examples work

3. **Interactive operator playground**
   - Try operators in-browser
   - See LaTeX rendering live

4. **Version-specific docs**
   - Archive docs per version
   - Link to correct version from app

5. **Search integration**
   - Full-text search across all docs
   - Fuzzy operator search

6. **Localization**
   - Multi-language documentation
   - Auto-translate from English

---

## 📦 Files in This System

```
src/docs/
└── DocumentationGenerator.ts    # Main generator class

scripts/
└── generate-docs.js             # npm script wrapper

public/docs/
├── index.json                   # Master catalog
└── reference/
    ├── operators.md             # ✨ AUTO-GENERATED
    ├── fractal-presets.md       # ✨ AUTO-GENERATED
    └── complex-numbers.md       # ✨ AUTO-GENERATED

tsconfig.docs.json               # TypeScript config for docs compilation

package.json                     # npm scripts:
                                 #   • docs:generate
                                 #   • docs:watch
```

---

## ✅ Checklist for Adding New Features

- [ ] Define in source of truth (TypeScript)
- [ ] Add JSDoc comments if applicable
- [ ] Include examples in definition
- [ ] Run `npm run docs:generate`
- [ ] Verify generated documentation looks correct
- [ ] Update manual user guide if UI changes
- [ ] Update changelog if it's a new feature
- [ ] Commit both source and generated docs

---

## 🙏 Credits

**Inspiration:**
- Rust's auto-documentation system (rustdoc)
- TypeScript's declaration files
- JSDoc → Markdown generators

---

**Last Updated:** Auto-updated by generator (see file headers)
