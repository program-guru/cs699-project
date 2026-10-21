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
import type { Admin } from "@/types/admin"

interface AdminFormCardProps {
  admin: Admin | null
  isSaving: boolean
  isDeleting: boolean
  error?: string
  onSave: (values: { username: string; password: string }) => void
  onDelete: () => void
}

export function AdminFormCard({
  admin,
  isSaving,
  isDeleting,
  error,
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
        <form
          id="admin-form"
          className="flex flex-col gap-6"
          onSubmit={(event) => {
            event.preventDefault()
            onSave({ username, password })
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
          {error && <p className="text-sm text-destructive">{error}</p>}
        </form>
      </CardContent>
      <CardFooter className="justify-end gap-3">
        {isEditing && (
          <Button
            type="button"
            variant="destructive"
            disabled={isSaving || isDeleting}
            onClick={onDelete}
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
