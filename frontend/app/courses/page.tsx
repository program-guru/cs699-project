"use client";

import Link from "next/link";
import { useState } from "react";

import { CourseFormCard } from "@/components/admin/course-form-card";
import { CourseDetailsCard } from "@/components/courses/course-details-card";
import { CourseTableCard } from "@/components/courses/course-table-card";
import { buttonVariants } from "@/components/ui/button";
import { useAppSelector } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import type { Course } from "@/types/course";

export default function CoursesPage() {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const { isAuthenticated, status: authStatus } = useAppSelector(
    (state) => state.auth,
  );

  return (
    <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="grid min-h-0 w-full grid-cols-1 gap-6 xl:grid-cols-3">
        <CourseTableCard
          onCourseSelect={setSelectedCourse}
          selectedCourse={selectedCourse}
        />
        {isAuthenticated ? (
          <div className="min-w-0 xl:col-span-1">
            <CourseFormCard
              key={
                selectedCourse
                  ? `${selectedCourse._id}:${selectedCourse.scraped_at}`
                  : "new-course"
              }
              course={selectedCourse}
              isLoading={authStatus === "loading"}
              onCancel={() => setSelectedCourse(null)}
            />
          </div>
        ) : (
          <CourseDetailsCard course={selectedCourse}>
            {selectedCourse ? (
              <Link
                className={cn(buttonVariants(), "w-full")}
                href={`/compare/${selectedCourse._id}`}
              >
                Compare
              </Link>
            ) : null}
          </CourseDetailsCard>
        )}
      </div>
    </main>
  );
}
