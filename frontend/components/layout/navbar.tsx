import Link from "next/link";
import { GraduationCap, LayoutDashboard, Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ModeToggle } from "@/components/ui/mode-toggle";

const navigationItems = [
  { href: "/", label: "Home" },
  { href: "/colleges", label: "Colleges" },
  { href: "/compare", label: "Compare" },
];

export function Navbar() {
  return (
    <header className="border-b bg-background">
      <Collapsible>
        <nav
          aria-label="Main navigation"
          className="mx-auto flex w-full items-center justify-between px-4 py-3 sm:px-6 lg:px-8"
        >
          <Link
            href="/"
            aria-label="UniScope home"
            className="flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground"
          >
            <GraduationCap aria-hidden="true" className="text-primary" />
            <span>UniScope</span>
          </Link>

          <div className="hidden items-center gap-6 md:flex">
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

          <div className="hidden items-center gap-4 md:flex">
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

          <CollapsibleTrigger
            render={
              <Button
                aria-label="Toggle navigation menu"
                className="md:hidden"
                size="icon"
                variant="outline"
              />
            }
          >
            <Menu aria-hidden="true" />
          </CollapsibleTrigger>
        </nav>

        <CollapsibleContent className="border-t px-4 py-4 md:hidden sm:px-6">
          <div className="flex flex-col gap-4">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}

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
          </div>
        </CollapsibleContent>
      </Collapsible>
    </header>
  );
}
