"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import StockSearch from "@/components/StockSearch";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <div className="container flex h-14 items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            className="lg:hidden rounded-md border px-2 py-1"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle navigation"
          >
            ?
          </button>
          <Link href="/" className="text-lg font-bold tracking-tight">
            PaperStack
          </Link>
          <div className="hidden lg:block w-64">
            <StockSearch compact />
          </div>
        </div>

        <nav className="hidden items-center gap-6 text-sm font-medium lg:flex">
          {user ? (
            <>
              <Link href="/dashboard" className="hover:text-primary">
                Dashboard
              </Link>
              <Link href="/history" className="hover:text-primary">
                History
              </Link>
              <Link href="/leaderboard" className="hover:text-primary">
                Leaderboard
              </Link>
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className={cn(
                    "flex items-center gap-2 rounded-md border px-3 py-1 text-sm",
                    userMenuOpen && "bg-muted"
                  )}
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  {user.username}
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-40 rounded-md border bg-popover p-2 text-sm shadow-lg">
                    <Link href="/dashboard" className="block rounded px-2 py-1 hover:bg-muted">
                      Dashboard
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="mt-1 w-full rounded px-2 py-1 text-left text-red-600 hover:bg-muted"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login" className="hover:text-primary">
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-primary px-3 py-1 text-primary-foreground shadow hover:bg-primary/90"
              >
                Get Started
              </Link>
            </div>
          )}
        </nav>
      </div>

      {menuOpen && (
        <div className="lg:hidden border-t border-border bg-background">
          <div className="container space-y-3 py-3">
            <StockSearch compact />
            {user ? (
              <>
                <Link href="/dashboard" className="block rounded px-2 py-2 hover:bg-muted">
                  Dashboard
                </Link>
                <Link href="/history" className="block rounded px-2 py-2 hover:bg-muted">
                  History
                </Link>
                <Link href="/leaderboard" className="block rounded px-2 py-2 hover:bg-muted">
                  Leaderboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full rounded px-2 py-2 text-left text-red-600 hover:bg-muted"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="flex gap-3">
                <Link href="/login" className="w-full rounded px-2 py-2 text-center hover:bg-muted">
                  Login
                </Link>
                <Link
                  href="/register"
                  className="w-full rounded bg-primary px-3 py-2 text-center text-primary-foreground shadow hover:bg-primary/90"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;

