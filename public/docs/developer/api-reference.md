# API Reference

Core TypeScript APIs and interfaces.

## Core Classes

### ExpressionEngine

```typescript
class ExpressionEngine {
  evaluate(expression: string, scope: Record<string, number>): EvaluationResult
  parseCoordinates(expression: string, parameters: Record<string, number>): CoordinateResult
}
```

### ParameterManager

```typescript
class ParameterManager {
  createParameter(name: string, value: number, options?: ParameterOptions): Parameter | null
  updateParameter(id: string, updates: Partial<Parameter>): void
  getAllParameters(): Parameter[]
}
```

### KeyframeManager

```typescript
class KeyframeManager {
  createKeyframe(time: number, snapshot: KeyframeSnapshot): Keyframe
  getAllKeyframes(): Keyframe[]
  getKeyframesInRange(startTime: number, endTime: number): Keyframe[]
}
```

## Type Definitions

Full TypeScript definitions available in source code.

Full API documentation coming soon.
