import { baseApi } from '@/lib/features/api/baseApi'
import type {
  AdminMutationResponse,
  AdminRequest,
  AdminResponse,
  AdminUpdateRequest,
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
      { adminId: string; admin: AdminUpdateRequest }
    >({
      query: ({ adminId, admin }) => ({
        url: `/admin/${encodeURIComponent(adminId)}`,
        method: 'PUT',
        body: admin,
      }),
      invalidatesTags: ['Admin'],
    }),
    deleteAdmin: builder.mutation<AdminMutationResponse, string>({
      query: (adminId) => ({
        url: `/admin/${encodeURIComponent(adminId)}`,
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
