import { baseApi } from '@/lib/features/api/baseApi'
import type {
  AuthResponse,
  AuthRequest,
  CurrentUserResponse,
} from '@/types/auth'
import type { DTO } from '@/types/dto'

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, AuthRequest>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    logout: builder.mutation<DTO<null>, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
    }),
    getMe: builder.query<CurrentUserResponse, void>({
      query: () => '/auth/me',
    }),
  }),
})

export const { useLoginMutation, useLogoutMutation, useGetMeQuery } = authApi
