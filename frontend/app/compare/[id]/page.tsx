"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";

import { AiSummaryCard } from "@/components/compare/ai-summary-card";
import { ComparePageSkeleton } from "@/components/compare/compare-page-skeleton";
import { SecondaryCourseCard } from "@/components/compare/secondary-course-card";
import { CourseDetailsCard } from "@/components/courses/course-details-card";
import { buttonVariants } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { toast } from "@/components/ui/toast";
import { getApiErrorMessage } from "@/lib/features/api/error";
import {
  useGetCourseByIdQuery,
  useGetSimilarCoursesQuery,
} from "@/lib/features/courses/courses.api";

interface ComparePageProps {
  params: Promise<{ id: string }>;
}

export default function ComparePage({ params }: ComparePageProps) {
  const { id } = use(params);
  const [secondaryCourseId, setSecondaryCourseId] = useState<string | null>(
    null,
  );
  const {
    data: primaryData,
    error: primaryError,
    isError: isPrimaryError,
    isLoading: isPrimaryLoading,
  } = useGetCourseByIdQuery(id);
  const {
    data: similarData,
    error: similarError,
    isError: isSimilarError,
    isLoading: isSimilarLoading,
  } = useGetSimilarCoursesQuery(id);

  const primaryCourse = primaryData?.data ?? null;
  const similarCourses = similarData?.data ?? [];
  const secondaryCourse =
    similarCourses.find(({ _id }) => _id === secondaryCourseId) ?? null;

  useEffect(() => {
    if (!isPrimaryError && !isSimilarError) return;

    const error = primaryError ?? similarError;
    toast.add({
      type: "error",
      title: "Unable to load comparison",
      description: getApiErrorMessage(
        error,
        "Unable to load the course comparison. Please try again.",
      ),
    });
  }, [isPrimaryError, isSimilarError, primaryError, similarError]);

  if (isPrimaryLoading) {
    return <ComparePageSkeleton />;
  }

  if (!primaryCourse) {
    return (
      <main className="flex flex-1 items-center justify-center p-6">
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Course not found</EmptyTitle>
            <EmptyDescription>
              The course you selected is no longer available.
            </EmptyDescription>
          </EmptyHeader>
          <Link className={buttonVariants()} href="/courses">
            Back to courses
          </Link>
        </Empty>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 sm:p-6 lg:p-8">
      <div className="grid min-w-0 items-stretch gap-6 xl:grid-cols-3">
        <CourseDetailsCard
          course={primaryCourse}
          description="The course selected for comparison"
          title="Primary course details"
        />
        <SecondaryCourseCard
          course={secondaryCourse}
          courses={similarCourses}
          isError={isSimilarError}
          isLoading={isSimilarLoading}
          onCourseSelect={(course) =>
            setSecondaryCourseId(course?._id ?? null)
          }
        />
        <AiSummaryCard />
      </div>
    </main>
  );
}
