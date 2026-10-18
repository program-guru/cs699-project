import { Navbar } from "@/components/layout/navbar";

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Navbar />
      {children}
      <footer className="border-t px-4 py-4 text-center text-sm text-muted-foreground">
        © 2026 UniScope. All rights reserved.
      </footer>
    </>
  );
}
