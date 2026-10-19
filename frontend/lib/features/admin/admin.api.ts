import { baseApi } from '../api/baseApi'

interface Admin {
  id: string | null
  username: string
}

interface AdminResponse {
  success: boolean
  message: string
  data: Admin[]
}

export const adminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAdmins: builder.query<AdminResponse, void>({
      query: () => '/admin/',
      providesTags: ['Admin'],
    }),
  }),
})

export const { useGetAdminsQuery } = adminApi
