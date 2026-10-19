---
title: Create Typed Hooks
impact: HIGH
impactDescription: Ensures type safety throughout app
tags: hooks, typescript, types, dispatch, selector
---

## Create Typed Hooks

Create typed versions of `useDispatch` and `useSelector` hooks for full TypeScript support.

**Incorrect (using untyped hooks):**

```typescript
// Using untyped hooks directly
import { useDispatch, useSelector } from 'react-redux';

const MyComponent = () => {
  const dispatch = useDispatch(); // No type inference
  const value = useSelector(state => state.counter.value); // No autocomplete
  // ...
};
```

**Correct (using typed hooks):**

```typescript
// src/store/hooks.ts - Create typed hooks
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from './store';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

```typescript
// In components - use typed hooks
import { useAppDispatch, useAppSelector } from '@/store/hooks';

const MyComponent = () => {
  const dispatch = useAppDispatch(); // Typed dispatch
  const value = useAppSelector(state => state.counter.value); // Full autocomplete
  // ...
};
```

## Why

Typed hooks provide:
- Full TypeScript autocomplete
- Compile-time error detection
- Better IDE support
- Type-safe dispatching
