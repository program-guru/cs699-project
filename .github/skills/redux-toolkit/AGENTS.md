# Redux Toolkit & RTK Query

**Version 2.0.0**  
redux-toolkit 
February 2026

> **Note:**  
> This document is mainly for agents and LLMs to follow when implementing,  
> maintaining, or refactoring React codebases using Redux Toolkit and RTK Query.  
> Humans may also find it useful, but guidance here is optimized for automation  
> and consistency by AI-assisted workflows.

---

## Abstract

Comprehensive Redux Toolkit and RTK Query guide for React Native/Expo applications designed for AI agents and LLMs. Contains patterns for state management, API data fetching, cache management, and advanced features like optimistic updates, streaming, and pagination. Covers everything from basic store setup to production-grade patterns including code splitting, performance optimization, and testing.

---

## Table of Contents

1. [Store Setup](#1-store-setup) — **CRITICAL**
   - 1.1 [Configure Store](#11-configure-store)
   - 1.2 [Provider Setup](#12-provider-setup)
   - 1.3 [Typed Hooks](#13-typed-hooks)
   - 1.4 [Export Types](#14-export-types)

2. [State Management](#2-state-management) — **HIGH**
   - 2.1 [Create Basic Slice](#21-create-basic-slice)
   - 2.2 [Actions with Payloads](#22-actions-with-payloads)
   - 2.3 [Memoized Selectors](#23-memoized-selectors)
   - 2.4 [Async Thunks](#24-async-thunks)
   - 2.5 [Feature-Based Architecture](#25-feature-based-architecture)

3. [API Integration](#3-api-integration) — **HIGH**
   - 3.1 [Base API Setup](#31-base-api-setup)
   - 3.2 [Query Endpoints](#32-query-endpoints)
   - 3.3 [Mutation Endpoints](#33-mutation-endpoints)
   - 3.4 [Tag-Based Cache Invalidation](#34-tag-based-cache-invalidation)
   - 3.5 [Using in Components](#35-using-in-components)

4. [Cache Management](#4-cache-management) — **MEDIUM**
   - 4.1 [Selective Invalidation](#41-selective-invalidation)
   - 4.2 [Manual Cache Updates](#42-manual-cache-updates)
   - 4.3 [Prefetching](#43-prefetching)
   - 4.4 [Polling](#44-polling)
   - 4.5 [Conditional Fetching](#45-conditional-fetching)

5. [Advanced Patterns](#5-advanced-patterns) — **MEDIUM**
   - 5.1 [Optimistic Updates](#51-optimistic-updates)
   - 5.2 [Entity Adapters & Normalized Cache](#52-entity-adapters--normalized-cache)
   - 5.3 [Streaming Updates](#53-streaming-updates)
   - 5.4 [Pagination Patterns](#54-pagination-patterns)
   - 5.5 [Code Splitting](#55-code-splitting)

6. [Testing](#6-testing) — **MEDIUM**
   - 6.1 [Testing Slices](#61-testing-slices)
   - 6.2 [Testing Selectors](#62-testing-selectors)
   - 6.3 [Testing Async Thunks](#63-testing-async-thunks)
   - 6.4 [Testing API Endpoints](#64-testing-api-endpoints)

---

## 1. Store Setup

**Impact: CRITICAL**

Proper store configuration is the foundation of Redux Toolkit applications.

### 1.1 Configure Store

**Impact: CRITICAL (Required for all Redux functionality)**

Use `configureStore()` to set up the Redux store with reducers and middleware.

## Bad Example

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

```typescript
// Missing RTK Query middleware
export const store = configureStore({
  reducer: {
    counter: counterReducer,
    [baseApi.reducerPath]: baseApi.reducer,
    // Missing middleware - RTK Query won't work properly
  },
});
```

## Good Example

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

---

### 1.2 Provider Setup

**Impact: CRITICAL (Required to use Redux in components)**

Wrap your application with Redux Provider to make the store available.

## Bad Example

```typescript
// Missing Provider
export default function App() {
  return (
    <NavigationContainer>
      <RootNavigator />
    </NavigationContainer>
  );
  // Components can't access Redux store
}
```

## Good Example

```typescript
// App.tsx - Proper Provider setup
import React from 'react';
import { Provider } from 'react-redux';
import { store } from './src/store/store';
import { NavigationContainer } from '@react-navigation/native';
import { RootNavigator } from './src/navigation/RootNavigator';

export default function App() {
  return (
    <Provider store={store}>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </Provider>
  );
}
```

## Why

Provider uses React Context to make the Redux store available to all components in the tree.

---

### 1.3 Typed Hooks

**Impact: HIGH (Ensures type safety throughout app)**

Create typed versions of `useDispatch` and `useSelector` hooks.

## Bad Example

```typescript
// Using untyped hooks directly
import { useDispatch, useSelector } from 'react-redux';

const MyComponent = () => {
  const dispatch = useDispatch(); // No type inference
  const value = useSelector(state => state.counter.value); // No autocomplete
  // ...
};
```

## Good Example

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

---

### 1.4 Export Types

**Impact: MEDIUM (Required for TypeScript projects)**

Export RootState and AppDispatch types for use throughout the app.

## Good Example

```typescript
// src/store/store.ts
export const store = configureStore({
  reducer: {
    counter: counterReducer,
    user: userReducer,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
});

// Export types for use in other files
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

## Why

Exporting types enables:
- Type-safe selectors
- Proper typing for async thunks
- IDE autocomplete
- Compile-time error checking

---

## 2. State Management

**Impact: HIGH**

Core patterns for managing application state with Redux Toolkit.

### 2.1 Create Basic Slice

**Impact: HIGH (Foundation of state management)**

Use `createSlice` to define state, actions, and reducers in one place.

## Bad Example

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

## Good Example

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
    reset: () => initialState,
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
  },
});

export const { increment, decrement, reset, setLoading } = counterSlice.actions;
export default counterSlice.reducer;
```

## Why

`createSlice` provides:
- Less boilerplate (actions + reducers together)
- Immer integration (write "mutating" logic safely)
- Automatic action creators
- Full TypeScript support
- Simpler, more maintainable code

---

### 2.2 Actions with Payloads

**Impact: HIGH (Handle complex state updates)**

Use PayloadAction type for actions that carry data.

## Bad Example

```typescript
// No TypeScript typing
incrementByAmount: (state, action) => {
  state.value += action.payload; // No type checking
},
```

## Good Example

```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export const counterSlice = createSlice({
  name: 'counter',
  initialState: { value: 0 },
  reducers: {
    // Simple action with typed payload
    incrementByAmount: (state, action: PayloadAction<number>) => {
      state.value += action.payload;
    },
    
    // Action with complex payload
    addTodo: (state, action: PayloadAction<{ text: string; priority: number }>) => {
      state.todos.push({
        id: Date.now(),
        text: action.payload.text,
        priority: action.payload.priority,
        completed: false,
      });
    },
    
    // Using prepare callback for custom payloads
    addTodoWithId: {
      reducer: (state, action: PayloadAction<Todo>) => {
        state.todos.push(action.payload);
      },
      prepare: (text: string) => ({
        payload: {
          id: nanoid(),
          text,
          completed: false,
          createdAt: Date.now(),
        },
      }),
    },
  },
});
```

## Why

PayloadAction provides:
- Type-safe payload access
- IDE autocomplete
- Compile-time error detection
- Self-documenting code

---

### 2.3 Memoized Selectors

**Impact: MEDIUM (Optimize performance)**

Use `createSelector` for derived data to prevent unnecessary recalculations.

## Bad Example

```typescript
// Recalculates on every render
const MyComponent = () => {
  const todos = useAppSelector(state => state.todos.items);
  const filter = useAppSelector(state => state.todos.filter);
  
  // Filters every render, even if todos/filter haven't changed
  const filteredTodos = todos.filter(t => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });
  
  return <TodoList todos={filteredTodos} />;
};
```

## Good Example

```typescript
// src/features/todos/todos.selectors.ts
import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@/store/store';

// Input selectors
const selectTodos = (state: RootState) => state.todos.items;
const selectFilter = (state: RootState) => state.todos.filter;

// Memoized selector - only recomputes when inputs change
export const selectFilteredTodos = createSelector(
  [selectTodos, selectFilter],
  (todos, filter) => {
    switch (filter) {
      case 'active':
        return todos.filter(t => !t.completed);
      case 'completed':
        return todos.filter(t => t.completed);
      default:
        return todos;
    }
  }
);

// Composed selectors
export const selectTodoStats = createSelector(
  [selectTodos],
  (todos) => ({
    total: todos.length,
    active: todos.filter(t => !t.completed).length,
    completed: todos.filter(t => t.completed).length,
  })
);
```

```typescript
// In component - reuses cached result
const MyComponent = () => {
  const filteredTodos = useAppSelector(selectFilteredTodos);
  const stats = useAppSelector(selectTodoStats);
  
  return <TodoList todos={filteredTodos} stats={stats} />;
};
```

## Why

Memoized selectors provide:
- Performance optimization (caching)
- Prevent unnecessary recalculations
- Composable logic
- Testable business logic

---

### 2.4 Async Thunks

**Impact: HIGH (Handle async operations)**

Use `createAsyncThunk` for async operations like API calls.

## Bad Example

```typescript
// Manual async handling in component
const MyComponent = () => {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const fetchUser = async (userId) => {
    setLoading(true);
    try {
      const response = await api.getUser(userId);
      dispatch(setUser(response.data));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  // Duplicated logic, no Redux state for loading/error
};
```

## Good Example

```typescript
// src/features/user/user.slice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

interface User {
  id: string;
  name: string;
  email: string;
}

interface UserState {
  currentUser: User | null;
  loading: boolean;
  error: string | null;
}

// Create async thunk BEFORE slice
export const fetchUser = createAsyncThunk(
  'user/fetchUser',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await userApi.getUser(userId);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || 'Failed to fetch user');
    }
  }
);

const initialState: UserState = {
  currentUser: null,
  loading: false,
  error: null,
};

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  // Handle async thunk actions
  extraReducers: (builder) => {
    builder
      .addCase(fetchUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.loading = false;
        state.currentUser = action.payload;
      })
      .addCase(fetchUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = userSlice.actions;
export default userSlice.reducer;
```

```typescript
// In component - simple usage
const UserProfile = ({ userId }) => {
  const dispatch = useAppDispatch();
  const { currentUser, loading, error } = useAppSelector(state => state.user);

  useEffect(() => {
    dispatch(fetchUser(userId));
  }, [userId, dispatch]);

  if (loading) return <ActivityIndicator />;
  if (error) return <Text>Error: {error}</Text>;
  if (!currentUser) return <Text>No user found</Text>;

  return <UserCard user={currentUser} />;
};
```

## Why

createAsyncThunk provides:
- Automatic action types (pending/fulfilled/rejected)
- Centralized error handling
- Loading state management
- Reusable async logic
- Cancellation support

---

### 2.5 Feature-Based Architecture

**Impact: MEDIUM (Maintainable code organization)**

Organize Redux code by features, not by type.

## Bad Example

```
src/
├── actions/
│   ├── counterActions.ts
│   ├── userActions.ts
│   └── todosActions.ts
├── reducers/
│   ├── counterReducer.ts
│   ├── userReducer.ts
│   └── todosReducer.ts
├── selectors/
│   ├── counterSelectors.ts
│   ├── userSelectors.ts
│   └── todosSelectors.ts
└── types/
    ├── counterTypes.ts
    └── userTypes.ts
// Related code scattered across directories
```

## Good Example

```
src/
├── store/
│   ├── store.ts              # Store configuration
│   └── hooks.ts              # Typed hooks
├── features/
│   ├── counter/
│   │   ├── counter.slice.ts      # Slice definition
│   │   ├── counter.selectors.ts  # Selectors
│   │   ├── counter.types.ts      # TypeScript types
│   │   └── index.ts              # Barrel export
│   ├── todos/
│   │   ├── todos.slice.ts
│   │   ├── todos.selectors.ts
│   │   ├── todos.types.ts
│   │   └── index.ts
│   └── user/
│       ├── user.slice.ts
│       ├── user.selectors.ts
│       ├── user.types.ts
│       └── index.ts
└── screens/
    └── CounterScreen.tsx
```

```typescript
// src/features/counter/index.ts - Barrel export
export * from './counter.slice';
export * from './counter.selectors';
export * from './counter.types';
```

## Why

Feature-based structure provides:
- Related code co-located
- Easier to find files
- Better for code splitting
- Simpler refactoring
- Clearer dependencies

---

## 3. API Integration

**Impact: HIGH**

RTK Query eliminates the need for manual API calls, loading states, and cache management.

### 3.1 Base API Setup

**Impact: CRITICAL (Required for RTK Query)**

Create a base API with common configuration for all endpoints.

## Bad Example

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

## Good Example

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

---

### 3.2 Query Endpoints

**Impact: HIGH (Fetch data from server)**

Define query endpoints for GET requests.

## Bad Example

```typescript
// Manual data fetching
const MyComponent = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    setLoading(true);
    fetch('/api/users')
      .then(res => res.json())
      .then(data => {
        setUsers(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  }, []);
  // No caching, duplicated logic, manual state management
};
```

## Good Example

```typescript
// src/features/user/user.api.ts
import { baseApi } from '../api/baseApi';

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // List all users
    getUsers: builder.query<User[], void>({
      query: () => '/users',
      providesTags: ['User'],
    }),

    // Get single user by ID
    getUserById: builder.query<User, string>({
      query: (id) => `/users/${id}`,
      providesTags: (result, error, id) => [{ type: 'User', id }],
    }),

    // Query with parameters
    searchUsers: builder.query<User[], { name: string; limit?: number }>({
      query: ({ name, limit = 10 }) => ({
        url: '/users/search',
        params: { name, limit },
      }),
      providesTags: ['User'],
    }),
  }),
  overrideExisting: false,
});

export const { 
  useGetUsersQuery, 
  useGetUserByIdQuery,
  useSearchUsersQuery 
} = userApi;
```

```typescript
// In component - automatic caching and state management
const UserListScreen = () => {
  const { data: users, isLoading, error, refetch } = useGetUsersQuery();

  if (isLoading) return <ActivityIndicator />;
  if (error) return <Text>Error: {error.toString()}</Text>;

  return (
    <FlatList
      data={users}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <UserCard user={item} />}
      refreshing={isLoading}
      onRefresh={refetch}
    />
  );
};
```

## Why

Query endpoints provide:
- Automatic caching
- Loading/error states
- Request deduplication
- Auto-generated hooks
- Refetch on demand
- Background refetching

---

### 3.3 Mutation Endpoints

**Impact: HIGH (Modify data on server)**

Define mutation endpoints for POST, PUT, DELETE requests.

## Good Example

```typescript
// src/features/user/user.api.ts
export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Create user (POST)
    createUser: builder.mutation<User, Omit<User, 'id' | 'createdAt'>>({
      query: (newUser) => ({
        url: '/users',
        method: 'POST',
        body: newUser,
      }),
      invalidatesTags: ['User'],
    }),

    // Update user (PUT)
    updateUser: builder.mutation<User, { id: string; data: UpdateUserRequest }>({
      query: ({ id, data }) => ({
        url: `/users/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'User', id },
        'User',
      ],
    }),

    // Delete user (DELETE)
    deleteUser: builder.mutation<void, string>({
      query: (id) => ({
        url: `/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const {
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} = userApi;
```

```typescript
// In component
const CreateUserScreen = () => {
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [createUser, { isLoading, error }] = useCreateUserMutation();

  const handleSubmit = async () => {
    try {
      await createUser(formData).unwrap();
      Alert.alert('Success', 'User created!');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', 'Failed to create user');
    }
  };

  return (
    <View>
      <TextInput
        placeholder="Name"
        value={formData.name}
        onChangeText={(name) => setFormData({ ...formData, name })}
      />
      <Button
        title={isLoading ? 'Creating...' : 'Create User'}
        onPress={handleSubmit}
        disabled={isLoading}
      />
    </View>
  );
};
```

## Why

Mutation endpoints provide:
- Automatic cache invalidation
- Loading/error states
- Optimistic updates support
- Request cancellation
- Error rollback

---

### 3.4 Tag-Based Cache Invalidation

**Impact: HIGH (Keep data fresh)**

Use tags to automatically refetch data when it changes.

## Bad Example

```typescript
// No invalidation - stale data
createUser: builder.mutation<User, NewUser>({
  query: (user) => ({
    url: '/users',
    method: 'POST',
    body: user,
  }),
  // Missing invalidatesTags - user list won't update
}),
```

## Good Example

```typescript
export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Queries PROVIDE tags
    getUsers: builder.query<User[], void>({
      query: () => '/users',
      // Provide both list tag and individual tags
      providesTags: (result) =>
        result
          ? [
              'User', // List tag
              ...result.map(({ id }) => ({ type: 'User' as const, id })),
            ]
          : ['User'],
    }),

    getUserById: builder.query<User, string>({
      query: (id) => `/users/${id}`,
      providesTags: (result, error, id) => [{ type: 'User', id }],
    }),

    // Mutations INVALIDATE tags
    updateUser: builder.mutation<User, { id: string; data: Partial<User> }>({
      query: ({ id, data }) => ({
        url: `/users/${id}`,
        method: 'PATCH',
        body: data,
      }),
      // Invalidate specific user and the list
      invalidatesTags: (result, error, { id }) => [
        { type: 'User', id },
        'User',
      ],
    }),
  }),
});
```

## Why

Tag-based invalidation provides:
- Automatic refetching
- Fine-grained control
- Less manual cache management
- Consistent data across app
- Reduced boilerplate

---

### 3.5 Using in Components

**Impact: HIGH (Connect UI to API)**

Use auto-generated hooks to fetch and mutate data.

## Good Example

```typescript
// Query hook usage
const UserDetailScreen = ({ userId }) => {
  const { data: user, isLoading, error, refetch } = useGetUserByIdQuery(userId);

  if (isLoading) return <ActivityIndicator />;
  if (error) return <ErrorView error={error} onRetry={refetch} />;
  if (!user) return <Text>User not found</Text>;

  return <UserProfile user={user} />;
};
```

```typescript
// Mutation hook usage
const EditUserScreen = ({ userId }) => {
  const { data: user, isLoading: loadingUser } = useGetUserByIdQuery(userId);
  const [updateUser, { isLoading: updating }] = useUpdateUserMutation();
  
  const [name, setName] = useState('');

  useEffect(() => {
    if (user) setName(user.name);
  }, [user]);

  const handleUpdate = async () => {
    try {
      await updateUser({ id: userId, data: { name } }).unwrap();
      Alert.alert('Success', 'User updated!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to update user');
    }
  };

  if (loadingUser) return <ActivityIndicator />;

  return (
    <View>
      <TextInput value={name} onChangeText={setName} />
      <Button
        title={updating ? 'Updating...' : 'Update'}
        onPress={handleUpdate}
        disabled={updating}
      />
    </View>
  );
};
```

## Why

Auto-generated hooks provide:
- Automatic state management
- Loading/error handling
- Type safety
- Consistent API
- Less boilerplate

---

## 4. Cache Management

**Impact: MEDIUM**

Fine-tune RTK Query's cache behavior for optimal performance.

### 4.1 Selective Invalidation

**Impact: MEDIUM (Reduce unnecessary requests)**

Invalidate specific cache entries instead of everything.

## Bad Example

```typescript
// Over-invalidation
updatePost: builder.mutation<Post, { id: string; data: Partial<Post> }>({
  query: ({ id, data }) => ({
    url: `/posts/${id}`,
    method: 'PATCH',
    body: data,
  }),
  // Refetches ALL posts, users, comments - wasteful
  invalidatesTags: ['Post', 'User', 'Comment'],
}),
```

## Good Example

```typescript
// Selective invalidation
updatePost: builder.mutation<Post, { id: string; data: Partial<Post> }>({
  query: ({ id, data }) => ({
    url: `/posts/${id}`,
    method: 'PATCH',
    body: data,
  }),
  // Only invalidate the specific post and the list
  invalidatesTags: (result, error, { id }) => [
    { type: 'Post', id },
    'Post', // List needs to refetch for sorting/counts
  ],
}),

deletePost: builder.mutation<void, string>({
  query: (id) => ({
    url: `/posts/${id}`,
    method: 'DELETE',
  }),
  // Only invalidate the list (item no longer exists)
  invalidatesTags: ['Post'],
}),
```

## Why

Selective invalidation:
- Reduces network requests
- Improves performance
- Faster UI updates
- Better user experience

---

### 4.2 Manual Cache Updates

**Impact: MEDIUM (Optimize specific scenarios)**

Manually update cache for instant UI updates.

## Good Example

```typescript
updatePost: builder.mutation<Post, { id: string; data: Partial<Post> }>({
  query: ({ id, data }) => ({
    url: `/posts/${id}`,
    method: 'PATCH',
    body: data,
  }),
  async onQueryStarted({ id, data }, { dispatch, queryFulfilled }) {
    // Optimistically update both caches
    const patchList = dispatch(
      postsApi.util.updateQueryData('getPosts', undefined, (draft) => {
        const post = draft.find(p => p.id === id);
        if (post) Object.assign(post, data);
      })
    );
    
    const patchDetail = dispatch(
      postsApi.util.updateQueryData('getPost', id, (draft) => {
        Object.assign(draft, data);
      })
    );

    try {
      const { data: updatedPost } = await queryFulfilled;
      // Replace with server response
      dispatch(
        postsApi.util.updateQueryData('getPosts', undefined, (draft) => {
          const post = draft.find(p => p.id === id);
          if (post) Object.assign(post, updatedPost);
        })
      );
    } catch {
      // Rollback on error
      patchList.undo();
      patchDetail.undo();
    }
  },
}),
```

## Why

Manual cache updates:
- Instant UI feedback
- Reduced network requests
- Better UX
- Error rollback support

---

### 4.3 Prefetching

**Impact: LOW-MEDIUM (Improve perceived performance)**

Prefetch data before it's needed.

## Good Example

```typescript
const HomeScreen = ({ navigation }) => {
  const dispatch = useAppDispatch();

  const prefetchUser = (userId: string) => {
    dispatch(
      baseApi.util.prefetch('getUserById', userId, { force: false })
    );
  };

  return (
    <TouchableOpacity
      onPressIn={() => prefetchUser('123')} // Prefetch on hover/press
      onPress={() => navigation.navigate('UserDetail', { userId: '123' })}
    >
      <Text>View User</Text>
    </TouchableOpacity>
  );
};
```

## Why

Prefetching:
- Faster perceived navigation
- Data ready when needed
- Better user experience

---

### 4.4 Polling

**Impact: MEDIUM (Real-time updates)**

Automatically refetch data at intervals.

## Good Example

```typescript
const LiveDataScreen = () => {
  const { data, isLoading } = useGetUsersQuery(undefined, {
    // Poll every 5 seconds
    pollingInterval: 5000,
  });

  return <UserList users={data} />;
};
```

```typescript
// Conditional polling
const DashboardScreen = () => {
  const [isActive, setIsActive] = useState(true);
  
  const { data } = useGetStatsQuery(undefined, {
    pollingInterval: isActive ? 3000 : 0, // Stop polling when inactive
  });

  return <StatsView data={data} />;
};
```

## Why

Polling provides:
- Real-time updates
- Simple implementation
- No WebSocket needed

---

### 4.5 Conditional Fetching

**Impact: MEDIUM (Avoid unnecessary requests)**

Skip queries when data isn't needed.

## Good Example

```typescript
const UserProfile = ({ userId }) => {
  // Skip query if userId is not provided
  const { data, isLoading } = useGetUserByIdQuery(userId!, {
    skip: !userId,
  });

  if (!userId) return <Text>No user selected</Text>;
  if (isLoading) return <ActivityIndicator />;
  
  return <UserCard user={data} />;
};
```

```typescript
// Skip based on state
const PostsScreen = () => {
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);
  
  const { data, error } = useGetPostsQuery(undefined, {
    skip: !isAuthenticated, // Don't fetch if not logged in
  });

  if (!isAuthenticated) return <LoginPrompt />;
  
  return <PostsList posts={data} />;
};
```

## Why

Conditional fetching:
- Avoids unnecessary requests
- Saves bandwidth
- Better performance

---

## 5. Advanced Patterns

**Impact: MEDIUM**

Production-grade patterns for complex applications.

### 5.1 Optimistic Updates

**Impact: MEDIUM (Better UX)**

Update UI immediately before server confirmation.

## Good Example

```typescript
addReaction: builder.mutation<Post, { postId: string; reaction: string }>({
  query: ({ postId, reaction }) => ({
    url: `/posts/${postId}/reactions`,
    method: 'POST',
    body: { reaction },
  }),
  async onQueryStarted({ postId, reaction }, { dispatch, queryFulfilled }) {
    // Update cache BEFORE request completes
    const patchResult = dispatch(
      postsApi.util.updateQueryData('getPosts', undefined, (draft) => {
        const post = draft.find(p => p.id === postId);
        if (post) {
          post.reactions[reaction] = (post.reactions[reaction] || 0) + 1;
        }
      })
    );

    try {
      await queryFulfilled;
    } catch {
      // Rollback on error
      patchResult.undo();
    }
  },
}),
```

## Why

Optimistic updates:
- Instant UI feedback
- Better perceived performance
- Professional UX
- Automatic rollback

---

### 5.2 Entity Adapters & Normalized Cache

**Impact: MEDIUM (Handle relational data)**

Use entity adapters for normalized storage of collections.

## Good Example

```typescript
import { createEntityAdapter, EntityState } from '@reduxjs/toolkit';

const postsAdapter = createEntityAdapter<Post>({
  selectId: (post) => post.id,
  sortComparer: (a, b) => b.date.localeCompare(a.date),
});

interface PostsResponse extends EntityState<Post> {
  totalCount: number;
}

export const postsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPosts: builder.query<PostsResponse, void>({
      query: () => '/posts',
      transformResponse: (response: Post[]) => {
        return postsAdapter.setAll(
          postsAdapter.getInitialState({ totalCount: response.length }),
          response
        );
      },
      providesTags: (result) => {
        if (!result) return ['Post'];
        return [
          'Post',
          ...result.ids.map((id) => ({ type: 'Post' as const, id })),
        ];
      },
    }),
  }),
});

// Selectors
const selectPostsResult = postsApi.endpoints.getPosts.select();
const selectPostsData = createSelector(
  selectPostsResult,
  (result) => result.data
);

export const {
  selectAll: selectAllPosts,
  selectById: selectPostById,
} = postsAdapter.getSelectors(
  (state: RootState) => selectPostsData(state) ?? postsAdapter.getInitialState()
);
```

## Why

Entity adapters:
- Efficient lookups by ID
- Automatic sorting
- Normalized storage
- Reduces data duplication

---

### 5.3 Streaming Updates

**Impact: MEDIUM (Real-time apps)**

Implement WebSocket streaming for live updates.

## Good Example

```typescript
export const notificationsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<Notification[], void>({
      query: () => '/notifications',
      async onCacheEntryAdded(
        arg,
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved }
      ) {
        await cacheDataLoaded;

        const ws = new WebSocket('wss://api.example.com/notifications');

        try {
          ws.onmessage = (event) => {
            const notification = JSON.parse(event.data);
            
            updateCachedData((draft) => {
              draft.unshift(notification);
              if (draft.length > 50) draft.pop();
            });
          };

          await cacheEntryRemoved;
        } finally {
          ws.close();
        }
      },
      providesTags: ['Notification'],
    }),
  }),
});
```

## Why

Streaming provides:
- Real-time updates
- Live data sync
- Professional features
- WebSocket integration

---

### 5.4 Pagination Patterns

**Impact: MEDIUM (Handle large datasets)**

Implement infinite scroll pagination.

## Good Example

```typescript
export const postsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getInfinitePosts: builder.query<
      PostsResponse,
      { page: number; limit: number }
    >({
      query: ({ page, limit }) => ({
        url: '/posts',
        params: { page, limit },
      }),
      transformResponse: (response: PaginatedResponse<Post>) => {
        return {
          ...postsAdapter.setAll(
            postsAdapter.getInitialState(),
            response.data
          ),
          hasMore: response.hasMore,
        };
      },
      serializeQueryArgs: ({ endpointName }) => endpointName,
      merge: (currentCache, newData) => {
        postsAdapter.addMany(currentCache, newData.ids);
        currentCache.hasMore = newData.hasMore;
      },
      forceRefetch({ currentArg, previousArg }) {
        return currentArg?.page !== previousArg?.page;
      },
    }),
  }),
});
```

```typescript
// In component
const InfinitePostsScreen = () => {
  const [page, setPage] = useState(1);
  const { data, isFetching } = useGetInfinitePostsQuery({ page, limit: 20 });

  const loadMore = () => {
    if (data?.hasMore && !isFetching) {
      setPage(page + 1);
    }
  };

  return (
    <FlatList
      data={Object.values(data?.entities || {})}
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
    />
  );
};
```

## Why

Pagination:
- Handle large datasets
- Better performance
- Smooth infinite scroll
- Memory efficient

---

### 5.5 Code Splitting

**Impact: LOW-MEDIUM (Reduce bundle size)**

Split API slices by feature.

## Good Example

```typescript
// src/features/posts/posts.api.ts
export const postsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPosts: builder.query<Post[], void>({
      query: () => '/posts',
    }),
  }),
  overrideExisting: false,
});

// src/features/comments/comments.api.ts
export const commentsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getComments: builder.query<Comment[], string>({
      query: (postId) => `/posts/${postId}/comments`,
    }),
  }),
  overrideExisting: false,
});
```

## Why

Code splitting:
- Smaller initial bundle
- Faster app startup
- Load on demand
- Better organization

---

## 6. Testing

**Impact: MEDIUM**

Test Redux logic to ensure correctness.

### 6.1 Testing Slices

**Impact: MEDIUM (Ensure state logic works)**

Test reducers and actions.

## Good Example

```typescript
import counterReducer, { increment, decrement, incrementByAmount } from './counter.slice';

describe('counter slice', () => {
  const initialState = { value: 0, loading: false };

  it('should return initial state', () => {
    expect(counterReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle increment', () => {
    const actual = counterReducer(initialState, increment());
    expect(actual.value).toEqual(1);
  });

  it('should handle incrementByAmount', () => {
    const actual = counterReducer(initialState, incrementByAmount(5));
    expect(actual.value).toEqual(5);
  });
});
```

---

### 6.2 Testing Selectors

**Impact: MEDIUM (Ensure data derivation works)**

Test memoized selectors.

## Good Example

```typescript
import { selectFilteredTodos, selectTodoStats } from './todos.selectors';

describe('todos selectors', () => {
  const state = {
    todos: {
      items: [
        { id: '1', text: 'Test 1', completed: false },
        { id: '2', text: 'Test 2', completed: true },
      ],
      filter: 'all',
    },
  };

  it('should select filtered todos', () => {
    const filtered = selectFilteredTodos(state);
    expect(filtered).toHaveLength(2);
  });

  it('should calculate stats correctly', () => {
    const stats = selectTodoStats(state);
    expect(stats).toEqual({
      total: 2,
      active: 1,
      completed: 1,
    });
  });
});
```

---

### 6.3 Testing Async Thunks

**Impact: MEDIUM (Ensure async logic works)**

Test async thunks with mock API calls.

## Good Example

```typescript
import { configureStore } from '@reduxjs/toolkit';
import userReducer, { fetchUser } from './user.slice';

describe('fetchUser thunk', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: { user: userReducer },
    });
  });

  it('should fetch user successfully', async () => {
    jest.spyOn(userApi, 'getUser').mockResolvedValue({
      data: { id: '1', name: 'Test', email: 'test@example.com' },
    });

    await store.dispatch(fetchUser('1'));

    const state = store.getState().user;
    expect(state.loading).toBe(false);
    expect(state.currentUser?.name).toBe('Test');
  });

  it('should handle fetch error', async () => {
    jest.spyOn(userApi, 'getUser').mockRejectedValue(new Error('API Error'));

    await store.dispatch(fetchUser('1'));

    const state = store.getState().user;
    expect(state.error).toBeTruthy();
  });
});
```

---

### 6.4 Testing API Endpoints

**Impact: MEDIUM (Ensure API integration works)**

Test RTK Query endpoints.

## Good Example

```typescript
import { configureStore } from '@reduxjs/toolkit';
import { baseApi } from './baseApi';

describe('User API', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        [baseApi.reducerPath]: baseApi.reducer,
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(baseApi.middleware),
    });
  });

  afterEach(() => {
    store.dispatch(baseApi.util.resetApiState());
  });

  it('should fetch users successfully', async () => {
    const promise = store.dispatch(
      baseApi.endpoints.getUsers.initiate()
    );

    const result = await promise;
    
    expect(result.isSuccess).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
  });
});
```

---

## Best Practices Summary

1. **Use `configureStore()`** - Don't use legacy `createStore()`
2. **Feature-based structure** - Organize by features, not types
3. **Type everything** - Use TypeScript for all slices and APIs
4. **Memoize selectors** - Use `createSelector` for derived data
5. **Tag-based invalidation** - Leverage RTK Query's tag system
6. **Optimistic updates** - Improve UX with instant feedback
7. **Test thoroughly** - Write tests for slices, selectors, and APIs
8. **Code split** - Split API slices by feature
9. **Handle all states** - Check loading, error, and success
10. **Use typed hooks** - Always use `useAppDispatch` and `useAppSelector`

---

## Common Mistakes

❌ **Mutating state outside createSlice** - Immer only works in reducers
✅ Always dispatch actions

❌ **Storing non-serializable data** - Functions, promises, class instances
✅ Keep state serializable

❌ **Not handling loading/error** - Components crash
✅ Check all states

❌ **Over-invalidating cache** - Too many requests
✅ Use specific tags

❌ **UI state in Redux** - Modal open/closed
✅ Use local state

---

## Resources

- [Redux Toolkit Documentation](https://redux-toolkit.js.org/)
- [RTK Query Documentation](https://redux-toolkit.js.org/rtk-query/overview)
- [Redux Essentials Tutorial](https://redux.js.org/tutorials/essentials/part-1-overview-concepts)
- [Immer Documentation](https://immerjs.github.io/immer/)
