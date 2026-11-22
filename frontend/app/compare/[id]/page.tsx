"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { skipToken } from "@reduxjs/toolkit/query";

import { AISummaryCard } from "@/components/compare/ai-summary-card";
import { ComparePageSkeleton } from "@/components/compare/compare-page-skeleton";
import { SecondaryCourseCard } from "@/components/compare/secondary-course-card";
import { CourseDetailsCard } from "@/components/courses/course-details-card";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { toast } from "@/components/ui/toast";
import { getApiErrorMessage } from "@/lib/features/api/error";
import {
  useGetComparisonSummaryQuery,
  useGetSimilarCoursesQuery,
} from "@/lib/features/compare/compare.api";
import { useGetCourseByIdQuery } from "@/lib/features/courses/courses.api";

interface ComparePageProps {
  params: Promise<{ id: string }>;
}

export default function ComparePage({ params }: ComparePageProps) {
  const { id } = use(params);
  const [secondaryCourseId, setSecondaryCourseId] = useState<string | null>(
    null,
  );
  const [crossDepartment, setCrossDepartment] = useState(false);
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
  } = useGetSimilarCoursesQuery({
    courseId: id,
    crossDepartment,
  });

  const primaryCourse = primaryData?.data ?? null;
  const similarCourses = similarData?.data ?? [];
  const secondaryCourse =
    similarCourses.find(({ _id }) => _id === secondaryCourseId) ?? null;
  const {
    data: summaryData,
    error: summaryError,
    isError: isSummaryError,
    isLoading: isSummaryLoading,
  } = useGetComparisonSummaryQuery(
    secondaryCourseId
      ? { primaryCourseId: id, secondaryCourseId }
      : skipToken,
  );

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

  useEffect(() => {
    if (!isSummaryError) return;

    toast.add({
      type: "error",
      title: "Unable to generate summary",
      description: getApiErrorMessage(
        summaryError,
        "Unable to generate the AI comparison. Please try again.",
      ),
    });
  }, [isSummaryError, summaryError]);

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
          <Button
            nativeButton={false}
            render={<Link href="/courses" />}
            size="lg"
          >
            Back to courses
          </Button>
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
          crossDepartment={crossDepartment}
          isError={isSimilarError}
          isLoading={isSimilarLoading}
          onCrossDepartmentChange={(checked) => {
            setCrossDepartment(checked);
            setSecondaryCourseId(null);
          }}
          onCourseSelect={(course) => setSecondaryCourseId(course?._id ?? null)}
        />
        <AISummaryCard
          error={summaryError}
          isError={isSummaryError}
          isLoading={isSummaryLoading}
          summary={summaryData?.data ?? null}
        />
      </div>
    </main>
  );
}
