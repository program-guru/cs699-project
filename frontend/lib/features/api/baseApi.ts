import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: apiUrl,
    credentials: 'include',
    timeout: 5000,
    prepareHeaders: (headers) => {
      headers.set('Content-Type', 'application/json')
      return headers
    },
  }),
  tagTypes: ['Admin'],
  endpoints: () => ({}),
})
