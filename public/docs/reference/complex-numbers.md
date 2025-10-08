# Complex Numbers Guide

> **Auto-generated documentation**
> Last updated: 2025-10-07T04:57:19.125Z

Working with complex numbers in Parametric Keyframe Studio.

## Creating Complex Numbers

### Rectangular Form

```typescript
import { Complex } from './engine/complex-types';

// From real and imaginary parts
const z = new Complex(3, 4);  // 3 + 4i

// From string
const w = Complex.fromString("2-i");  // 2 - i
const u = Complex.fromString("5i");   // 5i
const v = Complex.fromString("7");    // 7 + 0i
```

### Polar Form

```typescript
// From magnitude and angle
const z = Complex.fromPolar(2, Math.PI / 4);  // 2∠45° = √2 + i√2

// Convert to polar
const w = new Complex(1, 1);
const polar = w.toPolar();
// → { magnitude: 1.414, angle: 0.785 }
```

## Arithmetic Operations

```typescript
const z = new Complex(3, 4);
const w = new Complex(1, 2);

z.add(w)       // (3+4i) + (1+2i) = 4+6i
z.subtract(w)  // (3+4i) - (1+2i) = 2+2i
z.multiply(w)  // (3+4i) × (1+2i) = -5+10i
z.divide(w)    // (3+4i) / (1+2i) = 2.2-0.4i
z.power(2)     // (3+4i)² = -7+24i
```

## Complex Functions

```typescript
const z = new Complex(1, 0);

z.exp()        // e^z
z.sqrt()       // √z (principal branch)
z.sin()        // sin(z)
z.cos()        // cos(z)
z.log()        // log(z) (principal branch)
z.conjugate()  // Complex conjugate z̄
```

## Properties

```typescript
const z = new Complex(3, 4);

z.magnitude()  // |z| = 5
z.angle()      // arg(z) = 0.927 radians (≈53.1°)
z.real         // Real part: 3
z.imag         // Imaginary part: 4
z.toString()   // "3+4i"
```

## Polynomials

```typescript
import { ComplexPolynomial } from './engine/complex-types';

// Create polynomial: z³ - 1
const poly = new ComplexPolynomial([
  { real: -1, imag: 0 },  // -1
  { real: 0, imag: 0 },   // 0z
  { real: 0, imag: 0 },   // 0z²
  { real: 1, imag: 0 },   // z³
]);

// Evaluate at z = 1
const result = poly.evaluate({ real: 1, imag: 0 });
// → { real: 0, imag: 0 }

// Find all roots
const roots = poly.findRoots();
// → [1+0i, -0.5+0.866i, -0.5-0.866i]

// Get derivative: 3z²
const deriv = poly.derivative();
```

## Use in Parameters

Complex numbers can be used as parameter values:

```typescript
const param: Parameter = {
  id: 'z',
  name: 'z',
  value: { real: 3, imag: 4 },
  isComplex: true,
  uiControl: { type: 'complex', /* ... */ },
};
```
