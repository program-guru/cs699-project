import { baseApi } from "@/lib/features/api/baseApi"
import type {
  CourseMutationResponse,
  CourseQueryParams,
  CourseRequest,
  CourseResponse,
  CoursesResponse,
} from "@/types/course"

export const coursesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCourses: builder.query<CoursesResponse, CourseQueryParams | void>({
      query: (params) => ({
        url: "/courses/",
        ...(params ? { params } : {}),
      }),
      providesTags: (result) => [
        { type: "Course", id: "LIST" },
        ...(result?.data?.courses.map(({ _id }) => ({
          type: "Course" as const,
          id: _id,
        })) ?? []),
      ],
    }),
    getCourseById: builder.query<CourseResponse, string>({
      query: (courseId) => `/courses/${encodeURIComponent(courseId)}`,
      providesTags: (result, error, courseId) => [
        { type: "Course", id: courseId },
      ],
    }),
    createCourse: builder.mutation<CourseResponse, CourseRequest>({
      query: (course) => ({
        url: "/courses/",
        method: "POST",
        body: course,
      }),
      invalidatesTags: [{ type: "Course", id: "LIST" }],
    }),
    updateCourse: builder.mutation<
      CourseMutationResponse,
      { courseId: string; course: CourseRequest }
    >({
      query: ({ courseId, course }) => ({
        url: `/courses/${encodeURIComponent(courseId)}`,
        method: "PUT",
        body: course,
      }),
      invalidatesTags: (result, error, { courseId }) => [
        { type: "Course", id: courseId },
        { type: "Course", id: "LIST" },
      ],
    }),
    deleteCourse: builder.mutation<CourseMutationResponse, string>({
      query: (courseId) => ({
        url: `/courses/${encodeURIComponent(courseId)}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, courseId) => [
        { type: "Course", id: courseId },
        { type: "Course", id: "LIST" },
      ],
    }),
  }),
})

export const {
  useGetCoursesQuery,
  useLazyGetCoursesQuery,
  useGetCourseByIdQuery,
  useCreateCourseMutation,
  useUpdateCourseMutation,
  useDeleteCourseMutation,
} = coursesApi
