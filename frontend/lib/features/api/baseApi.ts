import {
  createApi,
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from "@reduxjs/toolkit/query/react"
import { clearAuthenticatedUser } from "@/lib/features/auth/auth.slice"

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
const rawBaseQuery = fetchBaseQuery({
  baseUrl: apiUrl,
  credentials: "include",
  timeout: 5000,
  prepareHeaders: (headers) => {
    headers.set("Content-Type", "application/json")
    return headers
  },
})

const baseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions)

  if (result.error?.status === 401) {
    api.dispatch(clearAuthenticatedUser())
    if (api.endpoint !== "getMe" && typeof window !== "undefined") {
      window.dispatchEvent(new Event("auth-expired"))
    }
  }

  return result
}

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery,
  tagTypes: ["Admin", "Course"],
  endpoints: () => ({}),
})
