import { baseApi } from '@/lib/features/api/baseApi'
import type {
  AdminMutationResponse,
  AdminRequest,
  AdminResponse,
} from '@/types/admin'

export const adminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdmins: builder.query<AdminResponse, void>({
      query: () => '/admin/',
      providesTags: ['Admin'],
    }),
    createAdmin: builder.mutation<AdminMutationResponse, AdminRequest>({
      query: (admin) => ({
        url: '/admin/',
        method: 'POST',
        body: admin,
      }),
      invalidatesTags: ['Admin'],
    }),
    updateAdmin: builder.mutation<
      AdminMutationResponse,
      { username: string; admin: AdminRequest }
    >({
      query: ({ username, admin }) => ({
        url: `/admin/${encodeURIComponent(username)}`,
        method: 'PUT',
        body: admin,
      }),
      invalidatesTags: ['Admin'],
    }),
    deleteAdmin: builder.mutation<AdminMutationResponse, string>({
      query: (username) => ({
        url: `/admin/${encodeURIComponent(username)}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Admin'],
    }),
  }),
})

export const {
  useGetAdminsQuery,
  useCreateAdminMutation,
  useUpdateAdminMutation,
  useDeleteAdminMutation,
} = adminApi
