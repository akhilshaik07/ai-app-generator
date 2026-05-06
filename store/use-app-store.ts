import { create } from "zustand";
import { AppConfig, ConfigValidationResult, EntityConfig, PageConfig, ViewConfig } from "../types";
import { normalizeToPages } from "@/lib/config-normalizer";

function unwrapConfig(input: any): any {
  return input?.data?.normalized ?? input?.data?.config ?? input?.normalized ?? input?.config ?? input;
}

function pageId(page: PageConfig, index: number) {
  return String(page.slug || page.id || page.name || page.entity || `page_${index + 1}`);
}

function pageEntityName(page: PageConfig, index: number) {
  return String(page.entity || page.name || page.id || `table_${index + 1}`);
}

function pageToEntity(page: PageConfig, index: number): EntityConfig {
  return {
    name: pageEntityName(page, index),
    label: page.label || page.title || page.name || page.id || pageEntityName(page, index),
    timestamps: page.timestamps !== false,
    fields: Array.isArray(page.fields) && typeof page.fields[0] !== "string" ? page.fields as EntityConfig["fields"] : [],
  };
}

function pageToView(page: PageConfig, index: number, defaultEntity?: string): ViewConfig {
  const id = pageId(page, index);
  const entity =
    page.entity ||
    (page.type === "table" ? pageEntityName(page, index) : undefined) ||
    (page.type === "form" ? defaultEntity : undefined);
  const fields = Array.isArray(page.fields)
    ? page.fields.map((field: any) => typeof field === "string" ? field : field?.name).filter(Boolean)
    : undefined;

  return {
    id,
    title: page.title || page.label || page.name || id,
    type: page.type,
    entity,
    fields,
    actions: page.actions,
    layout: page.layout,
  };
}

function viewToPage(view: ViewConfig): PageConfig {
  return {
    id: view.id,
    slug: view.id,
    title: view.title,
    type: view.type,
    entity: view.entity,
    fields: view.fields,
    actions: view.actions,
    layout: view.layout,
  };
}

function normalizeAppConfig(input: AppConfig | null): AppConfig | null {
  const raw = unwrapConfig(input);
  if (!raw) return null;

  const rawPages = Array.isArray(raw.pages)
    ? raw.pages.map((page: PageConfig, index: number) => ({
      ...page,
      slug: pageId(page, index),
    }))
    : [];
  const tablePages = rawPages.filter((page: PageConfig) => page?.type === "table");
  const entities = Array.isArray(raw.entities) && raw.entities.length > 0
    ? raw.entities
    : tablePages.map(pageToEntity);
  const defaultEntity = entities.length === 1 ? entities[0].name : undefined;
  const views = Array.isArray(raw.views) && raw.views.length > 0
    ? raw.views
    : rawPages.map((page: PageConfig, index: number) => pageToView(page, index, defaultEntity));
  const pages = rawPages.length > 0 ? rawPages : views.map(viewToPage);

  return {
    ...raw,
    name: raw.name ?? raw.app?.name,
    pages,
    entities,
    views,
  };
}

export interface AppStore {
  rawConfig: string;
  parsedConfig: AppConfig | null;
  validationResult: ConfigValidationResult | null;
  activeAppId: string | null;
  isPreviewLoading: boolean;
  editorPanelWidth: number;        // Percentage 20-80, default 40
  activeLocale: string;
  currentPageSlug: string | null;

  // Shell state
  sidebarCollapsed: boolean;
  commandPaletteOpen: boolean;
  mobileMenuOpen: boolean;
  
  // Auth state
  user: any;
  isAuthMenuOpen: boolean;

  setRawConfig: (raw: string) => void;
  setParsedConfig: (config: AppConfig | null) => void;
  setValidationResult: (result: ConfigValidationResult | null) => void;
  setActiveAppId: (id: string | null) => void;
  setIsPreviewLoading: (loading: boolean) => void;
  setEditorPanelWidth: (width: number) => void;
  setActiveLocale: (locale: string) => void;
  setCurrentPage: (slug: string) => void;
  applyConfigLocally: (jsonString: string) => void;

  // Shell actions
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setMobileMenuOpen: (open: boolean) => void;
  
  // Auth actions
  setUser: (user: any) => void;
  setIsAuthMenuOpen: (open: boolean) => void;
  restoreUserActivity: () => Promise<void>;

  getTranslation: (key: string) => string;
}

export const useAppStore = create<AppStore>((set, get) => ({
  rawConfig: "",
  parsedConfig: null,
  validationResult: null,
  activeAppId: null,
  isPreviewLoading: false,
  editorPanelWidth: 40,
  activeLocale: "en",
  currentPageSlug: null,

  // Shell defaults
  sidebarCollapsed: false,
  commandPaletteOpen: false,
  mobileMenuOpen: false,
  
  // Auth defaults
  user: null,
  isAuthMenuOpen: false,

  setRawConfig: (raw) => set({ rawConfig: raw }),
  setParsedConfig: (config) => set((state) => {
    const parsedConfig = normalizeAppConfig(config);
    const pages = parsedConfig?.pages || [];
    const currentPageSlug = pages.some(page => page.slug === state.currentPageSlug)
      ? state.currentPageSlug
      : pages[0]?.slug || null;

    return { parsedConfig, currentPageSlug };
  }),
  setValidationResult: (result) => set({
    validationResult: result
      ? { ...result, normalized: normalizeAppConfig(result.normalized) || result.normalized }
      : null
  }),
  setActiveAppId: (id) => set({ activeAppId: id }),
  setIsPreviewLoading: (loading) => set({ isPreviewLoading: loading }),
  setEditorPanelWidth: (width) => set({ editorPanelWidth: Math.max(20, Math.min(80, width)) }),
  setActiveLocale: (locale) => set({ activeLocale: locale }),
  setCurrentPage: (slug: string) => { set({ currentPageSlug: slug }) },
  applyConfigLocally: (jsonString: string) => {
    try {
      const raw = JSON.parse(jsonString);
      // Normalize multiple config formats (A, B, C) to pages array
      const normalizedPages = normalizeToPages(raw);
      const enrichedRaw = { ...raw, pages: normalizedPages };
      const parsedConfig = normalizeAppConfig(enrichedRaw);
      set((state) => {
        const pages = parsedConfig?.pages || [];
        const currentPageSlug = pages.some((page: any) => page.slug === state.currentPageSlug)
          ? state.currentPageSlug
          : pages[0]?.slug || null;
        
        return { 
          parsedConfig, 
          currentPageSlug,
          // Clear errors on successful parse
          validationResult: { valid: true, errors: [], warnings: [], normalized: parsedConfig as AppConfig }
        };
      });
    } catch (e) {
      // Invalid JSON: do not update parsedConfig, but could set a validation error
      set({
        validationResult: { valid: false, errors: [{ path: "root", message: "Invalid JSON format", severity: "error" }], warnings: [], normalized: {} as AppConfig }
      });
    }
  },

  // Shell actions
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
  
  // Auth actions
  setUser: (user) => set({ user }),
  setIsAuthMenuOpen: (open) => set({ isAuthMenuOpen: open }),
  
  restoreUserActivity: async () => {
    try {
      const { loadUserActivity } = await import("@/lib/services/activity");
      const activity = await loadUserActivity();
      
      if (activity) {
        set({
          activeAppId: activity.appId,
          currentPageSlug: activity.currentPageSlug,
          rawConfig: activity.rawConfig,
          editorPanelWidth: activity.editorPanelWidth,
          sidebarCollapsed: activity.sidebarCollapsed,
        });
        
        // Parse the config
        const get_state = get();
        get_state.applyConfigLocally(activity.rawConfig);
      }
    } catch (error) {
      console.error("Error restoring user activity:", error);
    }
  },

  getTranslation: (key) => {
    const state = get();
    const config = state.parsedConfig;
    if (!config?.i18n?.translations) return key;

    const localeDict = config.i18n.translations[state.activeLocale];
    if (localeDict && localeDict[key]) return localeDict[key];

    const defaultDict = config.i18n.translations[config.i18n.defaultLocale || "en"];
    if (defaultDict && defaultDict[key]) return defaultDict[key];

    return key;
  }
}));
