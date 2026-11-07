import { baseApi } from "@/lib/features/api/baseApi"
import type {
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
  }),
})

export const { useGetScrapeSourcesQuery, useScrapeCoursesMutation } = scrapeApi
