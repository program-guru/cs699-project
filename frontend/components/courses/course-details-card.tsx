"use client";

import { Check } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Course } from "@/types/course";

function displayValue(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  if (Array.isArray(value)) return value.length ? value.join(", ") : null;
  if (typeof value === "object") {
    return Object.keys(value).length ? JSON.stringify(value) : null;
  }
  return String(value);
}

const hiddenFields = new Set(["_id", "source_url", "scraped_at", "raw_extra"]);

interface CourseDetailsCardProps {
  course: Course | null;
}

export function CourseDetailsCard({ course }: CourseDetailsCardProps) {
  const details = course
    ? Object.entries(course).filter(
        ([key, value]) =>
          !hiddenFields.has(key) &&
          !key.endsWith("_id") &&
          displayValue(value) !== null,
      )
    : [];

  return (
    <Card
      className="flex h-[min(60rem,calc(100vh-12rem))] min-h-0 min-w-0 flex-col xl:col-span-1"
      size="sm"
    >
      <CardHeader className="shrink-0 gap-1">
        <CardTitle>Course details</CardTitle>
        <CardDescription>
          {course
            ? "All available information"
            : "Select a course from the table"}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {course ? (
          <ScrollArea className="h-full pr-3">
            <dl className="grid gap-3">
              {details.map(([key, value]) => (
                <div
                  className="grid gap-1 border-b pb-2 last:border-0"
                  key={key}
                >
                  <dt className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                    {key.replaceAll("_", " ")}
                  </dt>
                  <dd className="wrap-break-word text-sm">{displayValue(value)}</dd>
                </div>
              ))}
            </dl>
          </ScrollArea>
        ) : (
          <div className="flex h-full min-h-64 items-center justify-center text-center text-sm text-muted-foreground">
            <div className="flex flex-col items-center gap-3">
              <Check aria-hidden="true" className="text-primary" />
              <p>Choose one course to inspect its details.</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
