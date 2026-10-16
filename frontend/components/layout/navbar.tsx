import Link from "next/link"
import { GraduationCap, LayoutDashboard } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/ui/mode-toggle"

const navigationItems = [
  { href: "/", label: "Home" },
  { href: "/colleges", label: "Colleges" },
  { href: "/compare", label: "Compare" },
]

export function Navbar() {
  return (
    <header className="border-b bg-background">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex w-full items-center justify-between px-4 py-3 sm:px-6 lg:px-8"
      >
        <div className="flex items-center gap-6">
          <Link
            href="/"
            aria-label="UniScope home"
            className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground"
          >
            <GraduationCap aria-hidden="true" className="text-primary" />
            <span>UniScope</span>
          </Link>

          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <ModeToggle />

          <Button
            aria-label="Go to admin panel"
            nativeButton={false}
            render={<Link href="/admin" />}
            size="icon"
            title="Admin panel"
            variant="outline"
          >
            <LayoutDashboard aria-hidden="true" />
          </Button>
        </div>
      </nav>
    </header>
  )
}
