---
title: Base API Setup
impact: CRITICAL
impactDescription: Required for RTK Query
tags: api, rtk-query, setup, configuration
---

## Base API Setup

Create a base API with common configuration for all endpoints.

**Incorrect (manual API calls):**

```typescript
// Manual API calls with fetch
export const fetchUsers = async () => {
  const response = await fetch('https://api.example.com/users');
  return response.json();
};

export const createUser = async (userData) => {
  const response = await fetch('https://api.example.com/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  return response.json();
};
// No caching, no automatic refetching, duplicated config
```

**Correct (RTK Query base API):**

```typescript
// src/features/api/baseApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '@/store/store';

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: 'https://api.example.com',
    prepareHeaders: (headers, { getState }) => {
      // Add authentication token from Redux state
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  // Define tags for cache invalidation
  tagTypes: ['User', 'Post', 'Comment', 'Profile'],
  // Endpoints defined in feature files
  endpoints: () => ({}),
});
```

```typescript
// Add to store
import { baseApi } from '../features/api/baseApi';

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
});
```

## Why

Base API provides:
- Centralized configuration
- Automatic request caching
- Built-in loading/error states
- Authentication header injection
- Tag-based cache invalidation
- Request deduplication
