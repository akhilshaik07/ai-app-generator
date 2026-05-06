"use client";

import React, { useEffect, useState } from "react";
import { useAppStore } from "../../store/use-app-store";
import { Renderer } from "../runtime/Renderer";
import { motion } from "motion/react";
import { Spotlight } from "@/components/ui/spotlight";

function Preview() {
  const parsedConfig = useAppStore(state => state.parsedConfig);
  const isPreviewLoading = useAppStore(state => state.isPreviewLoading);
  const activeLocale = useAppStore(state => state.activeLocale);
  const [showContent, setShowContent] = useState(false);
  const tables = parsedConfig?.pages?.filter(p => p.type === "table").length ?? 0;
  const forms = parsedConfig?.pages?.filter(p => p.type === "form").length ?? 0;
  const dashboards = parsedConfig?.pages?.filter(p => p.type === "dashboard").length ?? 0;

  useEffect(() => {
    if (isPreviewLoading) {
      setTimeout(() => setShowContent(false), 0);
    } else if (parsedConfig) {
      const timer = setTimeout(() => setShowContent(true), 120);
      return () => clearTimeout(timer);
    }
  }, [parsedConfig, isPreviewLoading]);

  if (!parsedConfig) {
    return (
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[#111318] antialiased">
        <div
          className="pointer-events-none absolute inset-0 select-none"
          style={{
            backgroundSize: "40px 40px",
            backgroundImage: `
              linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)
            `,
          }}
        />
        <Spotlight
          className="-top-40 left-0 md:-top-20 md:left-60"
          fill="white"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 mx-auto w-full max-w-lg p-4 text-center"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#8dd6df]" />
            <span className="font-mono text-[10px] font-semibold uppercase text-white/55">
              Awaiting config
            </span>
          </div>
          <h1 className="mb-3 text-4xl font-bold tracking-normal text-white">
            No config loaded.
          </h1>
          <p className="mx-auto max-w-xs font-mono text-sm leading-relaxed text-white/60">
            Paste a valid JSON config in the editor -<br />
            your app renders here instantly.
          </p>
          <div className="mt-8 inline-block rounded-[8px] border border-white/10 bg-white/[0.06] px-4 py-3 text-left">
            <div className="mb-2 font-mono text-[9px] uppercase text-white/35">
              Quick start
            </div>
            <code className="font-mono text-[11px] leading-relaxed text-white/80">
              {"{"} {"\"name\": \"My App\","}<br />
              &nbsp;&nbsp;{"\"pages\": [...]"} {"}"}
            </code>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-y-auto bg-[#fbfaf7]">
      <div className="fixed top-3 left-3 z-20 hidden rounded border border-border bg-white/90 px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground shadow-sm md:block">
        {activeLocale}
      </div>
      <div className="fixed top-3 right-3 z-20 hidden rounded border border-border bg-white/90 px-2 py-0.5 font-mono text-[10px] uppercase text-muted-foreground shadow-sm md:block">
        {tables} TABLES / {forms} FORMS / {dashboards} DASHBOARDS
      </div>

      {isPreviewLoading || !showContent ? (
        <div className="mx-auto mt-12 flex min-h-full w-full max-w-5xl flex-col p-8">
          <div className="mb-8 h-10 w-full max-w-sm animate-pulse rounded border border-border bg-accent" />
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-12 w-full animate-pulse rounded border border-border bg-accent"
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
            <div className="mt-8 h-64 w-full animate-pulse rounded border border-border bg-accent" style={{ animationDelay: "400ms" }} />
          </div>
        </div>
      ) : (
        <motion.div
          key="rendered-app"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="min-h-full w-full bg-transparent"
        >
          <Renderer config={parsedConfig} locale={activeLocale} />
        </motion.div>
      )}
    </div>
  );
}

export { Preview };
export default Preview;
