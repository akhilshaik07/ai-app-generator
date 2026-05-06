"use client";

import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { CommandPalette } from "./CommandPalette";
import { useActivityAutoSave } from "@/hooks/use-activity-autosave";
import { useAppStore } from "@/store/use-app-store";
import { supabase } from "@/lib/supabase-client";
import {
  Home,
  Hammer,
  Database,
  Rocket,
  X,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/builder", label: "Builder", icon: Hammer },
  { href: "/schema", label: "Schema", icon: Database },
  { href: "/deploy", label: "Deploy", icon: Rocket },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const mobileMenuOpen = useAppStore(s => s.mobileMenuOpen);
  const setMobileMenuOpen = useAppStore(s => s.setMobileMenuOpen);
  const setUser = useAppStore(s => s.setUser);
  
  // Auto-save user activity every 30 seconds
  useActivityAutoSave(30000);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, [setUser]);

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="fixed left-0 top-0 bottom-0 w-[280px] bg-white border-r border-border z-50 flex flex-col md:hidden shadow-2xl shadow-black/20"
            >
              {/* Brand */}
              <div className="h-14 flex items-center justify-between px-4 border-b border-border">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-foreground flex items-center justify-center rounded-sm">
                    <Sparkles className="w-3.5 h-3.5 text-background" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[13px] font-semibold text-foreground">
                      AI Studio
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium uppercase">
                      App Generator
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-8 h-8 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Nav */}
              <nav className="flex-1 py-3 px-2 space-y-0.5">
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
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center h-9 rounded px-3 transition-colors
                        ${isActive
                          ? "bg-accent text-foreground font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent"
                        }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? "text-foreground" : "text-muted-foreground"}`} />
                      <span className="ml-3 text-[13px] font-medium">
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-transparent">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Command Palette (global) */}
      <CommandPalette />
    </div>
  );
}
