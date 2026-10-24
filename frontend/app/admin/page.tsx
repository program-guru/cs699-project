"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { AdminFormCard } from "@/components/admin/admin-form-card"
import { AdminSearchCard } from "@/components/admin/admin-search-card"
import {
  useCreateAdminMutation,
  useDeleteAdminMutation,
  useGetAdminsQuery,
  useUpdateAdminMutation,
} from "@/lib/features/admin/admin.api"
import { useLogoutMutation } from "@/lib/features/auth/auth.api"
import { clearAuthenticatedUser } from "@/lib/features/auth/auth.slice"
import { getApiErrorMessage } from "@/lib/features/api/error"
import { useAppDispatch, useAppSelector } from "@/lib/hooks"
import type { AdminRequest } from "@/types/admin"
import { toast } from "@/components/ui/toast"

export default function AdminPage() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const authenticatedUserId = useAppSelector((state) => state.auth.user?._id)
  const [selectedAdminId, setSelectedAdminId] = useState<string | null>(null)
  const [formVersion, setFormVersion] = useState(0)
  const { data, isLoading, isError: isQueryError, error: queryError } = useGetAdminsQuery()
  const [createAdmin, createState] = useCreateAdminMutation()
  const [updateAdmin, updateState] = useUpdateAdminMutation()
  const [deleteAdmin, deleteState] = useDeleteAdminMutation()
  const [logout] = useLogoutMutation()
  const selectedAdmin =
    data?.data?.find((admin) => admin._id === selectedAdminId) ?? null

  useEffect(() => {
    if (isQueryError) {
      toast.add({
        type: "error",
        title: "Unable to load administrators",
        description: getApiErrorMessage(queryError, "Please try again."),
      })
    }
  }, [isQueryError, queryError])

  const save = async (values: AdminRequest) => {
    try {
      if (selectedAdmin) {
        await updateAdmin({
          adminId: selectedAdmin._id,
          admin: { username: values.username, ...(values.password && { password: values.password }) },
        }).unwrap()
        toast.add({
          type: "success",
          title: "Administrator updated",
          description: "The administrator account was updated successfully.",
        })
        setSelectedAdminId(selectedAdmin._id)
      } else {
        await createAdmin(values).unwrap()
        toast.add({
          type: "success",
          title: "Administrator created",
          description: "The administrator account was created successfully.",
        })
        setSelectedAdminId(null)
        setFormVersion((version) => version + 1)
      }
    } catch (requestError) {
      toast.add({
        type: "error",
        title: selectedAdmin ? "Unable to update admin" : "Unable to create admin",
        description: getApiErrorMessage(
          requestError,
          "Please try again.",
        ),
      })
    }
  }

  const remove = async () => {
    if (!selectedAdmin) return
    try {
      await deleteAdmin(selectedAdmin._id).unwrap()
      toast.add({
        type: "success",
        title: "Administrator deleted",
        description: "The administrator account was deleted successfully.",
      })
      if (selectedAdmin._id === authenticatedUserId) {
        await logout().unwrap()
        dispatch(clearAuthenticatedUser())
        router.replace("/login")
        return
      }
      setSelectedAdminId(null)
    } catch (requestError) {
      toast.add({
        type: "error",
        title: "Unable to delete admin",
        description: getApiErrorMessage(requestError, "Please try again."),
      })
    }
  }

  return (
    <main className="flex flex-1 p-4 sm:p-6 lg:p-8">
      <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-2">
        <AdminSearchCard
          admins={data?.data ?? []}
          isLoading={isLoading}
          error={
            isQueryError
              ? getApiErrorMessage(queryError, "Unable to load administrators.")
              : undefined
          }
          selectedAdminId={selectedAdminId}
          onSelect={(adminId) => {
            setSelectedAdminId(adminId)
          }}
        />
        <AdminFormCard
          key={
            selectedAdmin
              ? `${selectedAdmin._id}:${selectedAdmin.username}`
              : `new:${formVersion}`
          }
          admin={selectedAdmin}
          isSaving={createState.isLoading || updateState.isLoading || isLoading}
          isDeleting={deleteState.isLoading}
          isLoading={isLoading}
          onSave={save}
          onDelete={remove}
        />
      </div>
    </main>
  )
}
