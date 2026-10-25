"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeftRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getApiErrorMessage } from "@/lib/features/api/error";
import {
  useGetCoursesQuery,
  useLazyGetCoursesQuery,
} from "@/lib/features/courses/courses.api";
import { cn } from "@/lib/utils";
import type { Course, CoursePage } from "@/types/course";

type LoadedCourses =
  | { firstPage: CoursePage; courses: Course[] }
  | { firstPage: CoursePage; error: string }
  | null;

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) {
    return value.length ? value.map((item) => formatValue(item)).join(", ") : "—";
  }
  if (typeof value === "object") {
    return Object.keys(value).length ? JSON.stringify(value) : "—";
  }
  return String(value);
}

function CourseSelector({
  collegeId,
  collegeName,
  collegeOptions,
  courses,
  selectedCourse,
  otherCollegeId,
  heading,
  onCollegeChange,
  onCourseSelect,
}: {
  collegeId: string;
  collegeName: string;
  collegeOptions: [string, string][];
  courses: Course[];
  selectedCourse: Course | null;
  otherCollegeId: string;
  heading: string;
  onCollegeChange: (value: string) => void;
  onCourseSelect: (course: Course) => void;
}) {
  const collegeSelectId = `${heading.toLowerCase().replaceAll(" ", "-")}-college`;

  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>{heading}</CardTitle>
        <CardDescription>
          {collegeName || "Choose a college, then select a course to compare."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-col gap-4">
        <Field>
          <FieldLabel htmlFor={collegeSelectId}>College</FieldLabel>
          <Select
            value={collegeId}
            onValueChange={(value) => onCollegeChange(value ?? "")}
          >
            <SelectTrigger id={collegeSelectId} className="w-full">
              <SelectValue placeholder="Choose a college" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {collegeOptions.map(([id, name]) => (
                  <SelectItem key={id} value={id} disabled={id === otherCollegeId}>
                    {name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>

        {collegeId && (
          <section aria-label={`${heading} course list`} className="flex min-h-0 flex-col gap-2">
            <h3 className="text-sm font-medium">Courses ({courses.length})</h3>
            {courses.length ? (
              <div className="flex max-h-80 flex-col gap-2 overflow-y-auto pr-1">
                {courses.map((course) => (
                  <Button
                    key={course._id}
                    type="button"
                    variant="outline"
                    aria-pressed={selectedCourse?._id === course._id}
                    className={cn(
                      "h-auto w-full justify-start whitespace-normal px-3 py-3 text-left",
                      selectedCourse?._id === course._id &&
                        "border-primary bg-primary/5",
                    )}
                    onClick={() => onCourseSelect(course)}
                  >
                    <span className="flex min-w-0 flex-col items-start gap-1">
                      <span className="font-medium">{course.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {course.course_code || "No course code"}
                        {course.credits !== null ? ` · ${course.credits} credits` : ""}
                      </span>
                    </span>
                  </Button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No courses found for this department and college.
              </p>
            )}
          </section>
        )}
      </CardContent>
    </Card>
  );
}

export default function ComparePage() {
  const { data, isLoading, isError, error } = useGetCoursesQuery({
    page: 1,
    page_size: 100,
  });
  const [fetchCoursePage] = useLazyGetCoursesQuery();
  const [loadedCourses, setLoadedCourses] = useState<LoadedCourses>(null);
  const [departmentId, setDepartmentId] = useState("");
  const [collegeAId, setCollegeAId] = useState("");
  const [collegeBId, setCollegeBId] = useState("");
  const [courseA, setCourseA] = useState<Course | null>(null);
  const [courseB, setCourseB] = useState<Course | null>(null);

  const firstPage = data?.data ?? null;

  useEffect(() => {
    if (!firstPage || firstPage.total_pages <= 1) return;

    let isCurrent = true;
    const loadRemainingPages = async () => {
      try {
        const responses = await Promise.all(
          Array.from({ length: firstPage.total_pages - 1 }, (_, index) =>
            fetchCoursePage({ page: index + 2, page_size: 100 }).unwrap(),
          ),
        );
        const remainingCourses = responses.flatMap((response) => {
          if (!response.success || !response.data) {
            throw new Error(response.message || "Unable to load all courses.");
          }
          return response.data.courses;
        });

        if (isCurrent) {
          setLoadedCourses({
            firstPage,
            courses: [...firstPage.courses, ...remainingCourses],
          });
        }
      } catch (requestError) {
        if (isCurrent) {
          setLoadedCourses({
            firstPage,
            error: getApiErrorMessage(
              requestError,
              "Unable to load all courses. Please try again.",
            ),
          });
        }
      }
    };

    void loadRemainingPages();
    return () => {
      isCurrent = false;
    };
  }, [fetchCoursePage, firstPage]);

  const pageResult =
    loadedCourses?.firstPage === firstPage ? loadedCourses : null;
  const courses = useMemo(() => {
    if (firstPage?.total_pages === 1) return firstPage.courses;
    if (pageResult && "courses" in pageResult) return pageResult.courses;
    return [];
  }, [firstPage, pageResult]);
  const isLoadingRemainingPages = Boolean(
    firstPage && firstPage.total_pages > 1 && !pageResult,
  );
  const pageError =
    pageResult && "error" in pageResult ? pageResult.error : null;

  const departments = useMemo(
    () =>
      Array.from(
        new Map(
          courses.map((course) => [
            course.department_id,
            course.department_name,
          ]),
        ),
      ).sort(([, left], [, right]) => left.localeCompare(right)),
    [courses],
  );
  const collegeOptions = useMemo(
    () =>
      Array.from(
        new Map(
          courses
            .filter(
              (course) =>
                !departmentId || course.department_id === departmentId,
            )
            .map((course) => [course.college_id, course.college_name]),
        ),
      ).sort(([, left], [, right]) => left.localeCompare(right)),
    [courses, departmentId],
  );
  const coursesA = useMemo(
    () =>
      courses
        .filter(
          (course) =>
            course.department_id === departmentId &&
            course.college_id === collegeAId,
        )
        .sort((left, right) => left.title.localeCompare(right.title)),
    [collegeAId, courses, departmentId],
  );
  const coursesB = useMemo(
    () =>
      courses
        .filter(
          (course) =>
            course.department_id === departmentId &&
            course.college_id === collegeBId,
        )
        .sort((left, right) => left.title.localeCompare(right.title)),
    [collegeBId, courses, departmentId],
  );
  const collegeAName = collegeOptions.find(([id]) => id === collegeAId)?.[1] ?? "";
  const collegeBName = collegeOptions.find(([id]) => id === collegeBId)?.[1] ?? "";

  const chooseDepartment = (value: string | null) => {
    setDepartmentId(value ?? "");
    setCollegeAId("");
    setCollegeBId("");
    setCourseA(null);
    setCourseB(null);
  };

  const chooseCollegeA = (value: string) => {
    setCollegeAId(value);
    setCourseA(null);
    if (value === collegeBId) {
      setCollegeBId("");
      setCourseB(null);
    }
  };

  const chooseCollegeB = (value: string) => {
    setCollegeBId(value);
    setCourseB(null);
    if (value === collegeAId) {
      setCollegeAId("");
      setCourseA(null);
    }
  };

  const comparisonRows: [string, unknown, unknown][] =
    courseA && courseB
      ? [
          ["Code", courseA.course_code, courseB.course_code],
          ["College", courseA.college_name, courseB.college_name],
          ["Department", courseA.department_name, courseB.department_name],
          ["Level", courseA.level, courseB.level],
          ["Category", courseA.category, courseB.category],
          ["Credits", courseA.credits, courseB.credits],
          ["Semester offered", courseA.semester_offered, courseB.semester_offered],
          ["Prerequisites", courseA.prerequisites, courseB.prerequisites],
          ["Instructor", courseA.instructor, courseB.instructor],
          ["Description", courseA.description, courseB.description],
          ...Array.from(
            new Set([
              ...Object.keys(courseA.raw_extra),
              ...Object.keys(courseB.raw_extra),
            ]),
          )
            .filter((key) => key !== "api_id")
            .sort()
            .map((key): [string, unknown, unknown] => [
              key.replaceAll("_", " "),
              courseA.raw_extra[key],
              courseB.raw_extra[key],
            ]),
        ]
      : [];

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-primary">
          <ArrowLeftRight aria-hidden="true" />
          <span className="text-sm font-medium">Course comparison</span>
        </div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Compare courses across colleges
        </h1>
        <p className="max-w-3xl text-muted-foreground">
          Choose a department, select two colleges, then pick one course from
          each to compare their available details.
        </p>
        <p className="text-sm text-muted-foreground">
          Topic tags such as machine learning and cybersecurity can be selected
          once course tagging is available. Department is used as the filter for
          now.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Choose a department</CardTitle>
          <CardDescription>
            Both selected colleges will show courses from this department.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="max-w-xl gap-4">
            <Field>
              <FieldLabel htmlFor="compare-department">Department</FieldLabel>
              <Select value={departmentId} onValueChange={chooseDepartment}>
                <SelectTrigger id="compare-department" className="w-full">
                  <SelectValue placeholder="Choose a department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {departments.map(([id, name]) => (
                      <SelectItem key={id} value={id}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      {isLoading || isLoadingRemainingPages ? (
        <p className="py-8 text-center text-muted-foreground">
          Loading course catalog…
        </p>
      ) : isError || pageError ? (
        <p role="alert" className="py-8 text-center text-destructive">
          {pageError ??
            getApiErrorMessage(error, "Unable to load courses. Please try again.")}
        </p>
      ) : departmentId ? (
        <>
          <section
            aria-label="Choose courses to compare"
            className="grid min-w-0 gap-4 lg:grid-cols-2"
          >
            <CourseSelector
              heading="Course A"
              collegeId={collegeAId}
              collegeName={collegeAName}
              collegeOptions={collegeOptions}
              courses={coursesA}
              selectedCourse={courseA}
              otherCollegeId={collegeBId}
              onCollegeChange={chooseCollegeA}
              onCourseSelect={setCourseA}
            />
            <CourseSelector
              heading="Course B"
              collegeId={collegeBId}
              collegeName={collegeBName}
              collegeOptions={collegeOptions}
              courses={coursesB}
              selectedCourse={courseB}
              otherCollegeId={collegeAId}
              onCollegeChange={chooseCollegeB}
              onCourseSelect={setCourseB}
            />
          </section>

          {courseA && courseB && (
            <Card>
              <CardHeader>
                <CardTitle>Side-by-side comparison</CardTitle>
                <CardDescription>
                  Course details available in the catalog.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {[courseA, courseB].map((course) => (
                    <section
                      key={course._id}
                      aria-label={`${course.title} details`}
                      className="flex flex-col gap-2 rounded-md border p-4"
                    >
                      <h3 className="font-heading text-lg font-semibold">
                        {course.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {course.college_name}
                      </p>
                    </section>
                  ))}
                </div>
                <div className="flex flex-col gap-3">
                  {comparisonRows.map(([label, valueA, valueB]) => (
                    <div
                      key={String(label)}
                      className="grid gap-2 border-b pb-3 last:border-0 md:grid-cols-[10rem_minmax(0,1fr)_minmax(0,1fr)]"
                    >
                      <span className="text-sm font-medium capitalize">
                        {label}
                      </span>
                      <p className="break-words text-sm whitespace-pre-wrap">
                        {formatValue(valueA)}
                      </p>
                      <p className="break-words text-sm whitespace-pre-wrap">
                        {formatValue(valueB)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>AI-generated comparison</CardTitle>
              <CardDescription>
                An AI summary of course structure and content will be available
                in a later update.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-start gap-3">
              <Button type="button" variant="outline" disabled>
                AI comparison coming soon
              </Button>
              <p className="text-sm text-muted-foreground">
                No AI service is connected yet. The current comparison above
                uses only the course information stored in the catalog.
              </p>
            </CardContent>
          </Card>
        </>
      ) : (
        <p className="py-8 text-center text-muted-foreground">
          Select a department to see colleges and courses available to compare.
        </p>
      )}
    </main>
  );
}
