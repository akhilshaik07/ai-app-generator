"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

interface Props {
  config: any;
}

export function DynamicDashboard({ config }: Props) {
  const appId = config?.app?.id || config?.appId || "";

  const tablePages = useMemo(
    () => config?.pages?.filter((p: any) => p?.type === "table") ?? [],
    [config]
  );

  const totalFields = useMemo(
    () =>
      config?.pages?.reduce(
        (acc: number, p: any) => acc + (p?.fields?.length || 0),
        0
      ) ?? 0,
    [config]
  );

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          {config?.name || config?.app?.name || "Untitled App"}
        </h1>
        <p className="text-sm text-gray-500 mt-1 font-mono">
          {(appId || "no-id").slice(0, 8)} · v{config?.app?.version || "1.0.0"}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Pages" value={config?.pages?.length ?? 0} sub="total" />
        <StatCard label="Tables" value={tablePages.length} sub="data entities" />
        <StatCard label="Fields" value={totalFields} sub="across all pages" />
        <StatCard
          label="Auth"
          value={config?.auth?.enabled ? "ON" : "OFF"}
          sub={config?.auth?.provider || "none"}
        />
      </div>

      <div className="mb-6">
        <div className="text-xs font-mono font-medium text-gray-400 uppercase tracking-widest mb-3">
          Pages
        </div>
        <div className="space-y-2">
          {config?.pages?.filter(Boolean)?.map((page: any) => (
            <PageSummaryRow key={page.slug || page.name} page={page} />
          ))}
        </div>
      </div>

      {tablePages.length > 0 && (
        <div>
          <div className="text-xs font-mono font-medium text-gray-400 uppercase tracking-widest mb-3">
            Live Data
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub: string;
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-lg p-4">
      <div className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-2">
        {label}
      </div>
      <div className="text-2xl font-bold text-gray-900 tracking-tight mb-1">{value}</div>
      <div className="text-xs text-gray-400">{sub}</div>
    </div>
  );
}

function PageSummaryRow({ page }: { page: any }) {
  const typeIcon: Record<string, string> = {
    table: "⊞",
    form: "◧",
    dashboard: "◈",
    unknown: "⚠",
  };

  const typeColor: Record<string, string> = {
    table: "bg-blue-50 text-blue-600 border-blue-100",
    form: "bg-green-50 text-green-600 border-green-100",
    dashboard: "bg-violet-50 text-violet-600 border-violet-100",
    unknown: "bg-amber-50 text-amber-600 border-amber-100",
  };

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 bg-gray-50 rounded-md border border-gray-100">
      <span className="text-gray-400 text-xs">{typeIcon[page.type] || "?"}</span>
      <span className="text-sm font-medium text-gray-700 flex-1">{page.name || page.title}</span>
      <span className="font-mono text-xs text-gray-400">{page.slug}</span>
      <span className={`text-xs font-mono px-2 py-0.5 rounded border ${typeColor[page.type] || typeColor.unknown}`}>
        {page.type}
      </span>
      <span className="text-xs text-gray-300 font-mono">{page.fields?.length ?? 0} fields</span>
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
    <div className="bg-white border border-gray-100 rounded-lg p-4 flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-700 truncate">{page.name || page.title}</div>
        <div className="text-xs text-gray-400 font-mono">{entity}</div>
      </div>
      <div className="text-right">
        {isLoading ? (
          <div className="w-8 h-5 bg-gray-100 rounded animate-pulse" />
        ) : (
          <div className="text-xl font-bold text-gray-900">{data ?? 0}</div>
        )}
        <div className="text-xs text-gray-400">records</div>
      </div>
    </div>
  );
}
