import { Router, Request, Response } from "express";
import { requireAuth } from "../middleware/auth";

const router = Router();

// In-memory storage for demo (use Supabase in production)
const userActivities = new Map<string, any>();

/**
 * Save user activity
 */
router.post("/activity/save", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const activity = {
      userId,
      ...req.body,
      timestamp: new Date().toISOString(),
    };

    // Store in memory (for production, use Supabase or database)
    userActivities.set(userId, activity);

    res.json({ success: true, activity });
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

    const activity = userActivities.get(userId);
    
    if (!activity) {
      return res.status(200).json(null);
    }

    res.json(activity);
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

    const limit = parseInt(req.query.limit as string) || 10;
    const activity = userActivities.get(userId);

    if (!activity) {
      return res.json([]);
    }

    res.json([activity]);
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

    userActivities.delete(userId);
    res.json({ success: true });
  } catch (error) {
    console.error("Error clearing activity:", error);
    res.status(500).json({ error: "Failed to clear activity" });
  }
});

export default router;
