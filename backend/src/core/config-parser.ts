import {
  AppConfig,
  ConfigValidationResult,
  ValidationError,
  ValidationWarning,
  FieldType,
  ViewType,
  EntityConfig,
  ViewConfig,
} from "../types";

export class ConfigParser {
  private static lastRaw: string | null = null;
  private static lastResult: ConfigValidationResult | null = null;

  static parse(raw: unknown): ConfigValidationResult {
    if (typeof raw === "string" && raw === this.lastRaw && this.lastResult) {
      return this.lastResult;
    }

    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let parsed: any = {};

    if (typeof raw === "string") {
      try {
        parsed = JSON.parse(raw);
      } catch (e) {
        try {
          const repaired = ConfigParser.repairJSON(raw);
          parsed = JSON.parse(repaired);
        } catch (repairError) {
          errors.push({
            path: "root",
            message: "Invalid JSON format. Could not parse.",
            severity: "error",
          });
          return { valid: false, errors, warnings, normalized: this.createEmptyConfig() };
        }
      }
    } else if (typeof raw === "object" && raw !== null) {
      parsed = raw;
    } else {
      errors.push({
        path: "root",
        message: "Config must be a JSON object.",
        severity: "error",
      });
      return { valid: false, errors, warnings, normalized: this.createEmptyConfig() };
    }

    const normalized = this.normalize(parsed, errors, warnings);
    this.validateReferences(normalized, errors, warnings);

    const result = {
      valid: errors.length === 0,
      errors,
      warnings,
      normalized,
    };

    if (typeof raw === "string") {
      this.lastRaw = raw;
      this.lastResult = result;
    }

    return result;
  }

  static repairJSON(str: string): string {
    let repaired = str;
    // Strip block comments
    repaired = repaired.replace(/\/\*[\s\S]*?\*\//g, "");
    // Strip line comments
    repaired = repaired.replace(/\/\/.*/g, "");
    // Remove trailing commas
    repaired = repaired.replace(/,\s*([\]}])/g, "$1");
    // Quote unquoted keys loosely
    repaired = repaired.replace(/([{,]\s*)([A-Za-z0-9_]+)\s*:/g, '$1"$2":');
    return repaired;
  }

  private static pageSlug(page: any, index: number): string {
    return String(page.slug || page.id || page.name || page.entity || `page_${index + 1}`);
  }

  private static createEmptyConfig(): AppConfig {
    return {
      app: { id: crypto.randomUUID(), name: "Untitled App", version: "1.0.0" },
      pages: [],
      entities: [],
      views: [],
    };
  }

  private static normalize(parsed: any, errors: ValidationError[], warnings: ValidationWarning[]): AppConfig {
    const normalized: AppConfig = this.createEmptyConfig();

    if (!parsed || typeof parsed !== "object") {
      warnings.push({ path: "root", message: "Parsed result was not an object. Resetting." });
      return normalized;
    }

    normalized.app.id = parsed.app?.id || parsed.id || crypto.randomUUID();
    normalized.app.name = parsed.app?.name || parsed.name || "Untitled App";
    normalized.app.description = parsed.app?.description || parsed.description || "";
    normalized.app.version = parsed.app?.version || parsed.version || "1.0.0";
    (normalized as any).name = normalized.app.name;

    if (parsed.auth && typeof parsed.auth === "object") {
      normalized.auth = {
        enabled: !!parsed.auth.enabled,
        provider: parsed.auth.provider || "email",
        protect: Array.isArray(parsed.auth.protect) ? parsed.auth.protect : [],
      };
    }

    if (parsed.theme && typeof parsed.theme === "object") {
      normalized.theme = {
        primaryColor: parsed.theme.primaryColor,
        fontFamily: parsed.theme.fontFamily,
        logoUrl: parsed.theme.logoUrl,
      };
    }

    if (parsed.notifications) {
      normalized.notifications = {
        enabled: !!parsed.notifications.enabled,
        events: Array.isArray(parsed.notifications.events) ? parsed.notifications.events.map(String) : []
      };
    }

    if (parsed.i18n && typeof parsed.i18n === "object") {
      normalized.i18n = {
        defaultLocale: parsed.i18n.defaultLocale || "en",
        supportedLocales: Array.isArray(parsed.i18n.supportedLocales) ? parsed.i18n.supportedLocales : ["en"],
        translations: parsed.i18n.translations || {},
      };
    }

    const rawPages = Array.isArray(parsed.pages) ? parsed.pages : [];
    if (parsed.pages !== undefined && !Array.isArray(parsed.pages)) {
      warnings.push({ path: "pages", message: "Pages must be an array. Coerced to []." });
    }

    if (rawPages.length > 0) {
      normalized.pages = rawPages.map((p: any, index: number) => {
        if (typeof p !== "object" || !p) {
          warnings.push({ path: `pages[${index}]`, message: "Page must be an object. Filtering." });
          return null;
        }

        const slug = this.pageSlug(p, index);
        const pageName = p.name || p.title || p.label || slug;
        const type = this.coercePageType(p.type, warnings, `pages[${index}].type`, slug);
        const fields = Array.isArray(p.fields)
          ? p.fields.map((field: any, fieldIndex: number) => {
            if (typeof field === "string") return field;
            if (typeof field !== "object" || !field || !field.name) {
              warnings.push({
                path: `pages[${index}].fields[${fieldIndex}].name`,
                message: `Field with no name found in "${slug}"`,
              });
              return null;
            }
            return field;
          }).filter(Boolean)
          : undefined;

        return {
          id: String(p.id || slug),
          slug,
          name: String(pageName),
          title: p.title || p.label || pageName,
          type,
          entity: p.entity || (p.type === "table" ? (p.name || p.id || slug) : undefined),
          label: p.label,
          fields,
          actions: Array.isArray(p.actions) ? p.actions : undefined,
          layout: typeof p.layout === "object" ? p.layout : undefined,
          timestamps: p.timestamps,
        };
      }).filter(Boolean) as any;
    }

    const tablePages = (normalized.pages || []).filter((page: any) => page?.type === "table");
    const entitySources = Array.isArray(parsed.entities) ? parsed.entities : tablePages.map((page: any, index: number) => ({
      name: page.entity || page.name || page.id || `table_${index + 1}`,
      label: page.label || page.title || page.name || page.id,
      timestamps: page.timestamps,
      fields: page.fields,
    }));

    if (entitySources.length > 0) {
      normalized.entities = entitySources.map((ent: any, index: number) => {
        if (typeof ent !== "object" || !ent) {
          warnings.push({ path: `entities[${index}]`, message: "Entity must be an object. Filtering." });
          return null;
        }
        if (!ent.name) {
          warnings.push({ path: `entities[${index}].name`, message: "Entity missing name. Skipping." });
          return null;
        }
        
        const entity: EntityConfig = {
          name: ent.name,
          label: ent.label || ent.name,
          timestamps: ent.timestamps !== false,
          fields: Array.isArray(ent.fields) ? ent.fields.map((f: any, fIndex: number) => {
            if (typeof f !== "object" || !f || !f.name) {
              warnings.push({ path: `entities[${index}].fields[${fIndex}]`, message: "Invalid field definition." });
              return null;
            }
            return {
              name: f.name,
              label: f.label || f.name,
              type: this.coerceFieldType(f.type, warnings, `entities[${index}].fields[${fIndex}].type`),
              required: !!f.required,
              default: f.default,
              options: Array.isArray(f.options) ? f.options : [],
              min: typeof f.min === "number" ? f.min : undefined,
              max: typeof f.max === "number" ? f.max : undefined,
              unique: !!f.unique,
              hidden: !!f.hidden,
            };
          }).filter(Boolean) as any : [],
        };
        return entity;
      }).filter(Boolean) as EntityConfig[];
    } else if (parsed.entities !== undefined) {
       warnings.push({ path: "entities", message: "Entities must be an array. Coerced to []." });
    }

    const viewSources = Array.isArray(parsed.views) ? parsed.views : (normalized.pages || []);
    if (viewSources.length > 0) {
      normalized.views = viewSources.map((v: any, index: number) => {
        if (typeof v !== "object" || !v || !v.id) {
          warnings.push({ path: `views[${index}]`, message: "View missing or invalid. Requires valid object with id." });
          return null;
        }

        const coercedType = this.coerceViewType(v.type, warnings, `views[${index}].type`);
        const entity =
          v.entity ||
          (coercedType === "table" ? (v.name || v.id) : undefined) ||
          (coercedType === "form" && normalized.entities.length === 1 ? normalized.entities[0].name : undefined);
        const fields = Array.isArray(v.fields)
          ? v.fields.map((field: any) => typeof field === "string" ? field : field?.name).filter(Boolean)
          : undefined;

        const view: ViewConfig = {
          id: v.id,
          title: v.title || v.label || v.name || v.id,
          type: coercedType,
          entity,
          fields,
          actions: Array.isArray(v.actions) ? v.actions : undefined,
          layout: typeof v.layout === "object" ? v.layout : undefined,
        };
        return view;
      }).filter(Boolean) as ViewConfig[];
    } else if (parsed.views !== undefined) {
      warnings.push({ path: "views", message: "Views must be an array. Coerced to []." });
    }

    return normalized;
  }

  private static validateReferences(config: AppConfig, errors: ValidationError[], warnings: ValidationWarning[]) {
    const validEntities = new Set(config.entities.map(e => e.name));
    
    config.views.forEach((view, index) => {
        if (view.entity && !validEntities.has(view.entity)) {
            errors.push({
                path: `views[${index}].entity`,
                message: `View references non-existent entity: "${view.entity}"`,
                severity: "error",
            });
        }
    });

    const validEntityNames = Array.from(validEntities);
    const hasDupes = validEntityNames.length !== config.entities.length;
    if (hasDupes) {
      const seen = new Set();
      config.entities.forEach((ent, i) => {
        if (seen.has(ent.name)) {
          warnings.push({ path: `entities[${i}].name`, message: `Duplicate entity name: "${ent.name}"` });
        }
        seen.add(ent.name);
      });
      // De-duplicate entities by keeping first occurrence
      const nameSet = new Set();
      config.entities = config.entities.filter(ent => {
        if (!nameSet.has(ent.name)) {
          nameSet.add(ent.name);
          return true;
        }
        return false;
      });
    }
  }

  static coerceFieldType(type: unknown, warnings: ValidationWarning[], path: string): FieldType {
    const validTypes: FieldType[] = [
      "text", "textarea", "number", "boolean", "date", "datetime", "email", 
      "url", "select", "multiselect", "file", "json", "relation",
      "calendar", "upload", "richtext", "html"
    ];
    if (typeof type === "string" && validTypes.includes(type as FieldType)) {
      return type as FieldType;
    }
    warnings.push({ path, message: `Unknown field type: "${type}". Coerced to "text".` });
    return "text";
  }

  static coerceViewType(type: unknown, warnings: ValidationWarning[], path: string): ViewType {
     const validTypes: ViewType[] = [
       "form", "table", "dashboard", "auth", "kanban", "unknown"
     ];
     if (typeof type === "string" && validTypes.includes(type as ViewType)) {
       return type as ViewType;
     }
     warnings.push({ path, message: `Unknown view type: "${type}". Coerced to "unknown".` });
     return "unknown";
  }

  static coercePageType(type: unknown, warnings: ValidationWarning[], path: string, slug: string): ViewType {
     const validTypes: ViewType[] = [
       "form", "table", "dashboard", "auth", "kanban", "unknown"
     ];
     if (typeof type === "string" && validTypes.includes(type as ViewType)) {
       return type as ViewType;
     }
     warnings.push({ path, message: `Page "${slug}" has unknown type "${type}"` });
     return "unknown";
  }
}
