"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { useGetCoursesQuery } from "@/lib/features/courses/courses.api";
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
  const { data, isLoading, isError } = useGetCoursesQuery({
    page: 1,
    page_size: 100,
  });
  const courses = useMemo(() => data?.data?.courses ?? [], [data]);

  const [college, setCollege] = useState("all");
  const [department, setDepartment] = useState("all");

  // searchInput drives the suggestion list only.
  // appliedSearch is what actually filters the table, set when a suggestion is picked.
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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

  const colleges = useMemo(
    () =>
      Array.from(
        new Map(
          courses.map((course) => [course.college_id, course.college_name]),
        ),
      ).sort(([, left], [, right]) => left.localeCompare(right)),
    [courses],
  );

  const departments = useMemo(
    () =>
      Array.from(
        new Map(
          courses
            .filter(
              (course) => college === "all" || course.college_id === college,
            )
            .map((course) => [course.department_id, course.department_name]),
        ),
      ).sort(([, left], [, right]) => left.localeCompare(right)),
    [college, courses],
  );

  const selectedCollegeLabel =
    college === "all"
      ? "All Colleges"
      : (colleges.find(([id]) => id === college)?.[1] ?? "All Colleges");

  const selectedDepartmentLabel =
    department === "all"
      ? "All Departments"
      : (departments.find(([id]) => id === department)?.[1] ??
        "All Departments");

  // Suggestions: computed from the raw typed input, not applied to the table.
  const suggestions = useMemo(() => {
    const query = searchInput.trim().toLowerCase();
    if (!query) return [];
    return courses
      .filter((course) =>
        [
          course.college_name,
          course.department_name,
          course.course_code,
          course.title,
        ].some((value) => displayValue(value).toLowerCase().includes(query)),
      )
      .slice(0, 5);
  }, [courses, searchInput]);

  // Table filtering: only uses appliedSearch (set on suggestion select / clear),
  // plus the college/department filters.
  const filteredCourses = useMemo(
    () =>
      courses.filter((course) => {
        const matchesSearch = [
          course.college_name,
          course.department_name,
          course.course_code,
          course.title,
        ].some((value) =>
          displayValue(value)
            .toLowerCase()
            .includes(appliedSearch.toLowerCase()),
        );
        return (
          matchesSearch &&
          (college === "all" || course.college_id === college) &&
          (department === "all" || course.department_id === department)
        );
      }),
    [college, department, courses, appliedSearch],
  );

  const totalPages = Math.max(1, Math.ceil(filteredCourses.length / pageSize));
  const visibleCourses = filteredCourses.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );

  const selectSuggestion = (course: Course) => {
    setSearchInput(course.title);
    setAppliedSearch(course.title);
    setPage(1);
  };

  return (
    <Card className="flex min-h-0 min-w-0 flex-col xl:col-span-3" size="sm">
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
                {colleges.map(([id, name]) => (
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
                {departments.map(([id, name]) => (
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
          className="relative !h-fit w-full shrink-0 overflow-visible border"
        >
          <div className="relative flex items-center">
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
          {searchInput.trim() && (
            <CommandList className="absolute top-full left-0 z-50 w-full border bg-popover shadow-md">
              <CommandEmpty>No matching courses.</CommandEmpty>
              <CommandGroup heading="Matching courses">
                {suggestions.map((course) => (
                  <CommandItem
                    key={course._id}
                    value={course._id}
                    onSelect={() => selectSuggestion(course)}
                  >
                    <Search aria-hidden="true" />
                    <span className="truncate">{course.title}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {displayValue(course.course_code)}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          )}
        </Command>

        {isLoading && (
          <p className="py-8 text-center text-muted-foreground">
            Loading courses…
          </p>
        )}
        {isError && (
          <p className="py-8 text-center text-destructive">
            Unable to load courses.
          </p>
        )}
        {!isLoading && !isError && (
          <>
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
                  {visibleCourses.length === 0 ? (
                    <TableRow>
                      <TableCell
                        className="py-8 text-center text-muted-foreground"
                        colSpan={4}
                      >
                        No courses match the selected filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    visibleCourses.map((course) => (
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
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
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
                {filteredCourses.length === 0
                  ? "0 courses"
                  : `${(page - 1) * pageSize + 1}-${Math.min(
                      page * pageSize,
                      filteredCourses.length,
                    )} of ${filteredCourses.length} courses`}
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
