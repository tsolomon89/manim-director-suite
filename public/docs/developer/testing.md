# Testing Guide

How to write and run tests.

## Running Tests

```bash
npm run test          # Watch mode
npm run test:run      # Run once
npm run test:coverage # With coverage
```

## Test Structure

- **Unit tests**: Individual functions and classes
- **Integration tests**: Multi-component workflows

## Writing Tests

```typescript
import { describe, it, expect } from 'vitest';

describe('MyFeature', () => {
  it('should do something', () => {
    expect(result).toBe(expected);
  });
});
```

## Current Coverage

- 140 tests passing
- Core systems covered
- Integration workflows tested

Full documentation coming soon.
