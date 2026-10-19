---
title: Build Memoized Selectors
impact: MEDIUM
impactDescription: Optimize performance with caching
tags: selectors, memoization, performance, reselect
---

## Build Memoized Selectors

Use `createSelector` for derived data to prevent unnecessary recalculations.

**Incorrect (recalculates every render):**

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

**Correct (memoized selector):**

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
