"use client";

import { SubmitEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAppDispatch } from "@/lib/hooks";
import { useLoginMutation } from "@/lib/features/auth/auth.api";
import { setAuthenticatedUser } from "@/lib/features/auth/auth.slice";
import { getApiErrorMessage } from "@/lib/features/api/error";

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [login, { isLoading, error }] = useLoginMutation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      await login({ username, password }).unwrap();
      dispatch(setAuthenticatedUser(username));
      router.replace("/admin");
    } catch {
      // The mutation error is rendered below.
    }
  };

  const errorMessage = getApiErrorMessage(
    error,
    "Unable to sign in. Please try again.",
  );

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/30 p-6 md:p-10">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <CardTitle className="text-2xl normal-case tracking-tight">
            UniScope Admin
          </CardTitle>
          <CardDescription>
            Sign in to manage universities and platform data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="username">Username</FieldLabel>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Enter your username"
                  autoComplete="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </Field>
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {errorMessage}
                </p>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}