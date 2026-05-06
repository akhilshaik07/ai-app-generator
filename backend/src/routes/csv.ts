import { Router, Request, Response, NextFunction } from "express";
import { AppRegistry } from "../core/app-registry";
import { localDb } from "../services/db";
import multer from "multer";
import Papa from "papaparse";
import { requireAuth, optionalAuth } from "../middleware/auth";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

// Quick in-memory store for CSV sessions
const csvSessions = new Map<string, { rows: any[], expiresAt: number }>();

router.post("/upload/:appId/:entity", optionalAuth, upload.single("file"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const csvData = req.file.buffer.toString('utf8');
    
    Papa.parse(csvData, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const sessionId = crypto.randomUUID();
        const rows = results.data;
        const columns = results.meta.fields || [];
        
        csvSessions.set(sessionId, {
          rows,
          expiresAt: Date.now() + 10 * 60 * 1000 // 10 min
        });

        res.status(200).json({
          sessionId,
          columns,
          preview: rows.slice(0, 5)
        });
      },
      error: (error: any) => {
        next(new Error(`Failed to parse CSV: ${error.message}`));
      }
    });
  } catch (error) {
    next(error);
  }
});

router.post("/import/:appId/:entity", optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { appId, entity } = req.params as { appId: string, entity: string };
        const { sessionId, columnMapping } = req.body; // array of { csvColumn, entityField }

        const session = csvSessions.get(sessionId);
        if (!session || Date.now() > session.expiresAt) {
            return res.status(400).json({ error: "session_expired", message: "CSV session expired or invalid" });
        }

        const config = await AppRegistry.get(appId);
        if (!config) return res.status(404).json({ error: "Not Found", message: "App not found" });

        const entityConfig = config.entities.find(e => e.name === entity);
        if (!entityConfig) return res.status(404).json({ error: "Not Found", message: `Entity ${entity} not found` });

        const tableName = `app_${appId.replace(/-/g, '_')}_${entity}`;
        const mappingObj = columnMapping.reduce((acc: any, curr: any) => {
            acc[curr.csvColumn] = curr.entityField;
            return acc;
        }, {});

        const validRows: any[] = [];
        const errors: any[] = [];
        
        const now = new Date().toISOString();

        session.rows.forEach((row, rowIndex) => {
            const transformedRow: any = {
               id: crypto.randomUUID()
            };
            if (entityConfig.timestamps !== false) {
               transformedRow.created_at = now;
               transformedRow.updated_at = now;
            }

            let isValid = true;
            let reason = "";

            for (const field of entityConfig.fields) {
               // Try to find matching column
               const csvCol = Object.keys(mappingObj).find(k => mappingObj[k] === field.name);
               let val = csvCol ? row[csvCol] : undefined;

               if (val !== undefined && val !== null && val !== "") {
                  // coerce
                  if (field.type === "number") {
                      const num = Number(val);
                      if (isNaN(num)) {
                         isValid = false; reason = `Invalid number for ${field.name}`; break;
                      }
                      transformedRow[field.name] = num;
                  } else if (field.type === "boolean") {
                      transformedRow[field.name] = ['true', '1', 'yes'].includes(String(val).toLowerCase());
                  } else {
                      transformedRow[field.name] = val;
                  }
               } else if (field.required && typeof field.default === "undefined") {
                   isValid = false; reason = `Missing required field ${field.name}`; break;
               }
            }

            if (isValid) {
                validRows.push(transformedRow);
            } else {
                errors.push({ row: rowIndex + 2, reason }); // +2 because 0 index + header row
            }
        });

        if (validRows.length > 0) {
            const records = await localDb.getRecords(tableName);
            records.push(...validRows);
            await localDb.setRecords(tableName, records);
        }

        // Cleanup
        csvSessions.delete(sessionId);

        res.status(200).json({
            imported: validRows.length,
            skipped: errors.length,
            errors
        });
    } catch(error) {
        next(error);
    }
});

export default router;