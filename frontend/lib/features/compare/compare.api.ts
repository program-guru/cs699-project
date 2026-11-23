import { baseApi } from "@/lib/features/api/baseApi"
import type { SimilarCoursesResponse } from "@/types/course"
import type { ComparisonSummaryResponse } from "@/types/compare"

export const compareApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getSimilarCourses: builder.query<
      SimilarCoursesResponse,
      { courseId: string; crossDepartment?: boolean }
    >({
      query: ({ courseId, crossDepartment = false }) => ({
        url: `/compare/${encodeURIComponent(courseId)}`,
        params: { cross_department: crossDepartment },
      }),
      providesTags: (_result, _error, { courseId }) => [
        { type: "Compare", id: `similar:${courseId}` },
      ],
    }),
    getComparisonSummary: builder.query<
      ComparisonSummaryResponse,
      { primaryCourseId: string; secondaryCourseId: string }
    >({
      query: ({ primaryCourseId, secondaryCourseId }) =>
        `/compare/${encodeURIComponent(primaryCourseId)}/${encodeURIComponent(secondaryCourseId)}`,
      providesTags: (_result, _error, { primaryCourseId, secondaryCourseId }) => [
        { type: "Compare", id: `${primaryCourseId}:${secondaryCourseId}` },
      ],
    }),
  }),
})

export const {
  useGetComparisonSummaryQuery,
  useGetSimilarCoursesQuery,
} = compareApi
