import { baseApi } from "@/lib/features/api/baseApi"
import type {
  CollegesResponse,
  DepartmentsResponse,
  ScrapeRequest,
  ScrapeResponse,
} from "@/types/misc"

export const miscApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getColleges: builder.query<CollegesResponse, void>({
      query: () => "/misc/colleges",
    }),
    getDepartments: builder.query<DepartmentsResponse, string | void>({
      query: (collegeName) => ({
        url: "/misc/departments",
        ...(collegeName ? { params: { college_name: collegeName } } : {}),
      }),
    }),
    scrapeCourses: builder.mutation<ScrapeResponse, ScrapeRequest>({
      query: (request) => ({
        url: "/misc/scrape",
        method: "POST",
        body: request,
      }),
    }),
  }),
})

export const {
  useGetCollegesQuery,
  useGetDepartmentsQuery,
  useScrapeCoursesMutation,
} = miscApi
