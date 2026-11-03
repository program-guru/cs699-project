import { baseApi } from "@/lib/features/api/baseApi"
import type {
  CollegesResponse,
  DepartmentsResponse,
} from "@/types/misc"

export const miscApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getColleges: builder.query<CollegesResponse, void>({
      query: () => "/misc/colleges",
    }),
    getDepartments: builder.query<DepartmentsResponse, string | void>({
      query: (collegeId) => ({
        url: "/misc/departments",
        ...(collegeId ? { params: { college_id: collegeId } } : {}),
      }),
    }),
  }),
})

export const { useGetCollegesQuery, useGetDepartmentsQuery } = miscApi
