import { Router, Request, Response, NextFunction } from "express";
import { AppRegistry } from "../core/app-registry";
import { requireAuth } from "../middleware/auth";
import {
  createDynamicRecord,
  getDynamicRecords,
  updateDynamicRecord,
  deleteDynamicRecord,
} from "../services/dynamic-records";

const router = Router();

// This generic route handles all entities.
// All routes require authentication — every record is scoped to user_id.
router.get("/:appId/:entity", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { appId, entity } = req.params as { appId: string, entity: string };
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = (req.query.search as string) || "";
    const userId = (req as any).user.id;

    // Get config to determine searchable fields
    const config = await AppRegistry.get(appId);
    const entityConfig = config?.entities.find(e => e.name === entity);
    const searchableFields = entityConfig?.fields
      ?.filter(f => !f.hidden && (f.type === "text" || f.type === "email" || f.type === "textarea"))
      .map(f => f.name) || [];

    // Get from Supabase dynamic_records
    const { records, total } = await getDynamicRecords({
      appId,
      entityName: entity,
      userId,
      page,
      limit,
      search: search || undefined,
      searchableFields,
      sort: req.query.sort as string | undefined,
      order: req.query.order as string | undefined,
    });

    const totalPages = Math.ceil(total / limit);

    console.log(`[GET /dynamic] appId=${appId}, entity=${entity}, userId=${userId}, page=${page}, limit=${limit}, total=${total}, records=${records?.length || 0}`);

    return res.json({
      success: true,
      data: records || [],
      total,
      totalPages,
      page,
      limit,
    });
  } catch (error: any) {
    console.error('GET dynamic error:', error);
    // NEVER return 500 for missing table
    // Return empty array instead:
    return res.json({
      success: true,
      data: [],
      total: 0,
      totalPages: 1,
      page: 1,
      limit: 20,
    });
  }
});

router.post("/:appId/:entity", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { appId, entity } = req.params as { appId: string, entity: string };
    const config = await AppRegistry.get(appId);
    if (!config) return res.status(404).json({ error: "Not Found", message: "App not found" });

    const entityConfig = config.entities.find(e => e.name === entity);
    if (!entityConfig) return res.status(404).json({ error: "Not Found", message: `Entity ${entity} not found` });

    const userId = (req as any).user.id;

    console.log(`[POST /dynamic] appId=${appId}, entity=${entity}, userId=${userId}, body=`, JSON.stringify(req.body));

    // Save to Supabase dynamic_records
    const saved = await createDynamicRecord({
      appId,
      entityName: entity,
      userId,
      data: req.body,
    });
    
    console.log(`[POST /dynamic] Successfully saved record:`, JSON.stringify(saved));

    return res.status(201).json({ 
      success: true, 
      data: saved 
    });
  } catch (error: any) {
    console.error('POST dynamic error:', error);
    return res.status(500).json({ error: error.message });
  }
});

router.put("/:appId/:entity/:id", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { appId, entity, id } = req.params as { appId: string, entity: string, id: string };
        const config = await AppRegistry.get(appId);
        if (!config) return res.status(404).json({ error: "Not Found", message: "App not found" });
    
        const entityConfig = config.entities.find(e => e.name === entity);
        if (!entityConfig) return res.status(404).json({ error: "Not Found", message: `Entity ${entity} not found` });

        const userId = (req as any).user.id;

        const updates: Record<string, any> = {};
    
        for (const field of entityConfig.fields) {
          if (req.body[field.name] !== undefined) {
             let val = req.body[field.name];
             if (val !== null && val !== "") {
                 if (field.type === "number") updates[field.name] = Number(val);
                 else if (field.type === "boolean") updates[field.name] = Boolean(val);
                 else updates[field.name] = val;
             }
          }
        }

        const updated = await updateDynamicRecord(id, updates, userId);
        if (!updated) {
          return res.status(404).json({ error: "Not Found", message: "Record not found" });
        }

        res.status(200).json(updated);
      } catch (error) {
        next(error);
      }
});

router.delete("/:appId/:entity/:id", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { appId, entity, id } = req.params as { appId: string, entity: string, id: string };
        const userId = (req as any).user.id;
      await deleteDynamicRecord(id, userId);
        res.status(204).send();
    } catch(err) {
        next(err);
    }
});

export default router;