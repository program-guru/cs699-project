"use client"

import { useEffect, useState } from "react"
import { LoaderCircle, RefreshCw, Trash2 } from "lucide-react"

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
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getApiErrorMessage } from "@/lib/features/api/error"
import {
  useDeleteCoursesBySourceMutation,
  useGetScrapeSourcesQuery,
  useScrapeCoursesMutation,
} from "@/lib/features/scrape/scrape.api"
import { toast } from "@/components/ui/toast"
import type {
  DeleteCoursesRequest,
  ScrapeRequest,
} from "@/types/scrape"

const ALL_OPTIONS_VALUE = "__all__"

export function ScrapeControlCard() {
  const [collegeId, setCollegeId] = useState(ALL_OPTIONS_VALUE)
  const [departmentId, setDepartmentId] = useState(ALL_OPTIONS_VALUE)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const {
    data,
    isLoading: isLoadingSources,
    isError: isSourcesError,
    error: sourcesError,
  } = useGetScrapeSourcesQuery()
  const [scrapeCourses, scrapeState] = useScrapeCoursesMutation()
  const [deleteCourses, deleteState] = useDeleteCoursesBySourceMutation()
  const sources = data?.data ?? []
  const colleges = [
    ...new Map(
      sources.map((source) => [
        source.college_id,
        { id: source.college_id, name: source.college_name },
      ]),
    ).values(),
  ]
  const departmentSources =
    collegeId === ALL_OPTIONS_VALUE
      ? sources
      : sources.filter((source) => source.college_id === collegeId)
  const departments = [
    ...new Map(
      departmentSources.map((source) => [
        source.department_id,
        { id: source.department_id, name: source.department_name },
      ]),
    ).values(),
  ]

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

  const updateCollege = (value: string | null) => {
    if (value === null) return
    setCollegeId(value)
    const availableSources =
      value === ALL_OPTIONS_VALUE
        ? sources
        : sources.filter((source) => source.college_id === value)
    if (
      departmentId !== ALL_OPTIONS_VALUE &&
      !availableSources.some(
        (source) => source.department_id === departmentId,
      )
    ) {
      setDepartmentId(ALL_OPTIONS_VALUE)
    }
  }

  const startScrape = async () => {
    try {
      const request: ScrapeRequest = {}
      if (collegeId !== ALL_OPTIONS_VALUE) request.college_id = collegeId
      if (departmentId !== ALL_OPTIONS_VALUE) {
        request.department_id = departmentId
      }
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
    !deleteState.isLoading &&
    sources.length > 0

  const selectedCollege = colleges.find(({ id }) => id === collegeId)
  const selectedDepartment = departments.find(
    (department) => department.id === departmentId,
  )
  const canDeleteCourses =
    !isLoadingSources &&
    !scrapeState.isLoading &&
    !deleteState.isLoading &&
    sources.length > 0
  const deleteScopeDescription =
    collegeId === ALL_OPTIONS_VALUE
      ? departmentId === ALL_OPTIONS_VALUE
        ? "all colleges and departments"
        : `${selectedDepartment?.name ?? "the selected department"} across all colleges`
      : departmentId === ALL_OPTIONS_VALUE
        ? `${selectedCollege?.name ?? "the selected college"} and all its departments`
        : `${selectedDepartment?.name ?? "the selected department"} at ${selectedCollege?.name ?? "the selected college"}`

  const removeCourses = async () => {
    try {
      const request: DeleteCoursesRequest = {}
      if (collegeId !== ALL_OPTIONS_VALUE) request.college_id = collegeId
      if (departmentId !== ALL_OPTIONS_VALUE) {
        request.department_id = departmentId
      }
      const response = await deleteCourses(request).unwrap()
      setIsDeleteDialogOpen(false)
      toast.add({
        type: "success",
        title: "Courses deleted",
        description:
          response.message ||
          `Deleted ${response.data ?? 0} course(s) successfully.`,
      })
    } catch (requestError) {
      toast.add({
        type: "error",
        title: "Unable to delete courses",
        description: getApiErrorMessage(requestError, "Please try again."),
      })
    }
  }

  return (
    <Card className="min-h-0 xl:flex-1">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Scrape courses
        </CardTitle>
        <CardDescription>
          Refresh course data from registered college websites.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="scrape-college">College</FieldLabel>
            <Select value={collegeId} onValueChange={updateCollege}>
              <SelectTrigger id="scrape-college" className="w-full">
                <SelectValue>
                  {selectedCollege?.name ?? "All colleges"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value={ALL_OPTIONS_VALUE}>All colleges</SelectItem>
                  {colleges.map((college) => (
                    <SelectItem key={college.id} value={college.id}>
                      {college.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <FieldDescription>
              Choose a college or include every registered college.
            </FieldDescription>
          </Field>

          <Field>
            <FieldLabel htmlFor="scrape-department">Department</FieldLabel>
            <Select
              value={departmentId}
              onValueChange={(value) =>
                setDepartmentId(value ?? ALL_OPTIONS_VALUE)
              }
              disabled={isLoadingSources || departments.length === 0}
            >
              <SelectTrigger id="scrape-department" className="w-full">
                <SelectValue>
                  {selectedDepartment?.name ?? "All departments"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value={ALL_OPTIONS_VALUE}>
                    All departments
                  </SelectItem>
                  {departments.map((department) => (
                    <SelectItem key={department.id} value={department.id}>
                      {department.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <FieldDescription>
              {collegeId === ALL_OPTIONS_VALUE
                ? "Choose a department to scrape it across all colleges."
                : "Choose a department or include every department at this college."}
            </FieldDescription>
          </Field>

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
      <CardFooter className="mt-auto flex-col items-stretch">
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
        <Button
          className="w-full"
          disabled={!canDeleteCourses}
          onClick={() => setIsDeleteDialogOpen(true)}
          variant="destructive"
        >
          <Trash2 data-icon="inline-start" aria-hidden="true" />
          Delete courses
        </Button>
      </CardFooter>
      <Dialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete courses?</DialogTitle>
            <DialogDescription>
              This permanently deletes all courses for {deleteScopeDescription}.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose
              render={<Button variant="outline" disabled={deleteState.isLoading} />}
            >
              Cancel
            </DialogClose>
            <Button
              disabled={!canDeleteCourses}
              onClick={removeCourses}
              variant="destructive"
            >
              {deleteState.isLoading ? (
                <LoaderCircle
                  className="animate-spin"
                  data-icon="inline-start"
                  aria-hidden="true"
                />
              ) : (
                <Trash2 data-icon="inline-start" aria-hidden="true" />
              )}
              {deleteState.isLoading ? "Deleting..." : "Delete courses"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
