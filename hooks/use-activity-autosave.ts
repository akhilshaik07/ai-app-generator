"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/use-app-store";
import { saveUserActivity } from "@/lib/services/activity";

/**
 * Hook to auto-save user activity every 30 seconds
 * This ensures user progress is saved even if they don't logout properly
 */
export function useActivityAutoSave(intervalMs: number = 30000) {
  const user = useAppStore(state => state.user);
  const activeAppId = useAppStore(state => state.activeAppId);
  const currentPageSlug = useAppStore(state => state.currentPageSlug);
  const rawConfig = useAppStore(state => state.rawConfig);
  const parsedConfig = useAppStore(state => state.parsedConfig);
  const editorPanelWidth = useAppStore(state => state.editorPanelWidth);
  const sidebarCollapsed = useAppStore(state => state.sidebarCollapsed);

  useEffect(() => {
    if (!user) return; // Don't save if not logged in
    if (!activeAppId) return; // Don't save before an app is loaded

    const interval = setInterval(async () => {
      try {
        await saveUserActivity({
          appId: activeAppId,
          currentPageSlug,
          rawConfig,
          parsedConfig: parsedConfig || {},
          editorPanelWidth,
          sidebarCollapsed,
        });
      } catch (error) {
        // Silently fail, don't interrupt user experience
        console.debug("Activity auto-save failed (will retry):", error);
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [user, activeAppId, currentPageSlug, rawConfig, parsedConfig, editorPanelWidth, sidebarCollapsed, intervalMs]);
}
