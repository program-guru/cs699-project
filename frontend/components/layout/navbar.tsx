"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { GraduationCap, LogOut, Menu, UserShield } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { useLogoutMutation } from "@/lib/features/auth/auth.api";
import { clearAuthenticatedUser } from "@/lib/features/auth/auth.slice";
import { getApiErrorMessage } from "@/lib/features/api/error";
import { cn } from "@/lib/utils";

const navigationItems = [
  { href: "/", label: "Home" },
  { href: "/courses", label: "Courses" },
  { href: "/compare", label: "Compare" },
];

const adminNavigationItems = [
  { href: "/admin", label: "Manage Admin" },
  { href: "/admin/courses", label: "Manage Courses" },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { status: authStatus, isAuthenticated } = useAppSelector(
    (state) => state.auth,
  );
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();

  if (authStatus === "idle" || authStatus === "loading") {
    return <NavbarSkeleton />;
  }

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === href;
    }

    const matchesPath = (candidate: string) =>
      pathname === candidate || pathname.startsWith(`${candidate}/`);

    return (
      matchesPath(href) &&
      ![...navigationItems, ...adminNavigationItems].some(
        (item) => item.href !== href && item.href.length > href.length && matchesPath(item.href),
      )
    );
  };

  const linkClassName = (href: string) =>
    cn(
      "text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
      isActive(href) && "font-semibold text-foreground",
    );

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      dispatch(clearAuthenticatedUser());
      router.replace("/login");
    } catch (requestError) {
      toast.add({
        type: "error",
        title: "Unable to log out",
        description: getApiErrorMessage(requestError, "Please try again."),
      });
    }
  };

  const renderNavigationItems = () => (
    <>
      {navigationItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={isActive(item.href) ? "page" : undefined}
          className={linkClassName(item.href)}
        >
          {item.label}
        </Link>
      ))}
      {isAuthenticated &&
        adminNavigationItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive(item.href) ? "page" : undefined}
            className={linkClassName(item.href)}
          >
            {item.label}
          </Link>
        ))}
    </>
  );

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
            {renderNavigationItems()}
          </div>

          <div className="hidden items-center gap-4 md:flex">
            <ModeToggle />

            {isAuthenticated ? (
              <Button
                aria-label="Log out"
                disabled={isLoggingOut}
                onClick={handleLogout}
                size="icon"
                title="Log out"
                variant="outline"
              >
                <LogOut aria-hidden="true" />
              </Button>
            ) : (
              <Button
                aria-label="Go to admin login"
                nativeButton={false}
                render={<Link href="/login" />}
                size="icon"
                title="Admin login"
                variant="outline"
              >
                <UserShield aria-hidden="true" />
              </Button>
            )}
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
            {renderNavigationItems()}

            <div className="flex items-center gap-4">
              <ModeToggle />

              {isAuthenticated ? (
                <Button
                  aria-label="Log out"
                  disabled={isLoggingOut}
                  onClick={handleLogout}
                  size="icon"
                  title="Log out"
                  variant="outline"
                >
                  <LogOut aria-hidden="true" />
                </Button>
              ) : (
                <Button
                  aria-label="Go to admin login"
                  nativeButton={false}
                  render={<Link href="/login" />}
                  size="icon"
                  title="Admin login"
                  variant="outline"
                >
                  <UserShield aria-hidden="true" />
                </Button>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </header>
  );
}

function NavbarSkeleton() {
  return (
    <header className="border-b bg-background">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex w-full items-center justify-between px-4 py-3 sm:px-6 lg:px-8"
      >
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-6 w-24" />
      </nav>
    </header>
  );
}
