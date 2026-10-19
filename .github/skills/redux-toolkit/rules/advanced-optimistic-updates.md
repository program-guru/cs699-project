---
title: Implement Optimistic Updates
impact: MEDIUM
impactDescription: Better UX with instant feedback
tags: optimistic, updates, ux, performance, cache
---

## Implement Optimistic Updates

Update UI immediately before server confirmation for better UX.

**Incorrect (wait for server):**

```typescript
// No optimistic update - UI updates after server responds
addReaction: builder.mutation<Post, { postId: string; reaction: string }>({
  query: ({ postId, reaction }) => ({
    url: `/posts/${postId}/reactions`,
    method: 'POST',
    body: { reaction },
  }),
  invalidatesTags: ['Post'],
  // UI waits for server response - slow feeling
}),
```

**Correct (optimistic update):**

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
- Automatic rollback on errors
