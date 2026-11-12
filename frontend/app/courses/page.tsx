"use client";

import Link from "next/link";
import { useState } from "react";

import { CourseDetailsCard } from "@/components/courses/course-details-card";
import { CourseTableCard } from "@/components/courses/course-table-card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Course } from "@/types/course";

export default function CoursesPage() {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  return (
    <main className="flex min-h-0 flex-1 items-center overflow-hidden p-4 sm:p-6 lg:p-8">
      <div className="grid min-h-0 w-full grid-cols-1 gap-6 xl:grid-cols-3">
        <CourseTableCard
          onCourseSelect={setSelectedCourse}
          selectedCourse={selectedCourse}
        />
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
      </div>
    </main>
  );
}
