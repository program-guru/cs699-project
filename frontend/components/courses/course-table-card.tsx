"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, SearchX, X } from "lucide-react";

import { Command, CommandInput } from "@/components/ui/command";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { getApiErrorMessage } from "@/lib/features/api/error";
import { useGetCoursesQuery } from "@/lib/features/courses/courses.api";
import {
  useGetCollegesQuery,
  useGetDepartmentsQuery,
} from "@/lib/features/misc/misc.api";
import type { Course } from "@/types/course";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

function displayValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

interface CourseTableCardProps {
  selectedCourse: Course | null;
  onCourseSelect: (course: Course) => void;
}

export function CourseTableCard({
  selectedCourse,
  onCourseSelect,
}: CourseTableCardProps) {
  const [college, setCollege] = useState("all");
  const [department, setDepartment] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const {
    data,
    error,
    isLoading,
    isError,
  } = useGetCoursesQuery({
    college_id: college === "all" ? undefined : college,
    department_id: department === "all" ? undefined : department,
    search: appliedSearch || undefined,
    page,
    page_size: pageSize,
  });
  const {
    data: collegesData,
    error: collegesError,
    isError: isCollegesError,
  } = useGetCollegesQuery();
  const {
    data: departmentsData,
    error: departmentsError,
    isError: isDepartmentsError,
  } = useGetDepartmentsQuery(college === "all" ? undefined : college);
  const coursePage = data?.data;
  const courses = useMemo(() => coursePage?.courses ?? [], [coursePage]);

  useEffect(() => {
    if (!isError) return;

    toast.add({
      type: "error",
      title: "Unable to load courses",
      description: getApiErrorMessage(
        error,
        "Unable to load courses. Please try again.",
      ),
    });
  }, [error, isError]);

  useEffect(() => {
    if (!isCollegesError && !isDepartmentsError) return;

    toast.add({
      type: "error",
      title: "Unable to load course filters",
      description: getApiErrorMessage(
        collegesError ?? departmentsError,
        "Unable to load course filters. Please try again.",
      ),
    });
  }, [
    collegesError,
    departmentsError,
    isCollegesError,
    isDepartmentsError,
  ]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setAppliedSearch(searchInput);
      setPage(1);
    }, 200);

    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  const updateCollege = (value: string | null) => {
    setCollege(value ?? "all");
    setDepartment("all");
    setPage(1);
  };

  const updateDepartment = (value: string | null) => {
    setDepartment(value ?? "all");
    setPage(1);
  };

  const updatePageSize = (value: string | null) => {
    const nextPageSize = Number(value);
    if (PAGE_SIZE_OPTIONS.some((option) => option === nextPageSize)) {
      setPageSize(nextPageSize);
      setPage(1);
    }
  };

  const clearSearch = () => {
    setSearchInput("");
    setAppliedSearch("");
    setPage(1);
  };

  const colleges = collegesData?.data ?? [];
  const departments = departmentsData?.data ?? [];

  const selectedCollegeLabel =
    college === "all"
      ? "All Colleges"
      : (colleges.find((option) => option.id === college)?.name ??
        "All Colleges");

  const selectedDepartmentLabel =
    department === "all"
      ? "All Departments"
      : (departments.find((option) => option.id === department)?.name ??
        "All Departments");

  const total = coursePage?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const visibleCourses = courses;

  return (
    <Card
      className="flex h-[min(60rem,calc(100vh-12rem))] min-h-0 min-w-0 flex-col xl:col-span-2"
      size="sm"
    >
      <CardHeader className="shrink-0 gap-1">
        <CardTitle>Courses</CardTitle>
        <CardDescription>
          Search and select a course to view its complete record.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
        <div className="grid shrink-0 gap-3 md:grid-cols-2">
          <Select value={college} onValueChange={updateCollege}>
            <SelectTrigger
              aria-label="Filter by college"
              className="w-full border px-3"
            >
              <SelectValue placeholder="All Colleges">
                {selectedCollegeLabel}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All Colleges</SelectItem>
                {colleges.map(({ id, name }) => (
                  <SelectItem key={id} value={id}>
                    {name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Select value={department} onValueChange={updateDepartment}>
            <SelectTrigger
              aria-label="Filter by department"
              className="w-full border px-3"
            >
              <SelectValue placeholder="All Departments">
                {selectedDepartmentLabel}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map(({ id, name }) => (
                  <SelectItem key={id} value={id}>
                    {name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <Command
          shouldFilter={false}
          className="relative h-fit! w-full shrink-0 overflow-visible border"
        >
          <div className="relative flex w-full items-center">
            <CommandInput
              placeholder="Search college, department, code, or title..."
              value={searchInput}
              onValueChange={setSearchInput}
              className="pr-8"
            />
            {searchInput && (
              <Button
                aria-label="Clear search"
                className="absolute top-1/2 right-2 size-5 -translate-y-1/2"
                onClick={clearSearch}
                size="icon-sm"
                type="button"
                variant="ghost"
              >
                <X />
              </Button>
            )}
          </div>
        </Command>

        {isLoading && <CourseTableSkeleton />}
        {!isLoading && !isError && (
          <>
            {visibleCourses.length === 0 ? (
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <SearchX aria-hidden="true" />
                  </EmptyMedia>
                  <EmptyTitle>No courses found</EmptyTitle>
                  <EmptyDescription>
                    Try adjusting your search or filters to find a course.
                  </EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>College</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Course Code</TableHead>
                      <TableHead>Title</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleCourses.map((course) => (
                      <TableRow
                        key={course._id}
                        aria-selected={selectedCourse?._id === course._id}
                        className="cursor-pointer"
                        data-state={
                          selectedCourse?._id === course._id
                            ? "selected"
                            : undefined
                        }
                        onClick={() => onCourseSelect(course)}
                      >
                        <TableCell>{course.college_name}</TableCell>
                        <TableCell>{course.department_name}</TableCell>
                        <TableCell>
                          {displayValue(course.course_code)}
                        </TableCell>
                        <TableCell className="max-w-56 truncate font-medium">
                          {course.title}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <label
                  htmlFor="courses-page-size"
                  className="text-xs text-muted-foreground"
                >
                  Rows per page
                </label>
                <Select
                  value={String(pageSize)}
                  onValueChange={updatePageSize}
                >
                  <SelectTrigger
                    id="courses-page-size"
                    aria-label="Rows per page"
                    className="h-8 w-20"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {PAGE_SIZE_OPTIONS.map((option) => (
                        <SelectItem key={option} value={String(option)}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">
                {total === 0
                  ? "0 courses"
                  : `${(page - 1) * pageSize + 1}-${Math.min(
                      page * pageSize,
                      total,
                    )} of ${total} courses`}
              </p>
              <Pagination className="mx-0 w-auto">
                <PaginationContent>
                  <PaginationItem>
                    <Button
                      aria-label="Previous page"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                      size="icon-sm"
                      variant="ghost"
                    >
                      <ChevronLeft data-icon="inline-start" />
                    </Button>
                  </PaginationItem>
                  <PaginationItem>
                    <span className="px-2 text-xs text-muted-foreground">
                      Page {page} of {totalPages}
                    </span>
                  </PaginationItem>
                  <PaginationItem>
                    <Button
                      aria-label="Next page"
                      disabled={page === totalPages}
                      onClick={() => setPage(page + 1)}
                      size="icon-sm"
                      variant="ghost"
                    >
                      <ChevronRight data-icon="inline-end" />
                    </Button>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function CourseTableSkeleton() {
  return (
    <div className="min-h-0 flex-1 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>College</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Course Code</TableHead>
            <TableHead>Title</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 8 }, (_, index) => (
            <TableRow key={index}>
              {Array.from({ length: 4 }, (_, cellIndex) => (
                <TableCell key={cellIndex}>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
