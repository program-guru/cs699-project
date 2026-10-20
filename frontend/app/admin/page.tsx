"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { useLogoutMutation } from "@/lib/features/auth/auth.api";
import { useGetAdminsQuery } from "@/lib/features/admin/admin.api";
import { clearAuthenticatedUser } from "@/lib/features/auth/auth.slice";
import { getApiErrorMessage } from "@/lib/features/api/error";

export default function AdminPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const username = useAppSelector((state) => state.auth.username);
  const { data, isLoading, error } = useGetAdminsQuery();
  const [logout, { isLoading: isLoggingOut, error: logoutError }] =
    useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      dispatch(clearAuthenticatedUser());
      router.replace("/login");
    } catch {
      // Keep the session visible when the server could not process logout.
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 p-6 md:p-10">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Signed in as</p>
          <h1 className="text-3xl font-semibold">{username ?? "Admin"}</h1>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Button
            variant="outline"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? "Signing out..." : "Sign out"}
          </Button>
          {logoutError && (
            <p role="alert" className="text-sm text-destructive">
              {getApiErrorMessage(
                logoutError,
                "Unable to sign out. Please try again.",
              )}
            </p>
          )}
        </div>
      </header>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Administrators</h2>
        {isLoading && <p>Loading administrators...</p>}
        {error && (
          <p role="alert" className="text-destructive">
            {getApiErrorMessage(
              error,
              "Unable to load administrators. Please try again.",
            )}
          </p>
        )}
        {data && (
          <ul className="flex flex-col gap-2">
            {data.data.map((admin) => (
              <li key={admin.id ?? admin.username} className="border-b py-3">
                {admin.username}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
