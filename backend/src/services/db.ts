import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const dbPath = path.resolve(process.cwd(), ".data", "local_db.json");

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

interface LocalDb {
  appRegistry: Record<string, { config: any; userId?: string | null }>;
  appSnapshots: Record<string, { id: string; name: string, description: string, config: any; createdAt: string }[]>;
  dynamicRecords: Record<string, any[]>;
  signups: Array<{
    id: string;
    email: string;
    userId: string | null;
    provider: string;
    metadata: Record<string, any>;
    createdAt: string;
  }>;
}

function readDb(): LocalDb {
  try {
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, "utf-8");
      const parsed = JSON.parse(data);
      return {
        appRegistry: parsed.appRegistry || {},
        appSnapshots: parsed.appSnapshots || {},
        dynamicRecords: parsed.dynamicRecords || {},
        signups: parsed.signups || []
      };
    }
  } catch (e) {
    console.error("Error reading local db", e);
  }
  return { appRegistry: {}, appSnapshots: {}, dynamicRecords: {}, signups: [] };
}

function writeDb(db: LocalDb) {
  try {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf-8");
  } catch (e) {
    console.error("Error writing local db", e);
  }
}

function getDynamicTableName(appId: string, entity: string): string {
  const shortId = String(appId).replace(/-/g, "").slice(0, 8);
  const safeEntity = String(entity).toLowerCase().replace(/[^a-z0-9]/g, "_");
  return `app_${shortId}_${safeEntity}`;
}

function fieldTypeToPg(type: string): string {
  const map: Record<string, string> = {
    text: "TEXT",
    textarea: "TEXT",
    email: "TEXT",
    url: "TEXT",
    phone: "TEXT",
    number: "NUMERIC",
    boolean: "BOOLEAN",
    date: "TIMESTAMPTZ",
    datetime: "TIMESTAMPTZ",
    select: "TEXT",
    multiselect: "TEXT",
    json: "JSONB",
  };
  return map[type] || "TEXT";
}

function saveRecordLocal(appId: string, entity: string, data: any): any {
  const key = `${appId}_${entity}`;
  const record = {
    id: crypto.randomUUID(),
    app_id: appId,
    entity,
    ...data,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const db = readDb();
  if (!db.dynamicRecords[key]) db.dynamicRecords[key] = [];
  db.dynamicRecords[key].push(record);
  writeDb(db);
  return record;
}

function fetchRecordsLocal(appId: string, entity: string): any[] {
  const key = `${appId}_${entity}`;
  const db = readDb();
  return db.dynamicRecords[key] || [];
}

async function ensureEntityTable(appId: string, entity: string, fields: any[]): Promise<void> {
  if (!supabase) return;
  const tableName = getDynamicTableName(appId, entity);

  const columns = [
    'id UUID PRIMARY KEY DEFAULT gen_random_uuid()',
    'app_id TEXT NOT NULL',
    'entity TEXT NOT NULL',
    ...(fields || [])
      .filter((f: any) => f?.name)
      .map((f: any) => `"${f.name}" ${fieldTypeToPg(f.type)}`),
    'created_at TIMESTAMPTZ DEFAULT NOW()',
    'updated_at TIMESTAMPTZ DEFAULT NOW()'
  ];

  const sql = `CREATE TABLE IF NOT EXISTS "${tableName}" (${columns.join(", ")});`;
  const { error } = await supabase.rpc("exec_sql", { query: sql });
  if (error) {
    throw error;
  }
}

async function saveDynamicRecord(appId: string, entity: string, data: Record<string, any>, fields: any[]): Promise<any> {
  if (!supabase) {
    return saveRecordLocal(appId, entity, data);
  }

  const tableName = getDynamicTableName(appId, entity);
  const record = {
    app_id: appId,
    entity,
    ...data,
  };

  let insert = await supabase.from(tableName).insert(record).select().single();
  if (insert.error?.code === "42P01") {
    await ensureEntityTable(appId, entity, fields);
    insert = await supabase.from(tableName).insert(record).select().single();
  }

  if (insert.error) {
    console.warn(`Supabase dynamic insert failed for ${tableName}, using local fallback`, insert.error.message);
    return saveRecordLocal(appId, entity, data);
  }

  return insert.data;
}

async function fetchDynamicRecords(
  appId: string,
  entity: string,
  options: { page?: number; limit?: number; search?: string; sort?: string; order?: string },
  searchableFields: string[]
): Promise<{ records: any[]; total: number }> {
  const page = options.page || 1;
  const limit = options.limit || 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  if (!supabase) {
    let records = fetchRecordsLocal(appId, entity);
    const search = options.search?.toLowerCase();
    if (search) {
      records = records.filter((r) => searchableFields.some((f) => String(r[f] || "").toLowerCase().includes(search)));
    }
    return { records: records.slice(from, to + 1), total: records.length };
  }

  const tableName = getDynamicTableName(appId, entity);
  let query = supabase
    .from(tableName)
    .select("*", { count: "exact" })
    .eq("app_id", appId)
    .range(from, to);

  if (options.sort) {
    query = query.order(options.sort, { ascending: options.order !== "desc" });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data, error, count } = await query;
  const localRecords = fetchRecordsLocal(appId, entity);
  if (error?.code === "42P01") {
    return { records: localRecords.slice(from, to + 1), total: localRecords.length };
  }
  if (error) {
    throw error;
  }

  let records = data || [];
  if (records.length === 0 && localRecords.length > 0) {
    records = localRecords;
  }
  const search = options.search?.toLowerCase();
  if (search && searchableFields.length > 0) {
    records = records.filter((r: any) => searchableFields.some((f) => String(r[f] || "").toLowerCase().includes(search)));
  }

  return { records, total: count || 0 };
}

async function updateDynamicRecord(
  appId: string,
  entity: string,
  id: string,
  updates: Record<string, any>
): Promise<any | null> {
  if (!supabase) {
    const key = `${appId}_${entity}`;
    const db = readDb();
    const list = db.dynamicRecords[key] || [];
    const index = list.findIndex((r) => r.id === id);
    if (index === -1) return null;
    list[index] = { ...list[index], ...updates, updated_at: new Date().toISOString() };
    db.dynamicRecords[key] = list;
    writeDb(db);
    return list[index];
  }

  const tableName = getDynamicTableName(appId, entity);
  const payload = { ...updates, updated_at: new Date().toISOString() };
  const { data, error } = await supabase.from(tableName).update(payload).eq("id", id).eq("app_id", appId).select().single();
  if (error?.code === "42P01") return null;
  if (error) throw error;
  return data;
}

async function deleteDynamicRecord(appId: string, entity: string, id: string): Promise<void> {
  if (!supabase) {
    const key = `${appId}_${entity}`;
    const db = readDb();
    db.dynamicRecords[key] = (db.dynamicRecords[key] || []).filter((r) => r.id !== id);
    writeDb(db);
    return;
  }

  const tableName = getDynamicTableName(appId, entity);
  const { error } = await supabase.from(tableName).delete().eq("id", id).eq("app_id", appId);
  if (error?.code !== "42P01" && error) {
    throw error;
  }
}

export const localDb = {
  getDynamicTableName,
  fieldTypeToPg,
  ensureEntityTable,
  saveDynamicRecord,
  fetchDynamicRecords,
  updateDynamicRecord,
  deleteDynamicRecord,
  async getApp(appId: string) {
    if (supabase) {
      const { data, error } = await supabase.from("app_registry").select("config").eq("app_id", appId).single();
      if (!error && data) return data.config;
      if (error) console.warn("supabase error:", error);
    }
    const db = readDb();
    return db.appRegistry[appId]?.config || null;
  },
  async setApp(appId: string, config: any, userId?: string | null) {
    if (supabase) {
      const payload: any = { app_id: appId, config };
      if (userId) payload.user_id = userId;
      const { error } = await supabase.from("app_registry").upsert(payload);
      if (error) console.warn("supabase error:", error);
    }
    const db = readDb();
    db.appRegistry[appId] = { config, userId };
    writeDb(db);
  },
  async getApps(userId?: string) {
    if (supabase) {
      let query = supabase.from("app_registry").select("config");
      if (userId) query = query.eq("user_id", userId);
      const { data, error } = await query;
      if (!error && data) return data.map(row => row.config);
      if (error) console.warn("supabase error:", error);
    }
    const db = readDb();
    return Object.values(db.appRegistry)
      .filter(app => !userId || app.userId === userId)
      .map(app => app.config);
  },
  async saveSnapshot(appId: string, name: string, description: string, config: any) {
    const id = Date.now().toString();
    if (supabase) {
      const { error } = await supabase.from("app_snapshots").insert({
        id, app_id: appId, name, description, config
      });
      if (error) console.warn("supabase error:", error);
    }
    const db = readDb();
    if (!db.appSnapshots[appId]) db.appSnapshots[appId] = [];
    db.appSnapshots[appId].push({
      id,
      name,
      description,
      config,
      createdAt: new Date().toISOString()
    });
    writeDb(db);
    return id;
  },
  async getSnapshots(appId: string) {
    if (supabase) {
      const { data, error } = await supabase.from("app_snapshots").select("*").eq("app_id", appId);
      if (!error && data) return data;
      if (error) console.warn("supabase error:", error);
    }
    const db = readDb();
    return db.appSnapshots[appId] || [];
  },
  async deleteSnapshot(appId: string, snapshotId: string) {
    if (supabase) {
      const { error } = await supabase.from("app_snapshots").delete().eq("id", snapshotId).eq("app_id", appId);
      if (error) console.warn("supabase error:", error);
    }
    const db = readDb();
    if (db.appSnapshots[appId]) {
      db.appSnapshots[appId] = db.appSnapshots[appId].filter(s => s.id !== snapshotId);
      writeDb(db);
    }
  },
  async deleteApp(appId: string) {
    if (supabase) {
      const { error } = await supabase.from("app_registry").delete().eq("app_id", appId);
      if (error) console.warn("supabase error:", error);
    }
    const db = readDb();
    delete db.appRegistry[appId];
    writeDb(db);
  },
  async saveSignup(record: { email: string; userId: string | null; provider: string; metadata?: Record<string, any> }) {
    const signup = {
      id: crypto.randomUUID(),
      email: record.email,
      userId: record.userId,
      provider: record.provider,
      metadata: record.metadata || {},
      createdAt: new Date().toISOString(),
    };

    const db = readDb();
    db.signups.push(signup);
    writeDb(db);
    return signup;
  },
  async getSignups() {
    const db = readDb();
    return db.signups;
  },
  async getRecords(tableName: string) {
    if (supabase) {
      const { data, error } = await supabase.from("dynamic_records").select("record").eq("table_name", tableName);
      if (!error && data) return data.map(r => r.record);
      if (error) console.warn("supabase error:", error);
    }
    const db = readDb();
    return db.dynamicRecords[tableName] || [];
  },
  async setRecords(tableName: string, records: any[]) {
    if (supabase) {
      const { error: deleteError } = await supabase.from("dynamic_records").delete().eq("table_name", tableName);
      if (deleteError) console.warn("supabase error:", deleteError);
      if (records.length > 0) {
        const { error: insertError } = await supabase.from("dynamic_records").insert(
          records.map(r => ({ table_name: tableName, record: r }))
        );
        if (insertError) console.warn("supabase error:", insertError);
      }
    }
    const db = readDb();
    db.dynamicRecords[tableName] = records;
    writeDb(db);
  }
};
