"use client";

import type React from "react";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Database, FileText, LayoutDashboard, Lock, Table2 } from "lucide-react";

interface Props {
  config: any;
}

export function DynamicDashboard({ config }: Props) {
  const appId = config?.app?.id || config?.appId || "";

  const pages = useMemo(() => config?.pages?.filter(Boolean) ?? [], [config]);

  const tablePages = useMemo(
    () => pages.filter((p: any) => p?.type === "table"),
    [pages]
  );

  const totalFields = useMemo(
    () =>
      pages.reduce(
        (acc: number, p: any) => acc + (p?.fields?.length || 0),
        0
      ),
    [pages]
  );

  return (
    <div className="mx-auto max-w-5xl p-4 sm:p-6">
      <div className="mb-5 rounded-[8px] border border-border bg-white p-5 shadow-sm shadow-black/[0.03]">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-[8px] border border-border bg-[#111318] text-white">
          <LayoutDashboard className="h-4 w-4" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {config?.name || config?.app?.name || "Untitled App"}
        </h1>
        <p className="mt-1 font-mono text-[11px] uppercase text-muted-foreground">
          {(appId || "no-id").slice(0, 8)} / v{config?.app?.version || "1.0.0"}
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={FileText} label="Pages" value={pages.length} sub="total" />
        <StatCard icon={Table2} label="Tables" value={tablePages.length} sub="data entities" />
        <StatCard icon={Database} label="Fields" value={totalFields} sub="across all pages" />
        <StatCard
          icon={Lock}
          label="Auth"
          value={config?.auth?.enabled ? "ON" : "OFF"}
          sub={config?.auth?.provider || "none"}
        />
      </div>

      <div className="mb-6 rounded-[8px] border border-border bg-white shadow-sm shadow-black/[0.03]">
        <div className="border-b border-border px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">
          Pages
        </div>
        <div className="divide-y divide-border">
          {pages.map((page: any) => (
            <PageSummaryRow key={page.slug || page.name} page={page} />
          ))}
        </div>
      </div>

      {tablePages.length > 0 && (
        <div className="rounded-[8px] border border-border bg-white shadow-sm shadow-black/[0.03]">
          <div className="border-b border-border px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">
            Live Data
          </div>
          <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
            {tablePages.map((page: any) => (
              <LiveRecordCount key={page.slug || page.name} appId={appId} page={page} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub: string;
}) {
  return (
    <div className="rounded-[8px] border border-border bg-white p-4 shadow-sm shadow-black/[0.03]">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-xs font-semibold uppercase text-muted-foreground">{label}</div>
        <Icon className="h-4 w-4 text-[#0f6b7a]" />
      </div>
      <div className="mb-1 text-2xl font-semibold tracking-tight text-foreground">{value}</div>
      <div className="text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}

function PageSummaryRow({ page }: { page: any }) {
  const typeColor: Record<string, string> = {
    table: "bg-[#edf7f8] text-[#0f6b7a] border-[#0f6b7a]/20",
    form: "bg-green-50 text-green-700 border-green-200",
    dashboard: "bg-[#f4f2ec] text-foreground border-border",
    auth: "bg-[#111318] text-white border-[#111318]",
    unknown: "bg-amber-50 text-amber-700 border-amber-200",
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-border bg-[#fbfaf7]">
        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
      </span>
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{page.name || page.title}</span>
      <span className="hidden font-mono text-xs text-muted-foreground sm:inline">{page.slug}</span>
      <span className={`rounded border px-2 py-0.5 font-mono text-xs ${typeColor[page.type] || typeColor.unknown}`}>
        {page.type}
      </span>
      <span className="font-mono text-xs text-muted-foreground">{page.fields?.length ?? 0} fields</span>
    </div>
  );
}

function LiveRecordCount({ appId, page }: { appId: string; page: any }) {
  const entity = page.entity || page.slug;
  const isActiveTab = true;
  const { data, isLoading } = useQuery({
    queryKey: ["count", appId, entity],
    queryFn: async () => {
      const res = await apiClient.get(`/dynamic/${appId}/${entity}`, { params: { limit: 1 } });
      return res.data?.total ?? 0;
    },
    enabled: !!appId && !!entity && isActiveTab,
    staleTime: 30_000,
    retry: false,
  });

  return (
    <div className="flex items-center gap-4 rounded-[8px] border border-border bg-[#fbfaf7] p-4">
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-foreground">{page.name || page.title}</div>
        <div className="font-mono text-xs text-muted-foreground">{entity}</div>
      </div>
      <div className="text-right">
        {isLoading ? (
          <div className="soft-skeleton h-6 w-10 rounded border border-border" />
        ) : (
          <div className="text-xl font-semibold text-foreground">{data ?? 0}</div>
        )}
        <div className="text-xs text-muted-foreground">records</div>
      </div>
    </div>
  );
}
