import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  Show,
  UserButton,
} from "@clerk/nextjs";
import Link from "next/link";
import { ReactLenis } from "lenis/react";
import "lenis/dist/lenis.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeTogglerButton } from "@/components/animate-ui/components/buttons/theme-toggler";
import { Button } from "@/components/ui/button";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Interview Prep Copilot",
  description: "JD-specific interview practice, generated from your resume.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`h-full antialiased ${geistSans.variable} ${geistMono.variable}`}
        suppressHydrationWarning
      >
        <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <ReactLenis root>
              <header className="sticky top-0 z-50 border-b border-border/50 bg-background/70 backdrop-blur-md">
                <div className="mx-auto max-w-5xl flex items-center justify-between px-6 py-3">
                  <Link href="/" className="text-gradient-brand font-semibold tracking-tight">
                    Interview Prep Copilot
                  </Link>
                  <nav className="flex items-center gap-4">
                    <Show when="signed-in">
                      <Link
                        href="/setup"
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        New Practice
                      </Link>
                      <Link
                        href="/dashboard"
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Dashboard
                      </Link>
                      <UserButton />
                    </Show>
                    <Show when="signed-out">
                      <SignInButton>
                        <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                          Sign in
                        </button>
                      </SignInButton>
                      <SignUpButton>
                        <Button variant="primary" size="sm">Sign up</Button>
                      </SignUpButton>
                    </Show>
                    <ThemeTogglerButton variant="ghost" size="default" modes={["light", "dark"]} />
                  </nav>
                </div>
              </header>
              <main className="flex-1">{children}</main>
            </ReactLenis>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
