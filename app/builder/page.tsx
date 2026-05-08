"use client";

import React, { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { Toolbar } from "@/components/generator/Toolbar";
import { Validation } from "@/components/generator/Validation";
import { useAppStore } from "@/store/use-app-store";
import { templates } from "@/lib/templates";
import { ArrowRight, WandSparkles } from "lucide-react";

const Editor = dynamic(
  () => import("@/components/generator/Editor"),
  { ssr: false, loading: () => <div className="h-full bg-[#fffefa]"><PanelSkeleton /></div> }
);

const Preview = dynamic(
  () => import("@/components/generator/Preview"),
  { ssr: false, loading: () => <div className="h-full bg-[#fbfaf7]"><PanelSkeleton /></div> }
);

export default function BuilderPage() {
  const editorPanelWidth = useAppStore(state => state.editorPanelWidth);
  const setEditorPanelWidth = useAppStore(state => state.setEditorPanelWidth);
  const setValidationResult = useAppStore(state => state.setValidationResult);
  const rawConfig = useAppStore(state => state.rawConfig);
  const parsedConfig = useAppStore(state => state.parsedConfig);
  const setRawConfig = useAppStore(state => state.setRawConfig);
  const applyConfigLocally = useAppStore(state => state.applyConfigLocally);
  const dividerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const showStarter = !parsedConfig && !rawConfig.trim();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const mainEl = document.getElementById("builder-main");
      if (!mainEl) return;
      const rect = mainEl.getBoundingClientRect();
      const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
      if (newWidth >= 20 && newWidth <= 80) {
        setEditorPanelWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        document.body.style.cursor = "default";
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [setEditorPanelWidth]);

  const loadStarter = (template: any) => {
    const raw = JSON.stringify(template, null, 2);
    setRawConfig(raw);
    applyConfigLocally(raw);
    setValidationResult({
      valid: true,
      errors: [],
      warnings: [],
      normalized: template,
    });
  };

  return (
    <div className="h-full flex flex-col bg-transparent text-foreground relative p-3 overflow-hidden">
      <Toolbar />
      {showStarter && (
        <div className="mb-3 rounded-[8px] border border-border bg-white/92 p-3 shadow-sm shadow-black/[0.03]">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border border-border bg-[#111318] text-white">
                <WandSparkles className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[13px] font-semibold text-foreground">New here? Start with a working app.</div>
                <div className="mt-1 text-[12px] leading-5 text-muted-foreground">
                  Pick a template to fill the editor and render the preview instantly, then edit the JSON when you are ready.
                </div>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-3 xl:w-[560px]">
              {templates.slice(0, 3).map((template) => (
                <button
                  key={template.app.id}
                  onClick={() => loadStarter(template)}
                  className="group flex min-h-16 items-center justify-between rounded-[8px] border border-border bg-[#fbfaf7] px-3 py-2 text-left transition-colors hover:border-[#0f6b7a]/45 hover:bg-white"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[12px] font-semibold text-foreground">{template.app.name}</span>
                    <span className="mt-0.5 block font-mono text-[10px] uppercase text-muted-foreground">
                      {template.entities.length} entities / {template.views.length} views
                    </span>
                  </span>
                  <ArrowRight className="ml-2 h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      <div id="builder-main" className="studio-surface flex-1 flex overflow-hidden relative rounded-[8px] border border-white/20 bg-white/60 backdrop-blur-md shadow-2xl shadow-black/[0.1]">
        {/* Editor Panel */}
        <div style={{ width: `${editorPanelWidth}%` }} className="h-full relative flex flex-col min-w-0 border-r border-border shrink-0 bg-white">
          <Editor />
          <Validation />
        </div>

        {/* Draggable Divider */}
        <div
          ref={dividerRef}
          onMouseDown={() => {
            isDragging.current = true;
            document.body.style.cursor = "col-resize";
          }}
          className="w-1.5 h-full cursor-col-resize bg-transparent hover:bg-[#0f6b7a]/10 transition-colors z-30 shrink-0 relative group"
        >
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[2px] bg-border group-hover:bg-[#0f6b7a] group-hover:shadow-[0_0_8px_#0f6b7a] transition-all" />
        </div>

        {/* Preview Panel */}
        <div className="flex-1 min-w-0 h-full relative bg-[#fbfaf7]">
          <Preview />
        </div>
      </div>
    </div>
  );
}

function PanelSkeleton() {
  return (
    <div className="h-full w-full p-4">
      <div className="soft-skeleton mb-4 h-8 w-40 rounded border border-border" />
      <div className="space-y-3">
        <div className="soft-skeleton h-10 w-full rounded border border-border" />
        <div className="soft-skeleton h-10 w-5/6 rounded border border-border" />
        <div className="soft-skeleton h-10 w-4/6 rounded border border-border" />
      </div>
    </div>
  );
}
