export interface AppConfig {
  name?: string;
  app: AppMeta;
  auth?: AuthConfig;
  theme?: ThemeOverride;
  i18n?: I18nConfig;
  notifications?: NotificationsConfig;
  pages?: PageConfig[];
  entities: EntityConfig[];
  views: ViewConfig[];
}

export interface AppMeta {
  id: string;
  name: string;
  description?: string;
  version?: string;
}

export interface NotificationsConfig {
  enabled: boolean;
  events?: string[];
}

export interface AuthConfig {
  enabled: boolean;
  provider: "email" | "oauth_github" | "magic_link";
  protect?: string[];
}

export interface ThemeOverride {
  primaryColor?: string;
  fontFamily?: string;
  logoUrl?: string;
}

export interface I18nConfig {
  defaultLocale: string;
  supportedLocales: string[];
  translations?: Record<string, Record<string, string>>;
}

export interface EntityConfig {
  name: string;
  label?: string;
  fields: FieldConfig[];
  timestamps?: boolean;
}

export interface PageConfig {
  id?: string;
  slug?: string;
  name?: string;
  title?: string;
  type: ViewType;
  entity?: string;
  label?: string;
  fields?: FieldConfig[] | string[];
  actions?: ActionConfig[];
  layout?: LayoutHint;
  timestamps?: boolean;
}

export interface FieldConfig {
  name: string;
  label?: string;
  type: FieldType;
  required?: boolean;
  default?: unknown;
  options?: string[];
  min?: number;
  max?: number;
  unique?: boolean;
  hidden?: boolean;
}

export type FieldType =
  | "text" | "textarea" | "number" | "boolean"
  | "date" | "datetime" | "email" | "url"
  | "select" | "multiselect" | "file" | "json"
  | "relation" | "calendar" | "upload" | "richtext" | "html";

export interface ViewConfig {
  id: string;
  title: string;
  type: ViewType;
  entity?: string;
  fields?: string[];
  actions?: ActionConfig[];
  layout?: LayoutHint;
}

export type ViewType =
  | "form" | "table" | "dashboard" | "auth" | "kanban" | "unknown";

export interface ActionConfig {
  label: string;
  type: "create" | "edit" | "delete" | "export_csv" | "import_csv" | "custom";
  endpoint?: string;
  confirm?: boolean;
}

export interface LayoutHint {
  columns?: number;
  dense?: boolean;
  showSearch?: boolean;
  showFilters?: boolean;
  pageSize?: number;
}

export interface ConfigValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  normalized: AppConfig;
}

export interface ValidationError {
  path: string;
  message: string;
  severity: "error" | "warning";
}

export interface ValidationWarning {
  path: string;
  message: string;
  suggestion?: string;
}
