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
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item";
import { Switch } from "@/components/ui/switch";
import type { Course } from "@/types/course";

interface SecondaryCourseCardProps {
  course: Course | null;
  courses: Course[];
  crossDepartment: boolean;
  isError: boolean;
  isLoading: boolean;
  onCrossDepartmentChange: (checked: boolean) => void;
  onCourseSelect: (course: Course | null) => void;
}

export function SecondaryCourseCard({
  course,
  courses,
  crossDepartment,
  isError,
  isLoading,
  onCrossDepartmentChange,
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
      className="flex h-[min(60rem,calc(100vh-12rem))] min-h-0 min-w-0 flex-col xl:col-span-1"
      size="sm"
    >
      <CardHeader className="shrink-0 gap-2">
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Select secondary course</CardTitle>
          <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm text-muted-foreground">
            <span>Cross-department</span>
            <Switch
              aria-label="Include courses from other departments"
              checked={crossDepartment}
              onCheckedChange={onCrossDepartmentChange}
            />
          </label>
        </div>
        <CardDescription>
          Choose a similar course to compare side by side.{" "}
          {crossDepartment
            ? "Courses from all departments are included."
            : "Only courses from the same department are included."}
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
          <ItemGroup>
            {courses.map((similarCourse) => (
              <Item
                className="cursor-pointer"
                key={similarCourse._id}
                render={
                  <button
                    aria-label={`Select ${similarCourse.title}`}
                    onClick={() => onCourseSelect(similarCourse)}
                    type="button"
                  />
                }
                variant="outline"
              >
                <ItemContent>
                  <ItemTitle>{similarCourse.title}</ItemTitle>
                  <ItemDescription>
                    {similarCourse.department_name} ·{" "}
                    {similarCourse.course_code ?? "No course code"}
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  <span className="text-right text-sm text-muted-foreground">
                    {similarCourse.college_name}
                  </span>
                </ItemActions>
              </Item>
            ))}
          </ItemGroup>
        )}
      </CardContent>
    </Card>
  );
}
