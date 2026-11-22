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
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { getApiErrorMessage } from "@/lib/features/api/error"
import { useCreateAdminMutation } from "@/lib/features/admin/admin.api"
import { toast } from "@/components/ui/toast"

export function AdminCreateCard() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [createAdmin, { isLoading }] = useCreateAdminMutation()

  const create = async () => {
    try {
      await createAdmin({ username: username.trim(), password }).unwrap()
      setUsername("")
      setPassword("")
      toast.add({
        type: "success",
        title: "Administrator created",
        description: "The administrator account was created successfully.",
      })
    } catch (requestError) {
      toast.add({
        type: "error",
        title: "Unable to create admin",
        description: getApiErrorMessage(requestError, "Please try again."),
      })
    }
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Create new admin</CardTitle>
        <CardDescription>
          Create a new administrator account.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <form
          id="admin-create-form"
          className="flex flex-col gap-6"
          onSubmit={(event) => {
            event.preventDefault()
            void create()
          }}
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="new-admin-username">Username</FieldLabel>
              <Input
                id="new-admin-username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="new-admin-password">Password</FieldLabel>
              <Input
                id="new-admin-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          type="submit"
          form="admin-create-form"
          disabled={isLoading}
        >
          {isLoading ? "Creating..." : "Create admin"}
        </Button>
      </CardFooter>
    </Card>
  )
}
