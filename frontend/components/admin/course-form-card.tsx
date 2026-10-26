"use client"

import { useState } from "react"

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
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import type { Course, CourseRequest } from "@/types/course"

interface CourseFormCardProps {
  course: Course | null
  isSaving: boolean
  isDeleting: boolean
  isLoading: boolean
  onSave: (values: CourseRequest) => void | Promise<void>
  onDelete: () => void
  onCancel: () => void
}

function nullableNumber(value: string) {
  if (!value.trim()) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function CourseFormCard({
  course,
  isSaving,
  isDeleting,
  isLoading,
  onSave,
  onDelete,
  onCancel,
}: CourseFormCardProps) {
  const [values, setValues] = useState<CourseRequest>(() => ({
    college_id: course?.college_id ?? "",
    college_name: course?.college_name ?? "",
    department_id: course?.department_id ?? "",
    department_name: course?.department_name ?? "",
    course_code: course?.course_code ?? "",
    title: course?.title ?? "",
    category: course?.category ?? "",
    level: course?.level ?? "",
    credits: course?.credits ?? null,
    description: course?.description ?? "",
    prerequisites: course?.prerequisites ?? [],
    instructor: course?.instructor ?? "",
    semester_offered: course?.semester_offered ?? "",
    syllabus_url: course?.syllabus_url ?? "",
    source_url: course?.source_url ?? "",
    raw_extra: course?.raw_extra ?? {},
  }))
  const [rawExtra, setRawExtra] = useState(
    JSON.stringify(course?.raw_extra ?? {}, null, 2),
  )
  const [rawExtraError, setRawExtraError] = useState<string | null>(null)

  const update = <K extends keyof CourseRequest>(
    key: K,
    value: CourseRequest[K],
  ) => setValues((current) => ({ ...current, [key]: value }))

  const isEditing = course !== null

  return (
    <Card className="flex h-[min(60rem,calc(100vh-12rem))] min-h-0 min-w-0 flex-col">
      <CardHeader className="shrink-0">
        <CardTitle>{isEditing ? "Edit course" : "Add course"}</CardTitle>
        <CardDescription>
          {isEditing
            ? "Update every field in this course record."
            : "Create a course record with all of its available information."}
        </CardDescription>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col gap-6" aria-label="Loading course form">
            {Array.from({ length: 8 }, (_, index) => (
              <Skeleton className="h-10 w-full" key={index} />
            ))}
          </div>
        ) : (
          <ScrollArea className="h-full pr-3">
            <form
              id="course-form"
              className="flex flex-col gap-6 pb-2"
              onSubmit={(event) => {
                event.preventDefault()
                let parsedRawExtra: Record<string, unknown>
                try {
                  const parsed = JSON.parse(rawExtra)
                  if (
                    parsed === null ||
                    Array.isArray(parsed) ||
                    typeof parsed !== "object"
                  ) {
                    throw new Error("raw_extra must be a JSON object")
                  }
                  parsedRawExtra = parsed as Record<string, unknown>
                } catch (error) {
                  setRawExtraError(
                    error instanceof Error ? error.message : "Enter valid JSON.",
                  )
                  return
                }
                setRawExtraError(null)
                void onSave({
                  ...values,
                  raw_extra: parsedRawExtra,
                  prerequisites: values.prerequisites
                    .map((item) => item.trim())
                    .filter(Boolean),
                })
              }}
            >
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="course-title">Title</FieldLabel>
                  <Input
                    id="course-title"
                    value={values.title}
                    onChange={(event) => update("title", event.target.value)}
                    required
                  />
                </Field>
                {isEditing && (
                  <div className="grid gap-6 sm:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="course-id">Course ID</FieldLabel>
                      <Input id="course-id" value={course._id} readOnly />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="course-scraped-at">Scraped at</FieldLabel>
                      <Input
                        id="course-scraped-at"
                        value={course.scraped_at}
                        readOnly
                      />
                    </Field>
                  </div>
                )}
                <div className="grid gap-6 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="course-college-id">College ID</FieldLabel>
                    <Input
                      id="course-college-id"
                      value={values.college_id}
                      onChange={(event) => update("college_id", event.target.value)}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="course-college-name">College name</FieldLabel>
                    <Input
                      id="course-college-name"
                      value={values.college_name}
                      onChange={(event) => update("college_name", event.target.value)}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="course-department-id">Department ID</FieldLabel>
                    <Input
                      id="course-department-id"
                      value={values.department_id}
                      onChange={(event) => update("department_id", event.target.value)}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="course-department-name">
                      Department name
                    </FieldLabel>
                    <Input
                      id="course-department-name"
                      value={values.department_name}
                      onChange={(event) => update("department_name", event.target.value)}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="course-code">Course code</FieldLabel>
                    <Input
                      id="course-code"
                      value={values.course_code ?? ""}
                      onChange={(event) => update("course_code", event.target.value || null)}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="course-credits">Credits</FieldLabel>
                    <Input
                      id="course-credits"
                      type="number"
                      step="0.5"
                      value={values.credits ?? ""}
                      onChange={(event) => update("credits", nullableNumber(event.target.value))}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="course-category">Category</FieldLabel>
                    <Input
                      id="course-category"
                      value={values.category ?? ""}
                      onChange={(event) => update("category", event.target.value || null)}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="course-level">Level</FieldLabel>
                    <Input
                      id="course-level"
                      value={values.level ?? ""}
                      onChange={(event) => update("level", event.target.value || null)}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="course-instructor">Instructor</FieldLabel>
                    <Input
                      id="course-instructor"
                      value={values.instructor ?? ""}
                      onChange={(event) => update("instructor", event.target.value || null)}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="course-semester">Semester offered</FieldLabel>
                    <Input
                      id="course-semester"
                      value={values.semester_offered ?? ""}
                      onChange={(event) =>
                        update("semester_offered", event.target.value || null)
                      }
                    />
                  </Field>
                </div>
                <Field>
                  <FieldLabel htmlFor="course-description">Description</FieldLabel>
                  <Textarea
                    id="course-description"
                    value={values.description ?? ""}
                    onChange={(event) => update("description", event.target.value || null)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="course-prerequisites">
                    Prerequisites
                  </FieldLabel>
                  <Textarea
                    id="course-prerequisites"
                    value={values.prerequisites.join("\n")}
                    onChange={(event) =>
                      update("prerequisites", event.target.value.split("\n"))
                    }
                  />
                  <FieldDescription>Enter one prerequisite per line.</FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="course-syllabus-url">Syllabus URL</FieldLabel>
                  <Input
                    id="course-syllabus-url"
                    type="url"
                    value={values.syllabus_url ?? ""}
                    onChange={(event) => update("syllabus_url", event.target.value || null)}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="course-source-url">Source URL</FieldLabel>
                  <Input
                    id="course-source-url"
                    type="url"
                    value={values.source_url}
                    onChange={(event) => update("source_url", event.target.value)}
                    required
                  />
                </Field>
                <Field data-invalid={rawExtraError !== null}>
                  <FieldLabel htmlFor="course-raw-extra">Additional fields (JSON)</FieldLabel>
                  <Textarea
                    id="course-raw-extra"
                    className="min-h-32 font-mono text-xs"
                    value={rawExtra}
                    onChange={(event) => {
                      const nextValue = event.target.value
                      setRawExtra(nextValue)
                      try {
                        const parsed = JSON.parse(nextValue)
                        if (
                          parsed === null ||
                          Array.isArray(parsed) ||
                          typeof parsed !== "object"
                        ) {
                          throw new Error("raw_extra must be a JSON object")
                        }
                        update("raw_extra", parsed as Record<string, unknown>)
                        setRawExtraError(null)
                      } catch (error) {
                        setRawExtraError(
                          error instanceof Error
                            ? error.message
                            : "Enter valid JSON.",
                        )
                      }
                    }}
                    aria-invalid={rawExtraError !== null}
                  />
                  <FieldDescription>
                    Preserve any source-specific fields as a JSON object.
                  </FieldDescription>
                  {rawExtraError && (
                    <p className="text-sm text-destructive">{rawExtraError}</p>
                  )}
                </Field>
              </FieldGroup>
            </form>
          </ScrollArea>
        )}
      </CardContent>
      <CardFooter className="shrink-0 justify-end gap-3">
        {isEditing && (
          <Button
            type="button"
            variant="outline"
            disabled={isSaving || isDeleting}
            onClick={onCancel}
          >
            Cancel
          </Button>
        )}
        {isEditing && (
          <Button
            type="button"
            variant="destructive"
            disabled={isSaving || isDeleting}
            onClick={() => {
              if (window.confirm("Delete this course? This action cannot be undone.")) {
                onDelete()
              }
            }}
          >
            Delete
          </Button>
        )}
        <Button type="submit" form="course-form" disabled={isSaving || isDeleting}>
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </CardFooter>
    </Card>
  )
}
