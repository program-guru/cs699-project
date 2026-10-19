---
title: Create Basic Slice
impact: HIGH
impactDescription: Foundation of state management
tags: slice, reducers, actions, state
---

## Create Basic Slice

Use `createSlice` to define state, actions, and reducers in one place.

**Incorrect (legacy Redux approach):**

```typescript
// Legacy Redux - separate actions and reducers
// actions.ts
export const INCREMENT = 'counter/increment';
export const DECREMENT = 'counter/decrement';

export const increment = () => ({ type: INCREMENT });
export const decrement = () => ({ type: DECREMENT });

// reducer.ts
export default function counterReducer(state = { value: 0 }, action) {
  switch (action.type) {
    case INCREMENT:
      return { ...state, value: state.value + 1 };
    case DECREMENT:
      return { ...state, value: state.value - 1 };
    default:
      return state;
  }
}
// Verbose, error-prone, no TypeScript support
```

**Correct (using createSlice):**

```typescript
// src/features/counter/counter.slice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CounterState {
  value: number;
  loading: boolean;
}

const initialState: CounterState = {
  value: 0,
  loading: false,
};

export const counterSlice = createSlice({
  name: 'counter',
  initialState,
  reducers: {
    increment: (state) => {
      state.value += 1; // Immer allows "mutation"
    },
    decrement: (state) => {
      state.value -= 1;
    },
    incrementByAmount: (state, action: PayloadAction<number>) => {
      state.value += action.payload;
    },
    reset: () => initialState,
  },
});

export const { increment, decrement, incrementByAmount, reset } = counterSlice.actions;
export default counterSlice.reducer;
```

## Why

`createSlice` provides:
- Less boilerplate (actions + reducers together)
- Immer integration (write "mutating" logic safely)
- Automatic action creators
- Full TypeScript support
- Simpler, more maintainable code
