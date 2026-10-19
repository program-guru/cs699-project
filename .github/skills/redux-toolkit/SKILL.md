---
name: redux-toolkit
description: Redux Toolkit and RTK Query patterns for state management and API data fetching. Use when setting up Redux store, creating slices, implementing API calls, building optimistic updates, managing cache, or handling real-time data. Covers store setup, RTK Query endpoints, cache strategies, and advanced patterns.
license: MIT
tags: [react, redux, redux-toolkit, rtk-query, state-management, api, typescript]
metadata:
  author: redux-toolkit
  version: '2.0.0'
---

# Redux Toolkit & RTK Query

Comprehensive Redux Toolkit and RTK Query guide for React Native/Expo applications. Contains patterns for state management, API data fetching, cache management, and advanced features like optimistic updates and streaming.

## When to Apply

Reference these guidelines when:

- Setting up Redux store in React Native/Expo app
- Creating feature slices with actions and reducers
- Implementing API data fetching and caching
- Building optimistic updates for instant UI feedback
- Managing normalized cache with entity adapters
- Implementing real-time streaming updates
- Handling pagination or infinite scroll
- Testing Redux code

## Rule Categories by Priority

| Priority | Category            | Impact   | Prefix        |
| -------- | ------------------- | -------- | ------------- |
| 1        | Store Setup         | CRITICAL | `store-`      |
| 2        | State Management    | HIGH     | `slice-`      |
| 3        | API Integration     | HIGH     | `api-`        |
| 4        | Cache Management    | MEDIUM   | `cache-`      |
| 5        | Advanced Patterns   | MEDIUM   | `advanced-`   |
| 6        | Testing             | MEDIUM   | `testing-`    |

## Quick Reference

### 1. Store Setup (CRITICAL)

- `store-configure` - Configure Redux store with reducers and middleware
- `store-provider` - Wrap app with Redux Provider
- `store-typed-hooks` - Create typed hooks for dispatch and selector
- `store-types` - Export RootState and AppDispatch types

### 2. State Management (HIGH)

- `slice-create-basic` - Create basic slice with reducers
- `slice-with-payload` - Handle actions with payloads
- `slice-async-thunk` - Create async thunks for side effects
- `slice-selectors` - Build memoized selectors
- `slice-feature-structure` - Organize code by features

### 3. API Integration (HIGH)

- `api-base-setup` - Configure base API with fetchBaseQuery
- `api-query-endpoints` - Create query endpoints for GET requests
- `api-mutation-endpoints` - Create mutation endpoints for POST/PUT/DELETE
- `api-tags-system` - Implement tag-based cache invalidation
- `api-error-handling` - Handle API errors and loading states

### 4. Cache Management (MEDIUM)

- `cache-invalidation-selective` - Use specific tag invalidation
- `cache-prefetching` - Prefetch data before navigation
- `cache-polling` - Implement polling for real-time updates
- `cache-conditional-fetch` - Skip queries conditionally
- `cache-manual-update` - Manually update cache entries

### 5. Advanced Patterns (MEDIUM)

- `advanced-optimistic-updates` - Implement optimistic UI updates
- `advanced-entity-adapters` - Use entity adapters for normalized cache
- `advanced-streaming` - Implement WebSocket streaming
- `advanced-pagination` - Handle infinite scroll pagination
- `advanced-code-splitting` - Lazy load API slices

### 6. Testing (MEDIUM)

- `testing-slices` - Test Redux slices and reducers
- `testing-selectors` - Test memoized selectors
- `testing-async-thunks` - Test async thunks
- `testing-api-endpoints` - Test RTK Query endpoints

## How to Use

Read individual rule files for detailed explanations and code examples:

```
rules/store-configure.md
rules/api-base-setup.md
rules/advanced-optimistic-updates.md
```

Each rule file contains:

- Impact explanation and when to apply
- Bad example with explanation
- Good example with explanation
- Additional context and best practices

## Full Compiled Document

For the complete guide with all patterns expanded: `AGENTS.md`

## Quick Patterns (Most Common)

## Quick Patterns (Most Common)

### Store Setup
```typescript
import { configureStore } from '@reduxjs/toolkit';
import counterReducer from '../features/counter/counter.slice';
import { baseApi } from '../features/api/baseApi';

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### Pattern 2: Create Slice
```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

const counterSlice = createSlice({
  name: 'counter',
  initialState: { value: 0, loading: false },
  reducers: {
    increment: (state) => {
      state.value += 1; // Immer allows "mutation"
    },
    incrementByAmount: (state, action: PayloadAction<number>) => {
      state.value += action.payload;
    },
  },
});

export const { increment, incrementByAmount } = counterSlice.actions;
export default counterSlice.reducer;
```

### Typed Hooks
```typescript
// src/store/hooks.ts
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from './store';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

### RTK Query Base API
```typescript
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: 'https://api.example.com',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) headers.set('authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['User', 'Post', 'Comment'],
  endpoints: () => ({}), // Defined in feature files
});
```

### Query Endpoint
```typescript
export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<User[], void>({
      query: () => '/users',
      providesTags: ['User'],
    }),
    getUserById: builder.query<User, string>({
      query: (id) => `/users/${id}`,
      providesTags: (result, error, id) => [{ type: 'User', id }],
    }),
  }),
});

export const { useGetUsersQuery, useGetUserByIdQuery } = userApi;
```

### Mutation Endpoint
```typescript
export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    updateUser: builder.mutation<User, { id: string; data: UpdateUserRequest }>({
      query: ({ id, data }) => ({
        url: `/users/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'User', id }],
    }),
  }),
});

export const { useUpdateUserMutation } = userApi;
```

### Using in Component
```typescript
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { increment } from '@/features/counter';
import { useGetUsersQuery } from '@/features/user';

export const MyScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const count = useAppSelector(state => state.counter.value);
  const { data: users, isLoading } = useGetUsersQuery();

  return (
    <View>
      <Text>Count: {count}</Text>
      <Button title="+" onPress={() => dispatch(increment())} />
      {isLoading ? <ActivityIndicator /> : <UserList users={users} />}
    </View>
  );
};
```

### Memoized Selectors
```typescript
import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@/store/store';

const selectCounterValue = (state: RootState) => state.counter.value;
const selectCounterHistory = (state: RootState) => state.counter.history;

export const selectHistorySummary = createSelector(
  [selectCounterHistory],
  (history) => ({
    total: history.length,
    increments: history.filter(h => h.action === 'increment').length,
    decrements: history.filter(h => h.action === 'decrement').length,
  })
);
```

### Async Thunk
```typescript
import { createAsyncThunk } from '@reduxjs/toolkit';

export const fetchUser = createAsyncThunk(
  'user/fetchUser',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await userApi.getUser(userId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || 'Failed to fetch');
    }
  }
);

// Handle in slice
extraReducers: (builder) => {
  builder
    .addCase(fetchUser.pending, (state) => { state.loading = true; })
    .addCase(fetchUser.fulfilled, (state, action) => {
      state.loading = false;
      state.currentUser = action.payload;
    })
    .addCase(fetchUser.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
}
```

### Optimistic Update
```typescript
addReaction: builder.mutation<Post, { postId: string; reaction: string }>({
  query: ({ postId, reaction }) => ({
    url: `/posts/${postId}/reactions`,
    method: 'POST',
    body: { reaction },
  }),
  async onQueryStarted({ postId, reaction }, { dispatch, queryFulfilled }) {
    // Optimistic update
    const patchResult = dispatch(
      postsApi.util.updateQueryData('getPosts', undefined, (draft) => {
        const post = draft.entities[postId];
        if (post) post.reactions[reaction]++;
      })
    );

    try {
      await queryFulfilled;
    } catch {
      patchResult.undo(); // Rollback on error
    }
  },
}),
```

## Common Anti-Patterns

❌ Never mutate state outside `createSlice` reducers
❌ Don't store non-serializable data (functions, promises, class instances)
❌ Avoid putting UI-only state in Redux (use local state instead)
❌ Don't over-invalidate cache (use specific tags)
❌ Never skip loading/error state handling in components

## Requirements

- **React Native/Expo**: Any version
- **Redux Toolkit**: ^2.0.0 or ^1.9.0
- **React Redux**: ^8.0.0 or ^9.0.0
- **TypeScript**: ^5.0.0 (recommended)

## Resources

- [Redux Toolkit Documentation](https://redux-toolkit.js.org/)
- [RTK Query Documentation](https://redux-toolkit.js.org/rtk-query/overview)
- [Redux Essentials Tutorial](https://redux.js.org/tutorials/essentials/part-1-overview-concepts)