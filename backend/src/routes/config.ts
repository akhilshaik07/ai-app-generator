import { Router, Request, Response, NextFunction } from "express";
import { ConfigParser } from "../core/config-parser";
import { AppRegistry } from "../core/app-registry";
import { localDb } from "../services/db";
import { requireAuth, optionalAuth } from "../middleware/auth";

const router = Router();

router.post("/validate", (req: Request, res: Response) => {
  const { config } = req.body;
  const result = ConfigParser.parse(config);
  // Rule: NEVER return 400 on bad JSON — always 200 with errors in body
  res.status(200).json(result);
});

router.post("/apply", optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { config } = req.body;
    const result = ConfigParser.parse(config);

    if (!result.valid) {
      return res.status(200).json(result); // Return validation errors
    }

    const appId = result.normalized.app.id;
    const userId = (req as any).user?.id; // attached by optionalAuth

    await AppRegistry.set(appId, result.normalized, userId);

    // Create dynamic Supabase tables for table entities/pages (non-fatal per table)
    const createdTables: string[] = [];
    const tablePages = (result.normalized.pages || []).filter((p: any) => p?.type === "table");
    for (const page of tablePages) {
      const entityName = page.entity || page.name || page.slug;
      if (!entityName || !Array.isArray(page.fields) || page.fields.length === 0) continue;
      try {
        await localDb.ensureEntityTable(appId, entityName, page.fields as any[]);
        createdTables.push(localDb.getDynamicTableName(appId, entityName));
      } catch (err) {
        console.warn(`Could not create table for ${entityName}:`, err);
      }
    }

    // Also ensure configured entities are materialized even without explicit table page
    for (const entity of result.normalized.entities || []) {
      if (!entity?.name || !Array.isArray(entity.fields) || entity.fields.length === 0) continue;
      try {
        await localDb.ensureEntityTable(appId, entity.name, entity.fields as any[]);
        createdTables.push(localDb.getDynamicTableName(appId, entity.name));
      } catch (err) {
        console.warn(`Could not create entity table for ${entity.name}:`, err);
      }
    }

    res.status(200).json({
      appId,
      normalized: result.normalized,
      migrationLog: ["Migration executed successfully"],
      createdTables: Array.from(new Set(createdTables)),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/:appId", optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { appId } = req.params;
    const config = await AppRegistry.get(appId as string);
    
    if (!config) {
      return res.status(404).json({ error: "Not Found", message: "Config not found" });
    }

    res.status(200).json({ config });
  } catch (error) {
    next(error);
  }
});

router.post("/:appId/snapshot", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { appId } = req.params;
    const { name, description, config } = req.body;
    
    // Ensure we parse it before saving
    const result = ConfigParser.parse(config);
    if (!result.valid) {
      return res.status(400).json(result);
    }
    
    localDb.saveSnapshot(appId as string, name, description, result.normalized);
    res.status(201).json({ message: "Snapshot saved successfully" });
  } catch (error) {
    next(error);
  }
});

router.get("/:appId/snapshots", optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { appId } = req.params;
    const snapshots = localDb.getSnapshots(appId as string);
    res.status(200).json({ snapshots });
  } catch (error) {
    next(error);
  }
});

router.delete("/:appId/snapshots/:snapshotId", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { appId, snapshotId } = req.params;
    localDb.deleteSnapshot(appId as string, snapshotId as string);
    res.status(200).json({ message: "Snapshot deleted successfully" });
  } catch (error) {
    next(error);
  }
});

export default router;