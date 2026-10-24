"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import type { Admin } from "@/types/admin"

interface AdminSearchCardProps {
  admins: Admin[]
  selectedAdminId: string | null
  isLoading: boolean
  error?: string
  onSelect: (adminId: string | null) => void
}

export function AdminSearchCard({
  admins,
  selectedAdminId,
  isLoading,
  error,
  onSelect,
}: AdminSearchCardProps) {
  return (
    <Card className="min-h-96">
      <CardHeader>
        <CardTitle>Admins</CardTitle>
        <CardDescription>Search and select an admin to edit</CardDescription>
      </CardHeader>
      <CardContent>
        <Command className="rounded-none border">
          <CommandInput placeholder="Search usernames..." />
          <ScrollArea className="max-h-85">
            <CommandList className="max-h-none overflow-visible">
              <CommandEmpty>
                {isLoading ? (
                  <div className="flex flex-col gap-3 p-3">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                ) : (
                  error ?? "No admins found."
                )}
              </CommandEmpty>
              <CommandGroup>
                {admins.map((admin) => (
                  <CommandItem
                    key={admin._id}
                    value={admin._id}
                    keywords={[admin.username]}
                    data-checked={selectedAdminId === admin._id}
                    onSelect={() =>
                      onSelect(
                        selectedAdminId === admin._id
                          ? null
                          : admin._id,
                      )
                    }
                  >
                    {admin.username}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </ScrollArea>
        </Command>
      </CardContent>
    </Card>
  )
}
