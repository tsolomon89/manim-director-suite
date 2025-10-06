# Parameters

Parameters are the numeric building blocks of your animations. This guide covers everything you need to know about creating and using parameters.

## Creating Parameters

### Basic Parameter

1. Click **"+ Parameter"** in the Parameters panel
2. Enter a **name** (e.g., `k`, `rate`, `amplitude`)
3. Set an initial **value**
4. Choose a **control type** (slider, number, stepper)

### Naming Rules

- **Single letter**: `k`, `Z`, `T`
- **With subscript**: `k_{1}`, `γ_{rate}`
- **Greek symbols**: Type `\gamma` → see `γ`
- **No spaces**: Use underscores instead

### Control Types

| Type | Best For | Example |
|------|----------|---------|
| **Slider** | Continuous values | Frequency, amplitude |
| **Number** | Precise values | Coordinates, constants |
| **Stepper** | Discrete steps | Iteration counts |

## Parameter Expressions

Parameters can be defined as expressions:

```
k = 710
rate = 2*pi
freq = rate / k
amplitude = sqrt(k)
```

### Dependency Resolution

Parameters update automatically when dependencies change:

```
k = 5          // Base parameter
a = 2*k        // a = 10
b = a + k      // b = 15
```

Changing `k` to `10` updates `a = 20` and `b = 30` automatically.

## Using Parameters in Functions

Parameters make functions dynamic:

```typescript
f(x) = sin(k*x)           // Frequency controlled by k
g(x) = amplitude * x^2    // Amplitude controlled by parameter
h(x) = x^rate             // Exponent controlled by rate
```

## Animating Parameters

See [Timeline & Keyframes](./timeline.md) for how to animate parameters over time.

## Best Practices

### Naming Conventions

- Use **descriptive names** for complex scenes
- Stick to **single letters** for simple math
- Use **Greek symbols** for standard notation (α, β, γ, etc.)

### Organization

- Group related parameters
- Keep parameter count manageable (<20 for complex scenes)
- Use expressions to derive values

### Performance

- Avoid circular dependencies
- Cache expensive calculations
- Use whole numbers when possible

## Examples

### Wave Animation

```
frequency = 2
amplitude = 1
phase = 0

f(x) = amplitude * sin(frequency*x + phase)
```

### Fractal Exploration

```
Z = 710
k = log(T*τ/2) / log(τ)
T = 1.999

// Use Z, k, T in your functions
```

### Parametric Curves

```
t = [0..2*pi..0.1]
radius = 5

x = radius * cos(t)
y = radius * sin(t)
```

---

**Next**: Learn about [Functions & Plotting](./functions.md)
