"use client";

import React from "react";
import { useAppStore } from "../../store/use-app-store";
import { Renderer } from "../runtime/Renderer";
import { FileJson2, Loader2, MousePointerClick, Sparkles } from "lucide-react";

function Preview() {
  const parsedConfig = useAppStore(state => state.parsedConfig);
  const isPreviewLoading = useAppStore(state => state.isPreviewLoading);
  const activeLocale = useAppStore(state => state.activeLocale);
  const tables = parsedConfig?.pages?.filter(p => p.type === "table").length ?? 0;
  const forms = parsedConfig?.pages?.filter(p => p.type === "form").length ?? 0;
  const dashboards = parsedConfig?.pages?.filter(p => p.type === "dashboard").length ?? 0;

  if (!parsedConfig) {
    return (
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[#111318] antialiased">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.055)_1px,transparent_1px)] bg-[size:36px_36px]" />
        <div className="relative z-10 mx-auto w-full max-w-xl p-6 text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded border border-white/10 bg-white/[0.07] px-3 py-1.5">
            <Sparkles className="h-3.5 w-3.5 text-[#8dd6df]" />
            <span className="font-mono text-[10px] font-semibold uppercase text-white/60">Ready for a template</span>
          </div>
          <h1 className="mb-3 text-3xl font-semibold tracking-normal text-white sm:text-4xl">
            Start from the left panel.
          </h1>
          <p className="mx-auto max-w-sm text-sm leading-6 text-white/62">
            Choose a starter template or paste JSON in the editor. Once the config is valid, this area becomes the live app preview.
          </p>
          <div className="mt-8 grid gap-3 text-left sm:grid-cols-2">
            <div className="rounded-[8px] border border-white/10 bg-white/[0.06] p-4">
              <MousePointerClick className="mb-3 h-4 w-4 text-[#8dd6df]" />
              <div className="text-sm font-medium text-white">Pick a template</div>
              <div className="mt-1 text-xs leading-5 text-white/50">Best for new users who want a working app immediately.</div>
            </div>
            <div className="rounded-[8px] border border-white/10 bg-white/[0.06] p-4">
              <FileJson2 className="mb-3 h-4 w-4 text-[#d7b56d]" />
              <div className="text-sm font-medium text-white">Paste JSON</div>
              <div className="mt-1 text-xs leading-5 text-white/50">Best when you already have a config ready to test.</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="smooth-scroll relative h-full w-full overflow-y-auto bg-[#fbfaf7]">
      <div className="absolute top-3 left-3 z-20 hidden rounded border border-border bg-white/95 px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground shadow-sm md:block">
        {activeLocale}
      </div>
      <div className="absolute top-3 right-3 z-20 hidden rounded border border-border bg-white/95 px-2 py-0.5 font-mono text-[10px] uppercase text-muted-foreground shadow-sm md:block">
        {tables} TABLES / {forms} FORMS / {dashboards} DASHBOARDS
      </div>

      {isPreviewLoading ? (
        <div className="mx-auto mt-12 flex min-h-full w-full max-w-5xl flex-col p-8">
          <div className="mb-5 flex items-center gap-2 text-[12px] font-medium text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Rendering preview
          </div>
          <div className="soft-skeleton mb-8 h-10 w-full max-w-sm rounded border border-border" />
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="soft-skeleton h-12 w-full rounded border border-border"
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
            <div className="soft-skeleton mt-8 h-64 w-full rounded border border-border" style={{ animationDelay: "400ms" }} />
          </div>
        </div>
      ) : (
        <div className="min-h-full w-full bg-transparent">
          <Renderer config={parsedConfig} locale={activeLocale} />
        </div>
      )}
    </div>
  );
}

export { Preview };
export default Preview;
