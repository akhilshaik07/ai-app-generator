"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/store/use-app-store";
import { AuthMenu } from "@/components/generator/AuthMenu";
import {
  Search,
  Menu,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Command,
  ChevronRight,
} from "lucide-react";

const ROUTE_LABELS: Record<string, string> = {
  "/": "Home",
  "/builder": "Builder",
  "/schema": "Schema Viewer",
  "/deploy": "Export & Deploy",
};

export function Topbar() {
  const pathname = usePathname();
  const validationResult = useAppStore(s => s.validationResult);
  const parsedConfig = useAppStore(s => s.parsedConfig);
  const setCommandPaletteOpen = useAppStore(s => s.setCommandPaletteOpen);
  const setMobileMenuOpen = useAppStore(s => s.setMobileMenuOpen);

  const { valid, errors, warnings } = validationResult || {
    valid: true,
    errors: [],
    warnings: [],
  };
  const hasResult = !!validationResult;
  const appConfig = parsedConfig ?? validationResult?.normalized ?? null;
  const appName = appConfig?.name ?? appConfig?.app?.name ?? "AI Studio";

  // Build breadcrumb
  const segments = pathname === "/" ? ["Home"] : [];
  if (pathname !== "/") {
    segments.push("Home");
    const routeLabel = ROUTE_LABELS[pathname] || pathname.slice(1);
    segments.push(routeLabel);
  }

  return (
    <header className="h-16 flex items-center justify-between px-4 lg:px-6 border-b border-border bg-white/82 backdrop-blur sticky top-0 z-30 shrink-0 shadow-sm shadow-black/[0.02]">
      {/* Left: Mobile menu + Breadcrumbs */}
      <div className="flex items-center space-x-3 min-w-0">
        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="md:hidden flex items-center justify-center w-9 h-9 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Breadcrumbs */}
        <nav className="hidden sm:flex items-center text-[13px] text-muted-foreground min-w-0">
          {segments.map((seg, i) => (
            <React.Fragment key={i}>
              {i > 0 && (
                <ChevronRight className="w-3 h-3 mx-1.5 text-muted-foreground/50 shrink-0" />
              )}
              <span
                className={`truncate ${i === segments.length - 1 ? "text-foreground font-medium" : ""}`}
              >
                {seg}
              </span>
            </React.Fragment>
          ))}
        </nav>

        <span className="sm:hidden text-[13px] font-medium text-foreground truncate">
          {appName}
        </span>
      </div>

      {/* Center: Command Palette Trigger */}
      <button
        onClick={() => setCommandPaletteOpen(true)}
        className="hidden lg:flex items-center space-x-3 px-3 h-9 min-w-[320px] rounded-lg border border-border bg-white/80 hover:bg-white text-muted-foreground hover:text-foreground shadow-sm shadow-black/[0.02] transition-all group"
      >
        <Search className="w-3.5 h-3.5" />
        <span className="text-[12px]">Search or run a command...</span>
        <div className="flex items-center space-x-0.5 text-[10px] font-mono bg-background border border-border px-1.5 py-0.5 rounded-sm">
          <Command className="w-2.5 h-2.5" />
          <span>K</span>
        </div>
      </button>

      {/* Right: Status + Auth */}
      <div className="flex items-center space-x-3">
        {/* Validation Status Pill */}
        {hasResult && (
          <div className="hidden sm:flex items-center space-x-1.5 text-[12px] px-2.5 py-1 rounded-lg border border-border bg-white/80 shadow-sm shadow-black/[0.02]">
            {valid && warnings.length === 0 ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-medium">Valid</span>
              </>
            ) : !valid ? (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                <span className="text-red-700 font-medium">
                  {errors.length} Error{errors.length > 1 ? "s" : ""}
                </span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-amber-700 font-medium">
                  {warnings.length} Warning{warnings.length > 1 ? "s" : ""}
                </span>
              </>
            )}
          </div>
        )}

        {/* Auth */}
        <div className="border-l border-border pl-3">
          <AuthMenu />
        </div>
      </div>
    </header>
  );
}
