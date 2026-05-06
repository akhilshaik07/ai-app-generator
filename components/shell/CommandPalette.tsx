"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/use-app-store";
import { templates } from "@/lib/templates";
import {
  Search,
  Home,
  Hammer,
  Database,
  Rocket,
  FileJson2,
  Play,
  PanelLeftClose,
  Globe,
  ArrowRight,
} from "lucide-react";

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ElementType;
  action: () => void;
  group: string;
}

export function CommandPalette() {
  const commandPaletteOpen = useAppStore(s => s.commandPaletteOpen);
  const setCommandPaletteOpen = useAppStore(s => s.setCommandPaletteOpen);
  const setRawConfig = useAppStore(s => s.setRawConfig);
  const setValidationResult = useAppStore(s => s.setValidationResult);
  const toggleSidebar = useAppStore(s => s.toggleSidebar);
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: CommandItem[] = [
    // Navigation
    { id: "nav-home", label: "Go to Home", icon: Home, action: () => { router.push("/"); close(); }, group: "Navigation" },
    { id: "nav-builder", label: "Go to Builder", icon: Hammer, action: () => { router.push("/builder"); close(); }, group: "Navigation" },
    { id: "nav-schema", label: "Go to Schema Viewer", icon: Database, action: () => { router.push("/schema"); close(); }, group: "Navigation" },
    { id: "nav-deploy", label: "Go to Deploy", icon: Rocket, action: () => { router.push("/deploy"); close(); }, group: "Navigation" },
    // Actions
    { id: "toggle-sidebar", label: "Toggle Sidebar", icon: PanelLeftClose, action: () => { toggleSidebar(); close(); }, group: "Actions" },
    // Templates
    ...templates.map((tpl) => ({
      id: `tpl-${tpl.app.id}`,
      label: `Load: ${tpl.app.name}`,
      description: `${tpl.entities.length} entities, ${tpl.views.length} views`,
      icon: FileJson2,
      action: () => {
        const raw = JSON.stringify(tpl, null, 2);
        setRawConfig(raw);
        void (async () => {
          try {
            const res = await fetch("/api/v1/config/validate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ config: raw }),
            });
            const data = await res.json();
            setValidationResult(data);
          } catch (e) {
            console.warn("fetch failed:", e);
          }
        })();
        router.push("/builder");
        close();
      },
      group: "Templates",
    })),
  ];

  const close = useCallback(() => {
    setCommandPaletteOpen(false);
    setQuery("");
    setActiveIndex(0);
  }, [setCommandPaletteOpen]);

  // Filter
  const filtered = query.trim()
    ? commands.filter(
        (c) =>
          c.label.toLowerCase().includes(query.toLowerCase()) ||
          c.description?.toLowerCase().includes(query.toLowerCase())
      )
    : commands;

  // Group
  const groups = Array.from(new Set(filtered.map((c) => c.group)));

  // Keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
      if (e.key === "Escape" && commandPaletteOpen) {
        close();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [commandPaletteOpen, setCommandPaletteOpen, close]);

  useEffect(() => {
    if (commandPaletteOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [commandPaletteOpen]);

  const handleKeyNav = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      filtered[activeIndex]?.action();
    }
  };

  return (
    <AnimatePresence>
      {commandPaletteOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
            onClick={close}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 w-[90%] max-w-[560px] bg-[#141416] border border-white/[0.08] rounded-[8px] shadow-2xl shadow-black/50 z-[101] overflow-hidden"
          >
            {/* Search Input */}
            <div className="flex items-center px-4 border-b border-white/[0.06]">
              <Search className="w-4 h-4 text-white/30 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search commands, templates..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={handleKeyNav}
                className="flex-1 bg-transparent border-none outline-none px-3 py-3.5 text-[14px] text-white placeholder:text-white/30"
              />
              <kbd className="text-[10px] font-mono text-white/20 bg-white/[0.05] px-1.5 py-0.5 rounded border border-white/[0.06]">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div className="max-h-[320px] overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <div className="py-8 text-center text-white/30 text-[13px]">
                  No results found
                </div>
              ) : (
                groups.map((group) => (
                  <div key={group} className="mb-2">
                    <div className="px-2 py-1.5 text-[10px] uppercase text-white/25 font-semibold">
                      {group}
                    </div>
                    {filtered
                      .filter((c) => c.group === group)
                      .map((cmd) => {
                        const globalIdx = filtered.indexOf(cmd);
                        const Icon = cmd.icon;
                        return (
                          <button
                            key={cmd.id}
                            onClick={cmd.action}
                            onMouseEnter={() => setActiveIndex(globalIdx)}
                            className={`w-full flex items-center px-3 py-2.5 rounded-lg text-left transition-colors group
                              ${globalIdx === activeIndex
                                ? "bg-white/[0.06] text-white"
                                : "text-white/60 hover:bg-white/[0.04]"
                              }`}
                          >
                            <Icon className="w-4 h-4 shrink-0 mr-3 text-white/40" />
                            <div className="flex-1 min-w-0">
                              <div className="text-[13px] font-medium truncate">
                                {cmd.label}
                              </div>
                              {cmd.description && (
                                <div className="text-[11px] text-white/30 truncate">
                                  {cmd.description}
                                </div>
                              )}
                            </div>
                            <ArrowRight
                              className={`w-3 h-3 text-white/20 shrink-0 transition-opacity ${
                                globalIdx === activeIndex ? "opacity-100" : "opacity-0"
                              }`}
                            />
                          </button>
                        );
                      })}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
