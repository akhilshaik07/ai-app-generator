"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { useAppStore } from "@/store/use-app-store";
import {
  Home,
  Hammer,
  Database,
  Rocket,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/builder", label: "Builder", icon: Hammer },
  { href: "/schema", label: "Schema", icon: Database },
  { href: "/deploy", label: "Deploy", icon: Rocket },
];

export function Sidebar() {
  const pathname = usePathname();
  const sidebarCollapsed = useAppStore(s => s.sidebarCollapsed);
  const toggleSidebar = useAppStore(s => s.toggleSidebar);

  return (
    <motion.aside
      className="hidden md:flex flex-col h-screen sticky top-0 z-40 border-r border-border bg-white/86 backdrop-blur select-none shadow-sm shadow-black/[0.03]"
      animate={{ width: sidebarCollapsed ? 64 : 240 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Brand */}
      <div className="h-16 flex items-center px-4 border-b border-border shrink-0 overflow-hidden">
        <div className="w-8 h-8 bg-foreground flex items-center justify-center shrink-0 rounded-lg shadow-sm shadow-black/10">
          <Sparkles className="w-3.5 h-3.5 text-background" />
        </div>
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="ml-3 flex flex-col min-w-0"
            >
              <span className="text-[13px] font-semibold text-foreground truncate">
                AI Studio
              </span>
              <span className="text-[10px] text-muted-foreground font-medium uppercase truncate">
                App Generator
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto overflow-x-hidden">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex items-center h-10 rounded-[8px] px-3 transition-all
                ${isActive
                  ? "bg-[#111318] text-white font-medium shadow-sm shadow-black/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
            >
              {/* Active indicator bar */}
              {isActive && (
                <motion.div
                  layoutId="sidebar-active-indicator"
                  className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r bg-[#0f6b7a]"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}

              <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? "text-white" : "text-muted-foreground"}`} />

              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -4 }}
                    transition={{ duration: 0.12 }}
                    className="ml-3 text-[13px] font-medium truncate"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Tooltip when collapsed */}
              {sidebarCollapsed && (
                <div className="absolute left-full ml-2 px-2.5 py-1 bg-foreground border border-border rounded text-xs text-background font-medium opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="px-3 pb-4 shrink-0">
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center h-8 rounded border border-transparent hover:border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>
    </motion.aside>
  );
}
