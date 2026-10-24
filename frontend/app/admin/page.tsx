"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
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

export default function AdminPage() {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const authenticatedUserId = useAppSelector((state) => state.auth.user?._id)
  const [selectedAdminId, setSelectedAdminId] = useState<string | null>(null)
  const [error, setError] = useState<string>()
  const { data, isLoading } = useGetAdminsQuery()
  const [createAdmin, createState] = useCreateAdminMutation()
  const [updateAdmin, updateState] = useUpdateAdminMutation()
  const [deleteAdmin, deleteState] = useDeleteAdminMutation()
  const [logout] = useLogoutMutation()
  const selectedAdmin =
    data?.data.find((admin) => admin._id === selectedAdminId) ?? null

  const save = async (values: AdminRequest) => {
    setError(undefined)
    try {
      if (selectedAdmin) {
        await updateAdmin({
          adminId: selectedAdmin._id,
          admin: { username: values.username, ...(values.password && { password: values.password }) },
        }).unwrap()
        setSelectedAdminId(selectedAdmin._id)
      } else {
        await createAdmin(values).unwrap()
        setSelectedAdminId(null)
      }
    } catch (requestError) {
      setError(
        getApiErrorMessage(
          requestError,
          selectedAdmin ? "Unable to update admin." : "Unable to create admin.",
        ),
      )
    }
  }

  const remove = async () => {
    if (!selectedAdmin) return
    setError(undefined)
    try {
      await deleteAdmin(selectedAdmin._id).unwrap()
      if (selectedAdmin._id === authenticatedUserId) {
        await logout().unwrap()
        dispatch(clearAuthenticatedUser())
        router.replace("/login")
        return
      }
      setSelectedAdminId(null)
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Unable to delete admin."))
    }
  }

  return (
    <main className="flex flex-1 p-4 sm:p-6 lg:p-8">
      <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-2">
        <AdminSearchCard
          admins={data?.data ?? []}
          selectedAdminId={selectedAdminId}
          onSelect={(adminId) => {
            setError(undefined)
            setSelectedAdminId(adminId)
          }}
        />
        <AdminFormCard
          key={
            selectedAdmin
              ? `${selectedAdmin._id}:${selectedAdmin.username}`
              : selectedAdminId ?? "new"
          }
          admin={selectedAdmin}
          isSaving={createState.isLoading || updateState.isLoading || isLoading}
          isDeleting={deleteState.isLoading}
          error={error}
          onSave={save}
          onDelete={remove}
        />
      </div>
    </main>
  )
}
