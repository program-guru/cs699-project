"use client"

import { useEffect, useState } from "react"
import { AdminFormCard } from "@/components/admin/admin-form-card"
import { AdminCreateCard } from "@/components/admin/admin-create-card"
import { AdminSearchCard } from "@/components/admin/admin-search-card"
import { ScrapeControlCard } from "@/components/admin/scrape-control-card"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  useGetAdminsQuery,
} from "@/lib/features/admin/admin.api"
import { getApiErrorMessage } from "@/lib/features/api/error"
import { useAppSelector } from "@/lib/hooks"
import { toast } from "@/components/ui/toast"

export default function AdminDashboardPage() {
  const user = useAppSelector((state) => state.auth.user)
  const [selectedAdminId, setSelectedAdminId] = useState<string | null>(null)
  const { data, isLoading, isError: isQueryError, error: queryError } = useGetAdminsQuery()
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

  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="grid w-full grid-cols-1 gap-6 xl:flex-1 xl:auto-rows-fr xl:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-6 xl:h-full">
          <Card className="shrink-0">
            <CardHeader>
              <CardTitle>Welcome, {user?.username ?? "admin"}</CardTitle>
              <CardDescription>
                You are signed in to the administrator dashboard.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Manage course data and administrator accounts from here.
              </p>
            </CardContent>
          </Card>
          <ScrapeControlCard />
        </div>
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
        {selectedAdmin ? (
          <AdminFormCard
            key={`${selectedAdmin._id}:${selectedAdmin.username}`}
            admin={selectedAdmin}
            onDeleted={() => setSelectedAdminId(null)}
          />
        ) : (
          <AdminCreateCard />
        )}
      </div>
    </main>
  )
}
