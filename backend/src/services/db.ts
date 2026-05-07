import fs from "fs";
import path from "path";
import { supabase } from "./supabase";

const dbPath = path.resolve(process.cwd(), ".data", "local_db.json");

interface LocalDb {
  appRegistry: Record<string, { config: any; userId?: string | null }>;
  appSnapshots: Record<string, { id: string; name: string, description: string, config: any; createdAt: string }[]>;
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
        signups: parsed.signups || []
      };
    }
  } catch (e) {
    console.error("Error reading local db", e);
  }
  return { appRegistry: {}, appSnapshots: {}, signups: [] };
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

export const localDb = {
  async getApp(appId: string) {
    const { data, error } = await supabase.from("app_registry").select("config").eq("app_id", appId).single();
    if (!error && data) return data.config;
    if (error) console.warn("supabase error:", error);
    const db = readDb();
    return db.appRegistry[appId]?.config || null;
  },
  async setApp(appId: string, config: any, userId?: string | null) {
    const payload: any = { app_id: appId, config };
    if (userId) payload.user_id = userId;
    const { error } = await supabase.from("app_registry").upsert(payload);
    if (error) console.warn("supabase error:", error);
    const db = readDb();
    db.appRegistry[appId] = { config, userId };
    writeDb(db);
  },
  async getApps(userId?: string) {
    let query = supabase.from("app_registry").select("config");
    if (userId) query = query.eq("user_id", userId);
    const { data, error } = await query;
    if (!error && data) return data.map(row => row.config);
    if (error) console.warn("supabase error:", error);
    const db = readDb();
    return Object.values(db.appRegistry)
      .filter(app => !userId || app.userId === userId)
      .map(app => app.config);
  },
  async saveSnapshot(appId: string, name: string, description: string, config: any) {
    const id = Date.now().toString();
    const { error } = await supabase.from("app_snapshots").insert({
      id, app_id: appId, name, description, config
    });
    if (error) console.warn("supabase error:", error);
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
    const { data, error } = await supabase.from("app_snapshots").select("*").eq("app_id", appId);
    if (!error && data) return data;
    if (error) console.warn("supabase error:", error);
    const db = readDb();
    return db.appSnapshots[appId] || [];
  },
  async deleteSnapshot(appId: string, snapshotId: string) {
    const { error } = await supabase.from("app_snapshots").delete().eq("id", snapshotId).eq("app_id", appId);
    if (error) console.warn("supabase error:", error);
    const db = readDb();
    if (db.appSnapshots[appId]) {
      db.appSnapshots[appId] = db.appSnapshots[appId].filter(s => s.id !== snapshotId);
      writeDb(db);
    }
  },
  async deleteApp(appId: string) {
    const { error } = await supabase.from("app_registry").delete().eq("app_id", appId);
    if (error) console.warn("supabase error:", error);
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
};
