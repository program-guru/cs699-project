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
  useGetCollegesQuery,
  useGetDepartmentsQuery,
  useScrapeCoursesMutation,
} from "@/lib/features/misc/misc.api"
import { useDeleteCoursesBySourceMutation } from "@/lib/features/courses/courses.api"
import { toast } from "@/components/ui/toast"
import type { DeleteCoursesRequest } from "@/types/course"
import type { ScrapeRequest } from "@/types/misc"

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
  } = useGetCollegesQuery()
  const {
    data: departmentsData,
    isLoading: isLoadingDepartments,
  } = useGetDepartmentsQuery(
    collegeId === ALL_OPTIONS_VALUE
      ? undefined
      : collegeId,
  )
  const [scrapeCourses, scrapeState] = useScrapeCoursesMutation()
  const [deleteCourses, deleteState] = useDeleteCoursesBySourceMutation()
  const colleges = data?.data ?? []
  const departments = departmentsData?.data ?? []

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
    setDepartmentId(ALL_OPTIONS_VALUE)
  }

  const startScrape = async () => {
    try {
      if (
        collegeId === ALL_OPTIONS_VALUE ||
        departmentId === ALL_OPTIONS_VALUE
      ) {
        return
      }
      const request: ScrapeRequest = {
        college_name: collegeId,
        department_name: departmentId,
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
    !isLoadingDepartments &&
    !scrapeState.isLoading &&
    !deleteState.isLoading &&
    collegeId !== ALL_OPTIONS_VALUE &&
    departmentId !== ALL_OPTIONS_VALUE

  const selectedCollege = colleges.find((college) => college === collegeId)
  const selectedDepartment = departments.find(
    (department) => department === departmentId,
  )
  const canDeleteCourses =
    !isLoadingSources &&
    !isLoadingDepartments &&
    !scrapeState.isLoading &&
    !deleteState.isLoading &&
    collegeId !== ALL_OPTIONS_VALUE &&
    departmentId !== ALL_OPTIONS_VALUE
  const deleteScopeDescription =
    `${selectedDepartment ?? "the selected department"} at ${selectedCollege ?? "the selected college"}`

  const removeCourses = async () => {
    try {
      if (
        collegeId === ALL_OPTIONS_VALUE ||
        departmentId === ALL_OPTIONS_VALUE
      ) {
        return
      }
      const request: DeleteCoursesRequest = {
        college_name: collegeId,
        department_name: departmentId,
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
                  {selectedCollege ?? "Select a college"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {colleges.map((college) => (
                    <SelectItem key={college} value={college}>
                      {college}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <FieldDescription>
              Choose a registered college.
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
                  {selectedDepartment ?? "Select a department"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {departments.map((department) => (
                    <SelectItem key={department} value={department}>
                      {department}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <FieldDescription>
              Choose a department at the selected college.
            </FieldDescription>
          </Field>

          {isSourcesError ? (
            <FieldDescription>
              {getApiErrorMessage(
                sourcesError,
                "Scrape sources could not be loaded.",
              )}
            </FieldDescription>
          ) : colleges.length === 0 && !isLoadingSources ? (
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
