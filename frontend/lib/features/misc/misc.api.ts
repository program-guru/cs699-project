import { baseApi } from "@/lib/features/api/baseApi"
import type {
  CollegesResponse,
  DepartmentsResponse,
  ScrapeRequest,
  ScrapeResponse,
} from "@/types/misc"
import type { CourseStatsResponse } from "@/types/course"

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
    getPlatformStats: builder.query<CourseStatsResponse, void>({
      query: () => "/misc/stats",
      providesTags: [{ type: "Stats", id: "PLATFORM" }],
    }),
    scrapeCourses: builder.mutation<ScrapeResponse, ScrapeRequest>({
      query: (request) => ({
        url: "/misc/scrape",
        method: "POST",
        body: request,
      }),
      invalidatesTags: (_result, error) =>
        error
          ? []
          : [
              { type: "Course", id: "LIST" },
              { type: "Course" },
              { type: "Stats", id: "PLATFORM" },
              { type: "Compare" },
            ],
    }),
  }),
})

export const {
  useGetCollegesQuery,
  useGetDepartmentsQuery,
  useGetPlatformStatsQuery,
  useScrapeCoursesMutation,
} = miscApi
