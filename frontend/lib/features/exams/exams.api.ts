import { baseApi } from "@/lib/features/api/baseApi"
import type {
  ExamListResponse,
  ExamTimelineResponse,
} from "@/types/exam"

export const examsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getExams: builder.query<ExamListResponse, void>({
      query: () => "/exams/",
      providesTags: [{ type: "Exam", id: "LIST" }],
    }),
    getExamTimeline: builder.query<
      ExamTimelineResponse,
      { exam: string; year?: number }
    >({
      query: ({ exam, year }) => ({
        url: `/exams/${encodeURIComponent(exam)}`,
        ...(year ? { params: { year } } : {}),
      }),
      providesTags: (_result, _error, { exam, year }) => [
        { type: "Exam", id: `${exam}:${year ?? "latest"}` },
      ],
    }),
    refreshExamTimeline: builder.mutation<
      { success: boolean; message: string },
      { exam: string; year?: number }
    >({
      query: ({ exam, year }) => ({
        url: `/exams/${encodeURIComponent(exam)}/refresh`,
        method: "POST",
        ...(year ? { params: { year } } : {}),
      }),
      invalidatesTags: (_result, error, { exam, year }) =>
        error
          ? []
          : [
              { type: "Exam", id: "LIST" },
              { type: "Exam", id: `${exam}:${year ?? "latest"}` },
              { type: "Exam" },
            ],
    }),
  }),
})

export const {
  useGetExamsQuery,
  useGetExamTimelineQuery,
  useRefreshExamTimelineMutation,
} = examsApi
