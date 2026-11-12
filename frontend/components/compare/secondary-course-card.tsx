import { ArrowLeft } from "lucide-react";

import { CourseDetailsCard } from "@/components/courses/course-details-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Course } from "@/types/course";

interface SecondaryCourseCardProps {
  course: Course | null;
  courses: Course[];
  isError: boolean;
  isLoading: boolean;
  onCourseSelect: (course: Course | null) => void;
}

export function SecondaryCourseCard({
  course,
  courses,
  isError,
  isLoading,
  onCourseSelect,
}: SecondaryCourseCardProps) {
  if (course) {
    return (
      <CourseDetailsCard
        course={course}
        description="The course selected for comparison"
        title="Secondary course details"
      >
        <Button
          onClick={() => onCourseSelect(null)}
          size="sm"
          type="button"
          variant="ghost"
        >
          <ArrowLeft data-icon="inline-start" />
          Back
        </Button>
      </CourseDetailsCard>
    );
  }

  return (
    <Card
      className="flex min-h-0 min-w-0 flex-col xl:col-span-1"
      size="sm"
    >
      <CardHeader className="shrink-0 gap-1">
        <CardTitle>Select secondary course</CardTitle>
        <CardDescription>
          Choose a similar course to compare side by side.
        </CardDescription>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton className="h-14 w-full" key={index} />
            ))}
          </div>
        ) : isError ? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>Similar courses unavailable</EmptyTitle>
              <EmptyDescription>
                We could not load courses to compare right now.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : courses.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>No similar courses</EmptyTitle>
              <EmptyDescription>
                There are no similar courses available for this course.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>College</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Course code</TableHead>
                <TableHead>Title</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((similarCourse) => (
                <TableRow
                  className="cursor-pointer"
                  key={similarCourse._id}
                  onClick={() => onCourseSelect(similarCourse)}
                >
                  <TableCell>{similarCourse.college_name}</TableCell>
                  <TableCell>{similarCourse.department_name}</TableCell>
                  <TableCell>{similarCourse.course_code ?? "—"}</TableCell>
                  <TableCell className="max-w-40 truncate font-medium">
                    {similarCourse.title}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
