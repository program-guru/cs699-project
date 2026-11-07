import { baseApi } from "@/lib/features/api/baseApi"
import type {
  DeleteCoursesRequest,
  DeleteCoursesResponse,
  ScrapeRequest,
  ScrapeResponse,
  ScrapeSourcesResponse,
} from "@/types/scrape"

export const scrapeApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getScrapeSources: builder.query<ScrapeSourcesResponse, void>({
      query: () => "/scrape/sources",
    }),
    scrapeCourses: builder.mutation<ScrapeResponse, ScrapeRequest>({
      query: (request) => ({
        url: "/scrape/",
        method: "POST",
        body: request,
      }),
    }),
    deleteCoursesBySource: builder.mutation<
      DeleteCoursesResponse,
      DeleteCoursesRequest
    >({
      query: (request) => ({
        url: "/scrape/courses",
        method: "DELETE",
        body: request,
      }),
      invalidatesTags: [{ type: "Course", id: "LIST" }],
    }),
  }),
})

export const {
  useGetScrapeSourcesQuery,
  useScrapeCoursesMutation,
  useDeleteCoursesBySourceMutation,
} = scrapeApi
