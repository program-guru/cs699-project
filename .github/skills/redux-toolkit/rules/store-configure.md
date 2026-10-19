---
title: Configure Redux Store
impact: CRITICAL
impactDescription: Required for all Redux functionality
tags: store, setup, configuration, middleware
---

## Configure Redux Store

Use `configureStore()` to set up the Redux store with reducers and middleware.

**Incorrect (using legacy createStore):**

```typescript
// Using legacy createStore (deprecated)
import { createStore, combineReducers, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import counterReducer from '../features/counter/counter.slice';

const rootReducer = combineReducers({
  counter: counterReducer,
});

export const store = createStore(rootReducer, applyMiddleware(thunk));
// Missing TypeScript types, no DevTools, manual middleware setup
```

**Correct (using configureStore):**

```typescript
// src/store/store.ts - Complete setup
import { configureStore } from '@reduxjs/toolkit';
import counterReducer from '../features/counter/counter.slice';
import userReducer from '../features/user/user.slice';
import { baseApi } from '../features/api/baseApi';

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    user: userReducer,
    // Add API reducer
    [baseApi.reducerPath]: baseApi.reducer,
  },
  // Add API middleware - enables caching, invalidation, polling
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
});

// Infer types from store
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

## Why

`configureStore()` provides:
- Automatic Redux DevTools setup
- Default middleware (thunk, dev checks)
- Better TypeScript support
- Simplified configuration
- RTK Query middleware integration
