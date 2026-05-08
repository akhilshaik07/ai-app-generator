"use client";

import React, { useMemo } from "react";
import { AppConfig, PageConfig, ViewConfig } from "../../types";
import { AlertTriangle, Globe } from "lucide-react";
import { useAppStore } from "../../store/use-app-store";
import { DynamicForm } from "./DynamicForm";
import { DynamicTable } from "./DynamicTable";
import { DynamicAuth } from "./DynamicAuth";
import { DynamicDashboard } from "./DynamicDashboard";
const DynamicKanban = () => (
  <div className="rounded-[8px] border border-border bg-white p-6 shadow-sm">
    <h2 className="text-base font-semibold text-foreground">Kanban</h2>
    <p className="mt-2 text-sm text-muted-foreground">Kanban view is ready for columns.</p>
  </div>
);

const UnknownViewFallback = ({ view }: any) => (
  <div className="mt-4 flex flex-col items-center justify-center rounded-[8px] border border-[#d7b56d]/50 bg-[#fff8e4] p-8">
    <AlertTriangle className="mb-4 h-12 w-12 text-[#9a5b3f]" />
    <h3 className="mb-2 text-lg font-medium text-foreground">Unknown view type: {view.type}</h3>
    <p className="mb-4 text-sm text-muted-foreground">This component type is not registered yet.</p>
  </div>
);

const UnknownPageRenderer = ({ page }: any) => (
  <div className="p-6">
    <div className="mb-6 flex items-start gap-3 rounded-[8px] border border-[#d7b56d]/50 bg-[#fff8e4] p-4">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#9a5b3f]" />
      <div>
        <div className="font-mono text-sm font-medium text-foreground">
          Unknown page type: &quot;{page.type}&quot;
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          Valid types are table, form, and dashboard.
        </div>
      </div>
    </div>

    <div className="mb-3 font-mono text-xs uppercase text-muted-foreground">
      Raw field data ({page.fields?.length ?? 0} fields)
    </div>
    <div className="space-y-2">
      {page.fields?.filter(Boolean).map((field: any, i: number) => (
        <div key={i} className="flex items-center gap-3 rounded-[8px] border border-border bg-white p-3 font-mono text-xs">
          <span className="w-4 text-muted-foreground">{i + 1}</span>
          <span className="text-foreground">{field.name || "(no name)"}</span>
          <span className="ml-auto rounded bg-[#f4f2ec] px-2 py-0.5 text-[10px] text-muted-foreground">
            {field.type || "unknown"}
          </span>
        </div>
      ))}
    </div>
  </div>
);

const COMPONENT_REGISTRY: Record<string, React.ComponentType<any>> = {
  form: DynamicForm,
  table: DynamicTable,
  auth: DynamicAuth,
  dashboard: DynamicDashboard,
  kanban: DynamicKanban,
  unknown: UnknownViewFallback,
};

function pageToView(page: PageConfig, index: number, existingView?: ViewConfig): ViewConfig {
  const id = String(page.slug || page.id || page.name || page.entity || `page_${index + 1}`);
  const type = page.type || "unknown";
  const entity =
    page.entity ||
    (type === "table" ? String(page.name || page.id || id) : undefined) ||
    existingView?.entity;
  const fields = Array.isArray(page.fields)
    ? page.fields.map((field: any) => typeof field === "string" ? field : field?.name).filter(Boolean)
    : existingView?.fields;

  return {
    ...existingView,
    id,
    title: page.title || page.label || page.name || existingView?.title || id,
    type,
    entity,
    fields,
    actions: page.actions || existingView?.actions,
    layout: page.layout || existingView?.layout,
  };
}

export function Renderer({ config, locale }: { config: AppConfig; locale: string }) {
  const pages = useMemo(() => {
    if (config.pages?.length) {
      return config.pages.map((page, index) => ({
        ...page,
        slug: page.slug || String(page.id || page.name || page.entity || `page_${index + 1}`),
      }));
    }

    return (config.views || []).map((view) => ({
      id: view.id,
      slug: view.id,
      name: view.title,
      title: view.title,
      type: view.type,
      entity: view.entity,
      fields: view.fields,
      actions: view.actions,
      layout: view.layout,
    }));
  }, [config.pages, config.views]);

  const renderableViews = useMemo(() => {
    if (config.pages?.length) {
      return pages.map((page, index) => {
        const id = String(page.slug || page.id || page.name || page.entity || `page_${index + 1}`);
        const existingView = config.views?.find(view => view.id === id);
        return pageToView(page, index, existingView);
      });
    }

    return config.views || [];
  }, [config.pages, config.views, pages]);

  const currentPageSlug = useAppStore(s => s.currentPageSlug);
  const setCurrentPage = useAppStore(s => s.setCurrentPage);
  const setActiveLocale = useAppStore(s => s.setActiveLocale);

  if (pages.length === 0 || renderableViews.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center">
        <div className="max-w-sm rounded-[8px] border border-border bg-white p-6 shadow-sm">
          <AlertTriangle className="mx-auto mb-3 h-6 w-6 text-[#9a5b3f]" />
          <div className="text-sm font-semibold text-foreground">No views configured</div>
          <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
            Add at least one table, form, or dashboard page to render the app preview.
          </p>
        </div>
      </div>
    );
  }

  const selectedSlug = pages.some(page => page.slug === currentPageSlug) ? currentPageSlug : pages[0].slug;
  const activePage = pages.find(page => page.slug === selectedSlug) || pages[0];
  const activeView = renderableViews.find(v => v.id === activePage.slug) || renderableViews[0];
  const Component = activePage.type === "unknown" ? UnknownPageRenderer : (COMPONENT_REGISTRY[activeView.type] || COMPONENT_REGISTRY.unknown);
  const supportedLocales = config.i18n?.supportedLocales || ["en"];

  return (
    <div className="flex h-full w-full flex-col bg-[#fbfaf7]">
      <div className="flex items-center justify-between border-b border-border bg-white/95 shadow-sm shadow-black/[0.02]">
        <nav className="smooth-scroll flex gap-1 overflow-x-auto px-4 py-2">
          {pages.map(page => (
            <button
              key={page.slug}
              onClick={() => setCurrentPage(page.slug!)}
              className={`whitespace-nowrap rounded-[8px] border px-3 py-1.5 font-mono text-xs transition-colors ${
                selectedSlug === page.slug
                  ? "border-[#111318] bg-[#111318] text-white shadow-sm shadow-black/10"
                  : "border-border bg-white text-muted-foreground hover:border-[#0f6b7a]/40 hover:text-foreground"
              }`}
            >
              {page.type === "table" && "T "}
              {page.type === "form" && "F "}
              {page.type === "dashboard" && "D "}
              {page.type === "unknown" && "! "}
              {page.name || page.title || page.slug}
            </button>
          ))}
        </nav>

        {supportedLocales.length > 1 && (
          <div className="flex h-full shrink-0 items-center pr-4">
            <Globe className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={locale}
              onChange={(e) => setActiveLocale(e.target.value)}
              className="w-20 rounded border border-border bg-white px-2 py-1 text-[11px] text-muted-foreground outline-none"
            >
              {supportedLocales.map((loc) => (
                <option key={loc} value={loc}>
                  {loc.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="smooth-scroll flex-1 overflow-auto bg-[#fbfaf7] p-4">
        <div key={activePage.slug} className="h-full">
          <React.Suspense fallback={<div className="soft-skeleton h-64 w-full rounded-[8px] border border-border" />}>
            <Component view={activeView} page={activePage} config={config} locale={locale} changeView={setCurrentPage} />
          </React.Suspense>
        </div>
      </div>
    </div>
  );
}
