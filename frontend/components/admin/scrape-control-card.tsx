"use client"

import { useEffect, useState } from "react"
import { LoaderCircle, RefreshCw } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getApiErrorMessage } from "@/lib/features/api/error"
import {
  useGetScrapeSourcesQuery,
  useScrapeCoursesMutation,
} from "@/lib/features/scrape/scrape.api"
import { toast } from "@/components/ui/toast"
import type { ScrapeSource } from "@/types/scrape"

type ScrapeScope = "all" | "college" | "department"

const scopeLabels: Record<ScrapeScope, string> = {
  all: "All colleges",
  college: "One college",
  department: "One department",
}

export function ScrapeControlCard() {
  const [scope, setScope] = useState<ScrapeScope>("all")
  const [collegeId, setCollegeId] = useState("")
  const [departmentId, setDepartmentId] = useState("")
  const {
    data,
    isLoading: isLoadingSources,
    isError: isSourcesError,
    error: sourcesError,
  } = useGetScrapeSourcesQuery()
  const [scrapeCourses, scrapeState] = useScrapeCoursesMutation()
  const sources = data?.data ?? []
  const colleges = [
    ...new Map(
      sources.map((source) => [
        source.college_id,
        { id: source.college_id, name: source.college_name },
      ]),
    ).values(),
  ]
  const departments = sources.filter(
    (source) => source.college_id === collegeId,
  )

  useEffect(() => {
    if (isSourcesError) {
      toast.add({
        type: "error",
        title: "Unable to load scrape sources",
        description: getApiErrorMessage(
          sourcesError,
          "Please try again.",
        ),
      })
    }
  }, [isSourcesError, sourcesError])

  const updateScope = (value: string | null) => {
    if (value === "all" || value === "college" || value === "department") {
      setScope(value)
    }
  }

  const updateCollege = (value: string | null) => {
    setCollegeId(value ?? "")
    setDepartmentId("")
  }

  const startScrape = async () => {
    try {
      const request =
        scope === "all"
          ? {}
          : scope === "college"
            ? { college_id: collegeId }
            : { college_id: collegeId, department_id: departmentId }
      const response = await scrapeCourses(request).unwrap()
      toast.add({
        type: "success",
        title: "Scrape started",
        description: response.message,
      })
    } catch (requestError) {
      toast.add({
        type: "error",
        title: "Unable to start scrape",
        description: getApiErrorMessage(requestError, "Please try again."),
      })
    }
  }

  const canStartScrape =
    !isLoadingSources &&
    !scrapeState.isLoading &&
    sources.length > 0 &&
    (scope === "all" ||
      (Boolean(collegeId) &&
        (scope === "college" || Boolean(departmentId))))

  const selectedCollege = colleges.find(({ id }) => id === collegeId)
  const selectedDepartment = departments.find(
    (department) => department.department_id === departmentId,
  )

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Scrape courses
        </CardTitle>
        <CardDescription>
          Refresh course data from registered college websites.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="scrape-scope">Scrape scope</FieldLabel>
            <Select value={scope} onValueChange={updateScope}>
              <SelectTrigger id="scrape-scope" className="w-full">
                <SelectValue>{scopeLabels[scope]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">All colleges</SelectItem>
                  <SelectItem value="college">One college</SelectItem>
                  <SelectItem value="department">
                    One department
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <FieldDescription>
              {scope === "all"
                ? "Refresh every registered college and department."
                : scope === "college"
                  ? "Refresh all registered departments at one college."
                  : "Refresh one department at a selected college."}
            </FieldDescription>
          </Field>

          {scope !== "all" && (
            <Field>
              <FieldLabel htmlFor="scrape-college">College</FieldLabel>
              <Select
                value={collegeId}
                onValueChange={updateCollege}
                disabled={isLoadingSources || colleges.length === 0}
              >
                <SelectTrigger id="scrape-college" className="w-full">
                  <SelectValue placeholder="Choose a college">
                    {selectedCollege?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {colleges.map((college) => (
                      <SelectItem key={college.id} value={college.id}>
                        {college.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          )}

          {scope === "department" && (
            <Field>
              <FieldLabel htmlFor="scrape-department">Department</FieldLabel>
              <Select
                value={departmentId}
                onValueChange={(value) => setDepartmentId(value ?? "")}
                disabled={!collegeId || departments.length === 0}
              >
                <SelectTrigger id="scrape-department" className="w-full">
                  <SelectValue placeholder="Choose a department">
                    {selectedDepartment?.department_name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {departments.map((department: ScrapeSource) => (
                      <SelectItem
                        key={department.department_id}
                        value={department.department_id}
                      >
                        {department.department_name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          )}

          {isSourcesError ? (
            <FieldDescription>
              {getApiErrorMessage(
                sourcesError,
                "Scrape sources could not be loaded.",
              )}
            </FieldDescription>
          ) : sources.length === 0 && !isLoadingSources ? (
            <FieldDescription>
              No scrape sources are currently registered.
            </FieldDescription>
          ) : null}
        </FieldGroup>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          disabled={!canStartScrape}
          onClick={startScrape}
        >
          {scrapeState.isLoading ? (
            <LoaderCircle
              className="animate-spin"
              data-icon="inline-start"
              aria-hidden="true"
            />
          ) : (
            <RefreshCw data-icon="inline-start" aria-hidden="true" />
          )}
          {scrapeState.isLoading ? "Starting scrape..." : "Start scrape"}
        </Button>
      </CardFooter>
    </Card>
  )
}
