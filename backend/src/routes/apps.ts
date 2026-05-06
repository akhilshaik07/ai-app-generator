import { Router, Request, Response, NextFunction } from "express";
import { AppRegistry } from "../core/app-registry";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.get("/", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user?.id;
    const apps = await AppRegistry.listByUser(userId);
    res.status(200).json({ apps });
  } catch (error) {
    next(error);
  }
});

router.delete("/:appId", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { appId } = req.params;
      await AppRegistry.delete(appId as string);
      res.status(200).json({ success: true, message: "App deleted successfully" });
    } catch (error) {
      next(error);
    }
  });

export default router;