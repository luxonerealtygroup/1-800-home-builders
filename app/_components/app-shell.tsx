"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "./auth-provider";
import { useLeads } from "./lead-provider";
import {
  CalendarIcon,
  CommunicationIcon,
  DashboardIcon,
  LogoutIcon,
  PipelineIcon,
  ProjectsIcon,
  SearchIcon,
  UsersIcon,
} from "./icons";

const navItems = [
  { href: "/", label: "Dashboard", icon: DashboardIcon },
  { href: "/follow-ups", label: "Follow-ups", icon: CalendarIcon },
  { href: "/pipeline", label: "Pipeline", icon: PipelineIcon },
  { href: "/projects", label: "Projects", icon: ProjectsIcon },
  { href: "/communications", label: "Comms", icon: CommunicationIcon },
];

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname.startsWith(href);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { canManageUsers, loading, logout, user } = useAuth();
  const { supabaseError, supabaseMode, supabaseWarning } = useLeads();

  const visibleNavItems = canManageUsers
    ? [
        ...navItems,
        { href: "/admin", label: "Admin", icon: UsersIcon },
      ]
    : navItems;

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, router, user]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07090d] px-6">
        <div className="w-full max-w-sm rounded-lg border border-white/10 bg-white/[0.04] p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-sky-300 text-sm font-black text-slate-950">
            ADU
          </div>
          <p className="mt-4 text-sm font-medium text-zinc-300">
            Opening secure workspace...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen overflow-hidden bg-[#07090d]"
      style={{
        backgroundImage: "url('/workspace-home-bg.png')",
        backgroundAttachment: "fixed",
        backgroundPosition: "center",
        backgroundSize: "cover",
      }}
    >
      <div className="pointer-events-none fixed inset-0 bg-[#07090d]/90" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_78%_12%,rgba(14,165,233,0.16),transparent_28%),radial-gradient(circle_at_18%_78%,rgba(16,185,129,0.1),transparent_26%),linear-gradient(180deg,rgba(7,9,13,0.48),rgba(7,9,13,0.98))]" />

      <aside className="fixed inset-y-0 left-0 z-20 hidden w-72 border-r border-white/10 bg-[#090d14]/90 px-5 py-6 shadow-2xl shadow-black/40 backdrop-blur-2xl lg:block">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-sky-300 to-emerald-300 text-sm font-black text-slate-950 shadow-lg shadow-sky-950/40">
            ADU
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-300">
              BuildFlow
            </p>
            <p className="text-sm text-zinc-400">Sales CRM</p>
          </div>
        </Link>

        <nav className="mt-10 space-y-1.5">
          {visibleNavItems.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex h-12 items-center gap-3 rounded-lg px-3 text-sm font-medium transition ${
                  active
                    ? "bg-white text-slate-950 shadow-lg shadow-white/10"
                    : "text-zinc-400 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-6 left-5 right-5 rounded-lg border border-white/10 bg-white/[0.045] p-4 shadow-2xl shadow-black/30">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">
            Forecast
          </p>
          <p className="mt-2 text-xl font-semibold text-white">$1.87M</p>
          <p className="mt-1 text-xs leading-5 text-zinc-400">
            Open pipeline. Signed in as {user.name} ({user.role}).
          </p>
          <button
            className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-white/10 text-sm font-semibold text-zinc-300 transition hover:border-rose-300/40 hover:text-white"
            type="button"
            onClick={() => {
              logout();
              router.replace("/login");
            }}
          >
            <LogoutIcon className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      <main className="relative z-10 min-h-screen pb-24 lg:ml-72 lg:pb-0">
        <header className="sticky top-0 z-10 border-b border-white/10 bg-[#07090d]/72 px-4 py-3 backdrop-blur-2xl md:px-8 lg:px-10">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-300 lg:hidden">
                BuildFlow
              </p>
              <h1 className="truncate text-lg font-semibold text-white md:text-2xl">
                ADU Sales Command Center
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.055] text-zinc-300 shadow-lg shadow-black/20 transition hover:border-sky-300/60 hover:text-white"
                type="button"
                aria-label="Search leads"
              >
                <SearchIcon className="h-5 w-5" />
              </button>
              <button
                className="flex h-11 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.055] px-3 text-sm font-semibold text-zinc-300 shadow-lg shadow-black/20 transition hover:border-rose-300/40 hover:text-white lg:hidden"
                type="button"
                aria-label="Sign out"
                onClick={() => {
                  logout();
                  router.replace("/login");
                }}
              >
                <LogoutIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-7xl px-4 py-5 md:px-8 md:py-8 lg:px-10">
          {canManageUsers && (supabaseWarning || supabaseError) && (
            <div className="mb-4 rounded-lg border border-amber-300/25 bg-amber-300/[0.08] p-3 text-sm leading-6 text-amber-100 shadow-2xl shadow-black/20">
              {supabaseWarning || "Supabase sync issue"}{" "}
              <span className="text-amber-100/70">
                {supabaseError
                  ? `- ${supabaseError}`
                  : `- using ${supabaseMode === "connected" ? "Supabase" : "mock fallback"} data.`}
              </span>
            </div>
          )}
          {children}
        </div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#090d14]/92 px-2 pb-3 pt-2 shadow-2xl shadow-black/50 backdrop-blur-2xl lg:hidden">
        <div
          className={`grid gap-1 ${
            visibleNavItems.length > 5 ? "grid-cols-6" : "grid-cols-5"
          }`}
        >
          {visibleNavItems.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex h-14 flex-col items-center justify-center gap-1 rounded-lg text-[9px] font-semibold transition sm:text-[11px] ${
                  active
                    ? "bg-white text-slate-950 shadow-lg shadow-white/10"
                    : "text-zinc-500 hover:text-white"
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
