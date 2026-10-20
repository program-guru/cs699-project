import { baseApi } from '@/lib/features/api/baseApi'
import type { AuthResponse, AuthRequest } from '@/types/auth'

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, AuthRequest>({
      query: (credentials) => ({
        url: '/admin/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    logout: builder.mutation<AuthResponse, void>({
      query: () => ({
        url: '/admin/logout',
        method: 'POST',
      }),
    }),
  }),
})

export const { useLoginMutation, useLogoutMutation } = authApi
