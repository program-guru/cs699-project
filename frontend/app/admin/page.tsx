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
  const authenticatedUserId = useAppSelector((state) => state.auth.user?.id)
  const [selectedUsername, setSelectedUsername] = useState<string | null>(null)
  const [error, setError] = useState<string>()
  const { data, isLoading } = useGetAdminsQuery()
  const [createAdmin, createState] = useCreateAdminMutation()
  const [updateAdmin, updateState] = useUpdateAdminMutation()
  const [deleteAdmin, deleteState] = useDeleteAdminMutation()
  const [logout] = useLogoutMutation()
  const selectedAdmin =
    data?.data.find((admin) => admin.username === selectedUsername) ?? null

  const save = async (values: AdminRequest) => {
    setError(undefined)
    try {
      if (selectedAdmin) {
        await updateAdmin({
          username: selectedAdmin.username,
          admin: { username: values.username, ...(values.password && { password: values.password }) },
        }).unwrap()
        setSelectedUsername(values.username)
      } else {
        await createAdmin(values).unwrap()
        setSelectedUsername(null)
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
      await deleteAdmin(selectedAdmin.username).unwrap()
      if (selectedAdmin.id === authenticatedUserId) {
        await logout().unwrap()
        dispatch(clearAuthenticatedUser())
        router.replace("/login")
        return
      }
      setSelectedUsername(null)
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Unable to delete admin."))
    }
  }

  return (
    <main className="flex flex-1 p-4 sm:p-6 lg:p-8">
      <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-2">
        <AdminSearchCard
          admins={data?.data ?? []}
          selectedUsername={selectedUsername}
          onSelect={(username) => {
            setError(undefined)
            setSelectedUsername(username)
          }}
        />
        <AdminFormCard
          key={selectedUsername ?? "new"}
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
