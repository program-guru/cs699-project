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
import type { Admin } from "@/types/admin"

interface AdminSearchCardProps {
  admins: Admin[]
  selectedUsername: string | null
  onSelect: (username: string | null) => void
}

export function AdminSearchCard({
  admins,
  selectedUsername,
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
              <CommandEmpty>No admins found.</CommandEmpty>
              <CommandGroup>
                {admins.map((admin) => (
                  <CommandItem
                    key={admin.id ?? admin.username}
                    value={admin.username}
                    data-checked={selectedUsername === admin.username}
                    onSelect={() =>
                      onSelect(
                        selectedUsername === admin.username
                          ? null
                          : admin.username,
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
