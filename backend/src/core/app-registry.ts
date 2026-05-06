import { AppConfig } from "../types";
import { localDb } from "../services/db";

export class AppRegistry {
  private static configs: Map<string, AppConfig> = new Map();

  static async set(appId: string, config: AppConfig, userId?: string | null): Promise<void> {
    this.configs.set(appId, config);
    await localDb.setApp(appId, config, userId);
  }

  static async get(appId: string): Promise<AppConfig | null> {
    if (this.configs.has(appId)) {
      return this.configs.get(appId)!;
    }
    const config = await localDb.getApp(appId) as AppConfig | null;
    if (config) {
      this.configs.set(appId, config);
    }
    return config;
  }

  static async listByUser(userId: string): Promise<AppConfig[]> {
    return await localDb.getApps(userId);
  }

  static async delete(appId: string): Promise<void> {
    this.configs.delete(appId);
    await localDb.deleteApp(appId);
  }
}
