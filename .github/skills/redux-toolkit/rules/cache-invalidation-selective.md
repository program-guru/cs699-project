---
title: Use Selective Cache Invalidation
impact: MEDIUM
impactDescription: Reduce unnecessary requests
tags: cache, invalidation, tags, performance
---

## Use Selective Cache Invalidation

Invalidate specific cache entries instead of everything.

**Incorrect (over-invalidation):**

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

**Correct (selective invalidation):**

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
