import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth";
import {
  saveUserActivity,
  getUserActivity,
  clearUserActivity,
} from "../services/user-activity";

const router = Router();

/**
 * Save user activity
 */
router.post("/activity/save", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { appId, currentPageSlug, rawConfig, parsedConfig, editorPanelWidth, sidebarCollapsed } = req.body;

    const activity = await saveUserActivity(userId, {
      lastAppId: appId || null,
      lastPage: currentPageSlug || null,
      editorState: {
        rawConfig,
        parsedConfig,
        editorPanelWidth,
        sidebarCollapsed,
      },
    });

    // Return in the same shape the frontend expects
    res.json({
      success: true,
      activity: {
        userId,
        appId: activity?.last_app_id || null,
        currentPageSlug: activity?.last_page || null,
        rawConfig: activity?.editor_state?.rawConfig || "",
        parsedConfig: activity?.editor_state?.parsedConfig || {},
        editorPanelWidth: activity?.editor_state?.editorPanelWidth ?? 40,
        sidebarCollapsed: activity?.editor_state?.sidebarCollapsed ?? false,
        timestamp: activity?.updated_at || new Date().toISOString(),
        active: true,
      },
    });
  } catch (error) {
    console.error("Error saving activity:", error);
    res.status(500).json({ error: "Failed to save activity" });
  }
});

/**
 * Load user's last activity
 */
router.get("/activity/last-activity", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const activity = await getUserActivity(userId);

    if (!activity) {
      return res.status(200).json(null);
    }

    // Return in the shape the frontend expects
    res.json({
      userId: activity.user_id,
      appId: activity.last_app_id,
      currentPageSlug: activity.last_page,
      rawConfig: activity.editor_state?.rawConfig || "",
      parsedConfig: activity.editor_state?.parsedConfig || {},
      editorPanelWidth: activity.editor_state?.editorPanelWidth ?? 40,
      sidebarCollapsed: activity.editor_state?.sidebarCollapsed ?? false,
      timestamp: activity.updated_at,
      active: true,
    });
  } catch (error) {
    console.error("Error loading activity:", error);
    res.status(500).json({ error: "Failed to load activity" });
  }
});

/**
 * Get activity history
 */
router.get("/activity/history", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const activity = await getUserActivity(userId);

    if (!activity) {
      return res.json([]);
    }

    res.json([
      {
        userId: activity.user_id,
        appId: activity.last_app_id,
        currentPageSlug: activity.last_page,
        rawConfig: activity.editor_state?.rawConfig || "",
        parsedConfig: activity.editor_state?.parsedConfig || {},
        editorPanelWidth: activity.editor_state?.editorPanelWidth ?? 40,
        sidebarCollapsed: activity.editor_state?.sidebarCollapsed ?? false,
        timestamp: activity.updated_at,
        active: true,
      },
    ]);
  } catch (error) {
    console.error("Error fetching activity history:", error);
    res.status(500).json({ error: "Failed to fetch activity history" });
  }
});

/**
 * Clear user activity (on logout)
 */
router.post("/activity/clear", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    await clearUserActivity(userId);
    res.json({ success: true });
  } catch (error) {
    console.error("Error clearing activity:", error);
    res.status(500).json({ error: "Failed to clear activity" });
  }
});

export default router;
