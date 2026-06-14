import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Camera, User, Flame } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Hoy", icon: Home },
  { to: "/analizar", label: "Analizar", icon: Camera },
  { to: "/perfil", label: "Perfil", icon: User },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-4">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Flame className="h-4 w-4" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight">MacroFit AI</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Élite 2026</div>
            </div>
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-5 py-6">{children}</main>
      <nav className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2 rounded-full border border-border/80 bg-card/90 px-2 py-2 shadow-2xl shadow-black/40 backdrop-blur-xl">
        <ul className="flex items-center gap-1">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

export function MacroRing({
  label, value, target, color, unit = "g",
}: { label: string; value: number; target: number; color: string; unit?: string }) {
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0;
  const r = 38;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
          <circle cx="48" cy="48" r={r} stroke="currentColor" strokeWidth="8" fill="none" className="text-muted/40" />
          <circle
            cx="48" cy="48" r={r} fill="none" strokeWidth="8" strokeLinecap="round"
            stroke={color} strokeDasharray={c} strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 600ms ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-base font-semibold tabular-nums">{Math.round(value)}</div>
          <div className="text-[10px] text-muted-foreground">/ {Math.round(target)}{unit}</div>
        </div>
      </div>
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}
