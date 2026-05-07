import { Router, Request, Response, NextFunction } from "express";
import { AppRegistry } from "../core/app-registry";
import { requireAuth } from "../middleware/auth";
import { createDynamicRecord } from "../services/dynamic-records";

const router = Router();

router.post("/:appId/:formSlug", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { appId, formSlug } = req.params as { appId: string; formSlug: string };
    const { data } = req.body || {};

    const config = await AppRegistry.get(appId);
    if (!config) {
      return res.status(404).json({ error: "Not Found", message: "App not found" });
    }

    const page = config.pages?.find((p: any) => String(p.slug || p.id || p.name).toLowerCase() === formSlug.toLowerCase());
    if (!page) {
      return res.status(404).json({ error: "Not Found", message: `Form ${formSlug} not found` });
    }

    const fields = Array.isArray(page.fields) ? page.fields : [];
    const payload: Record<string, any> = {
      formSlug,
      ...data,
    };

    // Keep only provided field values and normalize obvious structure
    for (const field of fields) {
      const fieldName = typeof field === "string" ? field : field?.name;
      if (!fieldName) continue;
      const value = payload[fieldName];
      if (value === undefined || value === null) continue;
      payload[fieldName] = value;
    }

    const userId = (req as any).user.id;

    const saved = await createDynamicRecord({
      appId,
      entityName: formSlug,
      userId,
      data: payload,
    });

    res.status(201).json({ success: true, record: saved });
  } catch (error) {
    next(error);
  }
});

export default router;