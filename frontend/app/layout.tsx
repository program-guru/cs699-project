import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import "./globals.css";

import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/layout/theme-provider";
import StoreProvider from "@/components/layout/store-provider";
import { Navbar } from "@/components/layout/navbar";
import { AuthInitializer } from "@/components/layout/auth-initializer";
import { Toaster } from "@/components/ui/toast";

const montserratHeading = Montserrat({
  subsets: ["latin"],
  variable: "--font-heading",
});

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "UniScope",
  description: "Explore and compare universities with UniScope.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "h-full",
        "antialiased",
        "font-sans",
        inter.variable,
        montserratHeading.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <StoreProvider>
            <AuthInitializer />
            <Navbar />
            {children}
            <Toaster />
            <footer className="border-t px-4 py-4 text-center text-sm text-muted-foreground">
              © 2026 UniScope. All rights reserved.
            </footer>
          </StoreProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
