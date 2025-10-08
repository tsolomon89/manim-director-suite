# Operator Reference

> **Auto-generated from `src/engine/operator-types.ts`**
> Last updated: 2025-10-07T04:57:19.121Z

Complete reference for all built-in operators in Parametric Keyframe Studio.

## Categories

- [Calculus](#calculus)
- [List](#list)
- [Arithmetic](#arithmetic)
- [Complex](#complex)

## Calculus

### Definite Integral

**Description:** Compute definite integral of expression from lower to upper bound

**LaTeX Syntax:**
```latex
\int_{{{lower}}}^{{{upper}}} {{{expr}}} \, d{{{var}}}
```

**Arity:** variadic

**Type Signature:**
```typescript
integrate(function, number, number, ...) → number
```

**Examples:**

- `\int_{0}^{1} x^2 dx`
- `\int_{a}^{b} sin(k*x) dx`

---

### Derivative

**Description:** Compute derivative of expression with respect to variable

**LaTeX Syntax:**
```latex
\frac{d}{d{{{var}}}} {{{expr}}}
```

**Internal:** `derivative()`

**Arity:** binary

**Type Signature:**
```typescript
derivative(function, any) → function
```

**Examples:**

- `d/dx (x^2 + 3x)`
- `∂/∂t (e^(kt))`

---

### Summation

**Description:** Sum expression over range of index variable

**LaTeX Syntax:**
```latex
\sum_{{{var}}={{{start}}}}^{{{end}}} {{{expr}}}
```

**Arity:** variadic

**Type Signature:**
```typescript
sum(any, number, number, ...) → number
```

**Examples:**

- `∑_{n=1}^{10} n^2`
- `∑_{k=0}^{N} (1/k!)`

---

### Product

**Description:** Multiply expression over range of index variable

**LaTeX Syntax:**
```latex
\prod_{{{var}}={{{start}}}}^{{{end}}} {{{expr}}}
```

**Arity:** variadic

**Type Signature:**
```typescript
product(any, number, number, ...) → number
```

**Examples:**

- `∏_{k=1}^{n} k  (factorial)`
- `∏_{i=1}^{5} (1 + 1/i)`

---

## List

### Join Lists

**Description:** Concatenate multiple lists into one

**LaTeX Syntax:**
```latex
\operatorname{join}\left({{{lists}}}\right)
```

**Arity:** variadic

**Type Signature:**
```typescript
join(list, ...) → list
```

**Examples:**

- `join([1,2,3], [4,5,6]) → [1,2,3,4,5,6]`
- `join(A, B, C)`

---

### Repeat List

**Description:** Repeat list elements n times

**LaTeX Syntax:**
```latex
\operatorname{repeat}\left({{{list}}}, {{{count}}}\right)
```

**Arity:** binary

**Type Signature:**
```typescript
repeat(list, number) → list
```

**Examples:**

- `repeat([1,2,3], 2) → [1,2,3,1,2,3]`
- `repeat(L, k)`

---

### List Length

**Description:** Return number of elements in list

**LaTeX Syntax:**
```latex
\operatorname{length}\left({{{list}}}\right)
```

**Internal:** `size()`

**Arity:** unary

**Type Signature:**
```typescript
length(list) → number
```

**Examples:**

- `length([1,2,3,4,5]) → 5`
- `length(A)`

---

## Arithmetic

### Nth Root

**Description:** Compute nth root of value

**LaTeX Syntax:**
```latex
\sqrt[{{{index}}}]{{{radicand}}}
```

**Arity:** binary

**Type Signature:**
```typescript
nthroot(number, number) → number
```

**Examples:**

- `√[3]{27} → 3 (cube root)`
- `√[2]{16} → 4 (square root)`

---

## Complex

### Complex Conjugate

**Description:** Return complex conjugate (a+bi → a-bi)

**LaTeX Syntax:**
```latex
\overline{{{z}}}
```

**Arity:** unary

**Type Signature:**
```typescript
conjugate(complex) → complex
```

**Examples:**

- `conj(3+4i) → 3-4i`
- `conj(z)`

---

### Complex Argument

**Description:** Return angle of complex number in radians

**LaTeX Syntax:**
```latex
\operatorname{arg}\left({{{z}}}\right)
```

**Internal:** `arg()`

**Arity:** unary

**Type Signature:**
```typescript
arg(complex) → number
```

**Examples:**

- `arg(1+i) → π/4`
- `arg(z)`

---

### Real Part

**Description:** Return real part of complex number

**LaTeX Syntax:**
```latex
\operatorname{Re}\left({{{z}}}\right)
```

**Internal:** `re()`

**Arity:** unary

**Type Signature:**
```typescript
re(complex) → number
```

**Examples:**

- `Re(3+4i) → 3`
- `Re(z)`

---

### Imaginary Part

**Description:** Return imaginary part of complex number

**LaTeX Syntax:**
```latex
\operatorname{Im}\left({{{z}}}\right)
```

**Internal:** `im()`

**Arity:** unary

**Type Signature:**
```typescript
im(complex) → number
```

**Examples:**

- `Im(3+4i) → 4`
- `Im(z)`

---

### Absolute Value / Magnitude

**Description:** Return absolute value (real) or magnitude (complex)

**LaTeX Syntax:**
```latex
\left|{{{value}}}\right|
```

**Internal:** `abs()`

**Arity:** unary

**Type Signature:**
```typescript
abs(any) → number
```

**Examples:**

- `abs(-5) → 5`
- `abs(3+4i) → 5`

---

## Usage in Application

### LaTeX Input

```typescript
import { operatorRegistry } from './engine/OperatorRegistry';

// Convert LaTeX to internal format
const expr = operatorRegistry.fromLatex('\\int_{0}^{1} x^2 dx');
// → 'integrate(x^2, 0, 1, x)'
```

### LaTeX Output

```typescript
// Convert internal format to LaTeX
const latex = operatorRegistry.toLatex('sum(n^2, 0, 10, n)');
// → '\\sum_{n=0}^{10} n^2'
```

## Custom Operators

You can register custom operators:

```typescript
operatorRegistry.register({
  id: 'myop',
  name: 'My Custom Operator',
  category: 'special',
  arity: 'binary',
  signature: { params: ['number', 'number'], returns: 'number' },
  latex: '\\operatorname{myop}\\left({{{a}}}, {{{b}}}\\right)',
  description: 'Does something special',
  examples: ['myop(1, 2)'],
  implementation: (a, b) => {
    // Your logic here
    return a + b;
  },
});
```
