"use client";

import React, { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { Toolbar } from "@/components/generator/Toolbar";
import { Validation } from "@/components/generator/Validation";
import { useAppStore } from "@/store/use-app-store";
import { Spotlight } from "@/components/ui/spotlight";

const Editor = dynamic(
  () => import("@/components/generator/Editor"),
  { ssr: false, loading: () => <div className="h-full bg-gray-950" /> }
);

const Preview = dynamic(
  () => import("@/components/generator/Preview"),
  { ssr: false, loading: () => <div className="h-full bg-gray-50" /> }
);

export default function BuilderPage() {
  const editorPanelWidth = useAppStore(state => state.editorPanelWidth);
  const setEditorPanelWidth = useAppStore(state => state.setEditorPanelWidth);
  const setValidationResult = useAppStore(state => state.setValidationResult);
  const dividerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

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

  return (
    <div className="h-full flex flex-col bg-transparent text-foreground relative p-3 overflow-hidden">
      <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="white" />
      <Toolbar />
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
