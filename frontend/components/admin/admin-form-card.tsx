"use client"

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
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import type { Admin } from "@/types/admin"

interface AdminFormCardProps {
  admin: Admin | null
  isSaving: boolean
  isDeleting: boolean
  isLoading: boolean
  onSave: (values: { username: string; password: string }) => void | Promise<void>
  onDelete: () => void
}

export function AdminFormCard({
  admin,
  isSaving,
  isDeleting,
  isLoading,
  onSave,
  onDelete,
}: AdminFormCardProps) {
  const [username, setUsername] = useState(admin?.username ?? "")
  const [password, setPassword] = useState("")
  const isEditing = admin !== null

  return (
    <Card className="min-h-96">
      <CardHeader>
        <CardTitle>{isEditing ? "Edit admin" : "Add admin"}</CardTitle>
        <CardDescription>
          {isEditing
            ? "Update the username or optionally set a new password."
            : "Create a new administrator account."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col gap-6" aria-label="Loading admin form">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <form
            id="admin-form"
            className="flex flex-col gap-6"
            onSubmit={(event) => {
              event.preventDefault()
              void onSave({ username: username.trim(), password })
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
                <FieldLabel htmlFor="admin-password">
                  {isEditing ? "New password" : "Password"}
                </FieldLabel>
                <Input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required={!isEditing}
                />
                {isEditing && (
                  <FieldDescription>
                    Leave blank to keep the current password.
                  </FieldDescription>
                )}
              </Field>
            </FieldGroup>
          </form>
        )}
      </CardContent>
      <CardFooter className="justify-end gap-3">
        {isEditing && (
          <Button
            type="button"
            variant="destructive"
            disabled={isSaving || isDeleting}
            onClick={() => {
              if (
                window.confirm(
                  "Delete this administrator? This action cannot be undone.",
                )
              ) {
                onDelete()
              }
            }}
          >
            Delete
          </Button>
        )}
        <Button
          type="submit"
          form="admin-form"
          disabled={isSaving || isDeleting}
        >
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </CardFooter>
    </Card>
  )
}
