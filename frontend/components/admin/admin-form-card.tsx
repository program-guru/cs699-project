"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ConfirmationDialog } from "@/components/layout/dialog"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { getApiErrorMessage } from "@/lib/features/api/error"
import {
  useDeleteAdminMutation,
  useUpdateAdminMutation,
} from "@/lib/features/admin/admin.api"
import { useLogoutMutation } from "@/lib/features/auth/auth.api"
import { clearAuthenticatedUser } from "@/lib/features/auth/auth.slice"
import { useAppDispatch, useAppSelector } from "@/lib/hooks"
import type { Admin } from "@/types/admin"
import { toast } from "@/components/ui/toast"

interface AdminFormCardProps {
  admin: Admin
  onDeleted: () => void
}

export function AdminFormCard({
  admin,
  onDeleted,
}: AdminFormCardProps) {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const authenticatedUserId = useAppSelector((state) => state.auth.user?._id)
  const [updateAdmin, { isLoading: isSaving }] = useUpdateAdminMutation()
  const [deleteAdmin, { isLoading: isDeleting }] = useDeleteAdminMutation()
  const [logout] = useLogoutMutation()
  const [username, setUsername] = useState(admin.username)
  const [password, setPassword] = useState("")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const save = async () => {
    try {
      await updateAdmin({
        adminId: admin._id,
        admin: {
          username: username.trim(),
          ...(password && { password }),
        },
      }).unwrap()
      toast.add({
        type: "success",
        title: "Administrator updated",
        description: "The administrator account was updated successfully.",
      })
    } catch (requestError) {
      toast.add({
        type: "error",
        title: "Unable to update admin",
        description: getApiErrorMessage(requestError, "Please try again."),
      })
    }
  }

  const remove = async () => {
    try {
      await deleteAdmin(admin._id).unwrap()
      setIsDeleteDialogOpen(false)
      toast.add({
        type: "success",
        title: "Administrator deleted",
        description: "The administrator account was deleted successfully.",
      })
      if (admin._id === authenticatedUserId) {
        await logout().unwrap()
        dispatch(clearAuthenticatedUser())
        router.replace("/login")
        return
      }
      onDeleted()
    } catch (requestError) {
      toast.add({
        type: "error",
        title: "Unable to delete admin",
        description: getApiErrorMessage(requestError, "Please try again."),
      })
    }
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Edit admin</CardTitle>
        <CardDescription>
          Update the username or optionally set a new password.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <form
          id="admin-form"
          className="flex flex-col gap-6"
          onSubmit={(event) => {
            event.preventDefault()
            void save()
          }}
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="admin-username">Username</FieldLabel>
              <Input
                id="admin-username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="admin-password">New password</FieldLabel>
              <Input
                id="admin-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <FieldDescription>
                Leave blank to keep the current password.
              </FieldDescription>
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="justify-end gap-3">
        <Button
          type="button"
          variant="destructive"
          disabled={isSaving || isDeleting}
          onClick={() => setIsDeleteDialogOpen(true)}
        >
          Delete
        </Button>
        <Button
          type="submit"
          form="admin-form"
          disabled={isSaving || isDeleting}
        >
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </CardFooter>
      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete administrator?"
        description={`This permanently deletes ${admin.username}. This action cannot be undone.`}
        confirmLabel="Delete administrator"
        loadingLabel="Deleting..."
        isLoading={isDeleting}
        isDisabled={isSaving}
        onConfirm={remove}
      />
    </Card>
  )
}
