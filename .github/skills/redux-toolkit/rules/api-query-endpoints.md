---
title: Create Query Endpoints
impact: HIGH
impactDescription: Fetch data from server
tags: api, query, endpoints, get, fetching
---

## Create Query Endpoints

Define query endpoints for GET requests.

**Incorrect (manual data fetching):**

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

**Correct (RTK Query endpoints):**

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
