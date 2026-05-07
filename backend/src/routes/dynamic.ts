import { Router, Request, Response, NextFunction } from "express";
import { AppRegistry } from "../core/app-registry";
import { localDb } from "../services/db";

const router = Router();

// This generic route handles all entities.
router.get("/:appId/:entity", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { appId, entity } = req.params as { appId: string, entity: string };
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = (req.query.search as string) || "";

    // Get config to determine searchable fields
    const config = await AppRegistry.get(appId);
    const entityConfig = config?.entities.find(e => e.name === entity);
    const searchableFields = entityConfig?.fields
      ?.filter(f => !f.hidden && (f.type === "text" || f.type === "email" || f.type === "string"))
      .map(f => f.name) || [];

    // Get from localDb
    const { records, total } = await localDb.fetchDynamicRecords(
      appId,
      entity,
      {
        page,
        limit,
        search: search || undefined,
        sort: req.query.sort as string | undefined,
        order: req.query.order as string | undefined,
      },
      searchableFields
    );

    const totalPages = Math.ceil(total / limit);

    console.log(`[GET /dynamic] appId=${appId}, entity=${entity}, page=${page}, limit=${limit}, total=${total}, records=${records?.length || 0}`);

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

router.post("/:appId/:entity", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { appId, entity } = req.params as { appId: string, entity: string };
    const config = await AppRegistry.get(appId);
    if (!config) return res.status(404).json({ error: "Not Found", message: "App not found" });

    const entityConfig = config.entities.find(e => e.name === entity);
    if (!entityConfig) return res.status(404).json({ error: "Not Found", message: `Entity ${entity} not found` });

    const record = {
      id: crypto.randomUUID(),
      app_id: appId,
      entity: entity,
      ...req.body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log(`[POST /dynamic] appId=${appId}, entity=${entity}, recordId=${record.id}, body=`, JSON.stringify(req.body));

    // Save to localDb (already working)
    const saved = await localDb.saveDynamicRecord(appId, entity, record, entityConfig.fields);
    
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

router.put("/:appId/:entity/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { appId, entity, id } = req.params as { appId: string, entity: string, id: string };
        const config = await AppRegistry.get(appId);
        if (!config) return res.status(404).json({ error: "Not Found", message: "App not found" });
    
        const entityConfig = config.entities.find(e => e.name === entity);
        if (!entityConfig) return res.status(404).json({ error: "Not Found", message: `Entity ${entity} not found` });

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

        const updated = await localDb.updateDynamicRecord(appId, entity, id, updates);
        if (!updated) {
          return res.status(404).json({ error: "Not Found", message: "Record not found" });
        }

        res.status(200).json(updated);
      } catch (error) {
        next(error);
      }
});

router.delete("/:appId/:entity/:id", async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { appId, entity, id } = req.params as { appId: string, entity: string, id: string };
      await localDb.deleteDynamicRecord(appId, entity, id);
        res.status(204).send();
    } catch(err) {
        next(err);
    }
});

export default router;