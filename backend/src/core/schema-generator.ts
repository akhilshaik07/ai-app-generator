import { EntityConfig, FieldConfig, FieldType } from "../types";
import { SupabaseClient } from "@supabase/supabase-js";

export class SchemaGenerator {
  static generateCreateTable(entity: EntityConfig, appId: string): string {
    const tableName = `app_${appId.replace(/-/g, '_')}_${entity.name}`;
    
    const lines = [
      `CREATE TABLE IF NOT EXISTS "${tableName}" (`,
      `  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),`
    ];

    entity.fields.forEach(field => {
      const sqlDef = this.fieldToSql(field);
      lines.push(`  "${field.name}" ${sqlDef},`);
    });

    if (entity.timestamps !== false) {
      lines.push(`  "created_at" TIMESTAMPTZ DEFAULT NOW(),`);
      lines.push(`  "updated_at" TIMESTAMPTZ DEFAULT NOW(),`);
    }

    // Remove trailing comma from the last element
    lines[lines.length - 1] = lines[lines.length - 1].replace(/,$/, '');
    
    lines.push(`);`);
    return lines.join('\n');
  }

  private static fieldToSql(field: FieldConfig): string {
    let sql = 'TEXT';
    switch (field.type) {
      case 'number': sql = 'NUMERIC'; break;
      case 'boolean': sql = 'BOOLEAN DEFAULT false'; break;
      case 'date': sql = 'DATE'; break;
      case 'datetime': sql = 'TIMESTAMPTZ'; break;
      case 'json': sql = 'JSONB'; break;
      case 'text':
      case 'textarea':
      case 'email':
      case 'url':
      case 'select':
      case 'multiselect':
      case 'file':
      case 'upload':
      case 'richtext':
      case 'html':
      case 'relation':
      case 'calendar':
      default:
        sql = 'TEXT';
        break;
    }

    if (field.required && typeof field.default === 'undefined') {
      sql += ' NOT NULL';
    } else if (field.required && typeof field.default !== 'undefined') {
      // Just applying a default implies we can set it, won't strictly NOT NULL if we handle it in API
      // But let's follow the requirement:
      sql += ' NOT NULL';
    }

    if (field.unique) {
      sql += ' UNIQUE';
    }

    if (typeof field.default !== 'undefined') {
      if (typeof field.default === 'string') {
        sql += ` DEFAULT '${field.default.replace(/'/g, "''")}'`;
      } else if (typeof field.default === 'boolean') {
        sql += ` DEFAULT ${field.default ? 'true' : 'false'}`;
      } else if (typeof field.default === 'number') {
        sql += ` DEFAULT ${field.default}`;
      }
    }

    return sql;
  }

  static async migrateEntity(entity: EntityConfig, appId: string, supabase: SupabaseClient): Promise<void> {
    const sql = this.generateCreateTable(entity, appId);
    // Since Supabase JS API doesn't have a direct "execute raw SQL" method nicely exposed without RPC
    // We expect the user to have set up an RPC 'exec_sql' or we just use postgres extensions.
    // However, in standard Supabase, we can use the RPC function `exec_sql(query text)` if created.
    // Assuming backend runs with service_role, we might need a workaround. For now, executing via RPC:
    const { error } = await supabase.rpc('exec_sql', { query: sql });
    if (error) {
      console.error(`Error migrating entity ${entity.name}:`, error);
      throw error;
    }
  }

  static async addColumn(tableName: string, field: FieldConfig, supabase: SupabaseClient): Promise<void> {
    const sqlDef = this.fieldToSql(field);
    const sql = `ALTER TABLE "${tableName}" ADD COLUMN IF NOT EXISTS "${field.name}" ${sqlDef};`;
    const { error } = await supabase.rpc('exec_sql', { query: sql });
    if (error) {
      console.error(`Error adding column ${field.name} to ${tableName}:`, error);
      throw error;
    }
  }

  static async dropAppTables(appId: string, entities: EntityConfig[], supabase: SupabaseClient): Promise<void> {
    const safeAppId = appId.replace(/-/g, '_');
    for (const entity of entities) {
      const tableName = `app_${safeAppId}_${entity.name}`;
      const sql = `DROP TABLE IF EXISTS "${tableName}" CASCADE;`;
      await supabase.rpc('exec_sql', { query: sql });
    }
  }
}