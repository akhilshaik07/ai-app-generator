"use client";

import React, { useState } from "react";
import { useAppStore } from "../../store/use-app-store";
import { Play, CheckCircle2, AlertCircle, AlertTriangle, Loader2 } from "lucide-react";
import { apiClient } from "../../lib/api-client";
import { VersionControl } from "./VersionControl";
import { GitHubExport } from "./GitHubExport";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function Toolbar() {
  const validationResult = useAppStore(state => state.validationResult);
  const parsedConfig = useAppStore(state => state.parsedConfig);
  const activeLocale = useAppStore(state => state.activeLocale);
  const setActiveLocale = useAppStore(state => state.setActiveLocale);
  const setParsedConfig = useAppStore(state => state.setParsedConfig);
  const setIsPreviewLoading = useAppStore(state => state.setIsPreviewLoading);
  const user = useAppStore(state => state.user);
  const setIsAuthMenuOpen = useAppStore(state => state.setIsAuthMenuOpen);

  const [isApplying, setIsApplying] = useState(false);
  const appConfig = parsedConfig ?? validationResult?.normalized ?? null;
  const appName = appConfig?.name ?? appConfig?.app?.name ?? "Untitled App";
  const tables = appConfig?.pages?.filter(p => p.type === "table").length ?? 0;
  const forms = appConfig?.pages?.filter(p => p.type === "form").length ?? 0;
  const dashboards = appConfig?.pages?.filter(p => p.type === "dashboard").length ?? 0;

  const handleApply = async () => {
    if (!validationResult?.valid) return;
    if (!user) {
      setIsAuthMenuOpen(true);
      toast.error("You must sign in to apply changes");
      return;
    }
    setIsApplying(true);
    setIsPreviewLoading(true);

    try {
      const res = await apiClient.post("/config/apply", { config: validationResult.normalized });
      console.log("Apply config response:", res.data);
      if (res.data.valid === false) {
        toast.error("Backend validation failed. Check console for details.");
        console.error(res.data.errors);
        return;
      }
      setParsedConfig(res.data.normalized ?? res.data.config ?? res.data);
      toast.success("Configuration applied successfully", { position: "top-center" });
    } catch (e: any) {
       console.error(e);
       toast.error("Failed to apply config. See console.");
    } finally {
      setIsApplying(false);
      setIsPreviewLoading(false);
    }
  };

  const { valid, errors, warnings } = validationResult || { valid: true, errors: [], warnings: [] };
  const hasResult = !!validationResult;

  return (
    <div className="mb-3 h-auto sm:h-12 rounded-[8px] border border-border bg-white/88 shadow-sm shadow-black/[0.03] sticky top-0 z-20 flex flex-col sm:flex-row items-start sm:items-center justify-between px-3 sm:px-4 py-2 sm:py-0 shrink-0 gap-2 sm:gap-3">
      {/* Left */}
      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 w-full sm:w-auto">
        <div className="flex items-baseline space-x-1.5 sm:space-x-2 min-w-0 text-xs sm:text-sm">
          <span className="font-medium text-[12px] sm:text-[13px] text-foreground truncate">{appName}</span>
          <span className="text-[9px] sm:text-[10px] font-mono text-muted-foreground px-1.5 py-0.5 rounded bg-[#f4f2ec] border border-border shrink-0">
            v{appConfig?.app?.version || "1.0.0"}
          </span>
          <span className="hidden lg:inline text-[9px] sm:text-[10px] font-mono text-muted-foreground uppercase">
            {tables} / {forms} / {dashboards}
          </span>
        </div>
      </div>

      {/* Center - Validation Status */}
      <div className="hidden md:flex flex-1 justify-center items-center space-x-3">
        {hasResult && (
           <div className="flex items-center space-x-1 text-[10px] sm:text-[11px] bg-white px-2 py-1 rounded border border-border font-mono uppercase">
               {valid && warnings.length === 0 ? (
                 <><CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600" /> <span className="font-medium text-emerald-700 hidden sm:inline">Valid</span></>
               ) : !valid ? (
                 <><AlertCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-600" /> <span className="font-medium text-red-700">{errors.length} Err</span></>
               ) : (
                 <><AlertTriangle className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-600" /> <span className="font-medium text-amber-700">{warnings.length} Warn</span></>
               )}
           </div>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center space-x-1.5 sm:space-x-2 w-full sm:w-auto justify-end">
        {parsedConfig?.i18n && parsedConfig.i18n.supportedLocales.length > 1 && (
            <select 
              value={activeLocale}
              onChange={e => setActiveLocale(e.target.value)}
              className="bg-background border border-border text-[10px] sm:text-[11px] font-mono rounded px-1.5 sm:px-2 py-1 outline-none text-muted-foreground focus:border-foreground"
            >
                {parsedConfig.i18n.supportedLocales.map((loc: string) => (
                    <option key={loc} value={loc}>{loc.toUpperCase()}</option>
                ))}
            </select>
        )}

        <VersionControl />
        <GitHubExport />

        <Button 
          onClick={handleApply}
          disabled={!valid || isApplying}
          size="sm"
          className="h-7 sm:h-8 text-[11px] sm:text-[12px] px-2 sm:px-3 rounded bg-foreground hover:bg-foreground/90 text-background border border-foreground font-medium transition-colors"
        >
          {isApplying ? <Loader2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5 animate-spin" /> : <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5 fill-current" />}
          <span className="hidden sm:inline">Apply</span>
          <span className="sm:hidden">Go</span>
        </Button>
      </div>
    </div>
  );
}
