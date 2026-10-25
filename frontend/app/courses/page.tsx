"use client";

import { useState } from "react";

import { CourseDetailsCard } from "@/components/courses/course-details-card";
import { CourseTableCard } from "@/components/courses/course-table-card";
import type { Course } from "@/types/course";

export default function CoursesPage() {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  return (
    <main className="flex h-screen items-center justify-center overflow-hidden p-3 sm:p-4 lg:p-5">
      <div className="grid h-full max-h-[calc(100vh-2rem)] w-full max-w-7xl grid-cols-1 gap-4 xl:grid-cols-5">
        <CourseTableCard
          onCourseSelect={setSelectedCourse}
          selectedCourse={selectedCourse}
        />
        <CourseDetailsCard course={selectedCourse} />
      </div>
    </main>
  );
}
