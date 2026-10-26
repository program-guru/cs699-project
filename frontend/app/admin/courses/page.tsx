"use client"

import { useState } from "react"

import { CourseFormCard } from "@/components/admin/course-form-card"
import { CourseTableCard } from "@/components/courses/course-table-card"
import {
  useCreateCourseMutation,
  useDeleteCourseMutation,
  useUpdateCourseMutation,
} from "@/lib/features/courses/courses.api"
import { getApiErrorMessage } from "@/lib/features/api/error"
import { toast } from "@/components/ui/toast"
import type { Course, CourseRequest } from "@/types/course"

export default function AdminCoursesPage() {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [formVersion, setFormVersion] = useState(0)
  const [createCourse, createState] = useCreateCourseMutation()
  const [updateCourse, updateState] = useUpdateCourseMutation()
  const [deleteCourse, deleteState] = useDeleteCourseMutation()

  const save = async (course: CourseRequest) => {
    try {
      if (selectedCourse) {
        await updateCourse({ courseId: selectedCourse._id, course }).unwrap()
        toast.add({
          type: "success",
          title: "Course updated",
          description: "The course was updated successfully.",
        })
      } else {
        await createCourse(course).unwrap()
        toast.add({
          type: "success",
          title: "Course created",
          description: "The course was created successfully.",
        })
        setFormVersion((version) => version + 1)
      }
      setSelectedCourse(null)
    } catch (requestError) {
      toast.add({
        type: "error",
        title: selectedCourse ? "Unable to update course" : "Unable to create course",
        description: getApiErrorMessage(requestError, "Please try again."),
      })
    }
  }

  const remove = async () => {
    if (!selectedCourse) return
    try {
      await deleteCourse(selectedCourse._id).unwrap()
      toast.add({
        type: "success",
        title: "Course deleted",
        description: "The course was deleted successfully.",
      })
      setSelectedCourse(null)
    } catch (requestError) {
      toast.add({
        type: "error",
        title: "Unable to delete course",
        description: getApiErrorMessage(requestError, "Please try again."),
      })
    }
  }

  return (
    <main className="flex min-h-0 flex-1 items-center overflow-hidden p-4 sm:p-6 lg:p-8">
      <div className="grid min-h-0 w-full grid-cols-1 gap-6 xl:grid-cols-3">
        <CourseTableCard
          onCourseSelect={setSelectedCourse}
          selectedCourse={selectedCourse}
        />
        <div className="min-w-0 xl:col-span-1">
          <CourseFormCard
            key={
              selectedCourse
                ? `${selectedCourse._id}:${selectedCourse.scraped_at}`
                : `new:${formVersion}`
            }
            course={selectedCourse}
            isDeleting={deleteState.isLoading}
            isLoading={false}
            isSaving={createState.isLoading || updateState.isLoading}
            onCancel={() => setSelectedCourse(null)}
            onDelete={remove}
            onSave={save}
          />
        </div>
      </div>
    </main>
  )
}
