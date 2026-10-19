---
title: Create Mutation Endpoints
impact: HIGH
impactDescription: Modify data on server
tags: api, mutation, endpoints, post, put, delete
---

## Create Mutation Endpoints

Define mutation endpoints for POST, PUT, DELETE requests.

**Incorrect (missing invalidation):**

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

**Correct (with proper invalidation):**

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
