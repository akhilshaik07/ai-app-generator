import { Router, Request, Response, NextFunction } from "express";
import { AppRegistry } from "../core/app-registry";
import { localDb } from "../services/db";

const router = Router();

const getFormStorageKey = (appId: string, formSlug: string) => `form_${appId.replace(/-/g, "_")}_${formSlug.replace(/-/g, "_")}`;

router.post("/:appId/:formSlug", async (req: Request, res: Response, next: NextFunction) => {
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
      id: crypto.randomUUID(),
      formSlug,
      created_at: new Date().toISOString(),
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

    const storageKey = getFormStorageKey(appId, formSlug);
    const records = await localDb.getRecords(storageKey);
    records.push(payload);
    await localDb.setRecords(storageKey, records);

    res.status(201).json({ success: true, record: payload });
  } catch (error) {
    next(error);
  }
});

export default router;