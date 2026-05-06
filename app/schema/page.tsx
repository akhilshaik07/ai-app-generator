"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAppStore } from "@/store/use-app-store";
import {
  Database,
  ChevronDown,
  ChevronRight,
  Hash,
  Type,
  ToggleLeft,
  Calendar,
  Mail,
  Link2,
  List,
  FileText,
  Upload,
  Code2,
  Key,
  Asterisk,
  Copy,
  Download,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

const FIELD_TYPE_CONFIG: Record<string, { icon: React.ElementType }> = {
  text: { icon: Type },
  textarea: { icon: FileText },
  number: { icon: Hash },
  boolean: { icon: ToggleLeft },
  date: { icon: Calendar },
  datetime: { icon: Calendar },
  calendar: { icon: Calendar },
  email: { icon: Mail },
  url: { icon: Link2 },
  select: { icon: List },
  multiselect: { icon: List },
  file: { icon: Upload },
  upload: { icon: Upload },
  json: { icon: Code2 },
  richtext: { icon: FileText },
  html: { icon: Code2 },
  relation: { icon: Link2 },
};

function generateSQL(config: any): string {
  if (!config?.entities) return "-- No entities defined";

  let sql = `-- Auto-generated DDL for: ${config.app?.name || "App"}\n`;
  sql += `-- Version: ${config.app?.version || "1.0.0"}\n`;
  sql += `-- Generated at: ${new Date().toISOString()}\n\n`;

  for (const entity of config.entities) {
    sql += `CREATE TABLE IF NOT EXISTS "${entity.name}" (\n`;
    sql += `  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n`;

    for (const field of entity.fields) {
      let pgType = "TEXT";
      if (field.type === "number") pgType = "NUMERIC";
      else if (field.type === "boolean") pgType = "BOOLEAN DEFAULT FALSE";
      else if (field.type === "date" || field.type === "calendar") pgType = "DATE";
      else if (field.type === "datetime") pgType = "TIMESTAMPTZ";
      else if (field.type === "json") pgType = "JSONB";
      else pgType = "TEXT";

      const constraints = [];
      if (field.required) constraints.push("NOT NULL");
      if (field.unique) constraints.push("UNIQUE");
      if (field.default !== undefined) constraints.push(`DEFAULT '${field.default}'`);

      sql += `  "${field.name}" ${pgType}${constraints.length ? " " + constraints.join(" ") : ""},\n`;
    }

    if (entity.timestamps !== false) {
      sql += `  "created_at" TIMESTAMPTZ DEFAULT NOW(),\n`;
      sql += `  "updated_at" TIMESTAMPTZ DEFAULT NOW()\n`;
    }

    sql += `);\n\n`;
  }

  return sql;
}

export default function SchemaPage() {
  const { parsedConfig } = useAppStore();
  const [expandedEntities, setExpandedEntities] = useState<Set<string>>(new Set());
  const [showSQL, setShowSQL] = useState(false);
  const [copied, setCopied] = useState(false);

  const toggleEntity = (name: string) => {
    setExpandedEntities((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const expandAll = () => {
    if (!parsedConfig?.entities) return;
    setExpandedEntities(new Set(parsedConfig.entities.map((e) => e.name)));
  };

  const collapseAll = () => setExpandedEntities(new Set());

  const sql = parsedConfig ? generateSQL(parsedConfig) : "";

  const handleCopySQL = () => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    toast.success("SQL copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSQL = () => {
    const blob = new Blob([sql], { type: "text/sql" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${parsedConfig?.app?.name?.toLowerCase().replace(/\s+/g, "_") || "schema"}.sql`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("SQL file downloaded");
  };

  if (!parsedConfig) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center">
        <div className="app-panel flex max-w-md flex-col items-center rounded-[8px] p-10">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-[8px] border border-border bg-white">
            <Database className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="mb-2 text-lg font-medium text-foreground">No Schema Available</h2>
          <p className="max-w-xs font-sans text-[13px] text-muted-foreground">
            Open the Builder and apply a configuration to view the generated schema.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full p-6 lg:p-10 text-foreground font-sans">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="app-panel studio-surface mb-8 rounded-[8px] p-6"
        >
          <div className="app-eyebrow mb-4">
            <Database className="h-3.5 w-3.5 text-[#0f6b7a]" />
            Database design
          </div>
          <h1 className="font-heading text-3xl text-foreground mb-2 flex items-center space-x-3">
            <span>Schema Viewer</span>
          </h1>
          <p className="text-muted-foreground text-[14px]">
            Visualize the entity schema for{" "}
            <span className="text-foreground font-medium">{parsedConfig.app.name}</span>.{" "}
            {parsedConfig.entities.length} entities defined.
          </p>
        </motion.div>

        {/* Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <button
              onClick={expandAll}
              className="px-3 py-1.5 text-[12px] font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg bg-white/80 hover:bg-white transition-colors"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="px-3 py-1.5 text-[12px] font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg bg-white/80 hover:bg-white transition-colors"
            >
              Collapse All
            </button>
          </div>
          <button
            onClick={() => setShowSQL(!showSQL)}
            className={`px-3 py-1.5 text-[12px] font-medium rounded border transition-colors ${
              showSQL
                ? "text-background border-foreground bg-foreground"
                : "text-muted-foreground border-border bg-white/80 hover:text-foreground hover:bg-white"
            }`}
          >
            {showSQL ? "Hide SQL" : "Show SQL"}
          </button>
        </div>

        {/* Entity Cards */}
        <div className="space-y-4 mb-8">
          {parsedConfig.entities.map((entity: any, i: number) => {
            const isExpanded = expandedEntities.has(entity.name);
            return (
              <motion.div
                key={entity.name}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="rounded-[8px] border border-border bg-white/90 shadow-sm shadow-black/[0.03] overflow-hidden"
              >
                {/* Entity Header */}
                <button
                  onClick={() => toggleEntity(entity.name)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#edf7f8] transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg border border-border bg-[#fbfaf7] flex items-center justify-center">
                      <Database className="w-4 h-4 text-foreground" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-[14px] font-semibold text-foreground">
                        {entity.label || entity.name}
                      </h3>
                      <p className="text-[11px] text-muted-foreground font-mono uppercase mt-0.5">
                        {entity.name} / {entity.fields.length} fields
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1">
                      {entity.fields.slice(0, 4).map((f: any) => {
                        const cfg = FIELD_TYPE_CONFIG[f.type] || FIELD_TYPE_CONFIG.text;
                        return (
                          <div
                            key={f.name}
                            className="w-5 h-5 rounded flex items-center justify-center bg-[#f4f2ec] border border-border"
                            title={`${f.name} (${f.type})`}
                          >
                            <cfg.icon className="w-3 h-3 text-muted-foreground" />
                          </div>
                        );
                      })}
                      {entity.fields.length > 4 && (
                        <span className="text-[10px] text-muted-foreground font-mono ml-1">
                          +{entity.fields.length - 4}
                        </span>
                      )}
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {/* Fields List */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-4 border-t border-border">
                        {/* Auto ID row */}
                        <div className="flex items-center py-2.5 border-b border-border text-[12px]">
                          <div className="w-8 h-8 rounded flex items-center justify-center bg-[#f4f2ec] border border-border mr-3">
                            <Key className="w-3.5 h-3.5 text-foreground" />
                          </div>
                          <span className="font-mono text-foreground w-32 font-bold">id</span>
                          <span className="text-[10px] font-mono text-foreground bg-[#f4f2ec] border border-border px-1.5 py-0.5 rounded mr-3 uppercase">
                            UUID
                          </span>
                          <span className="text-[9px] text-muted-foreground ml-auto uppercase">PRIMARY KEY</span>
                        </div>

                        {entity.fields.map((field: any, fi: number) => {
                          const cfg = FIELD_TYPE_CONFIG[field.type] || FIELD_TYPE_CONFIG.text;
                          const Icon = cfg.icon;

                          return (
                            <motion.div
                              key={field.name}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.2, delay: fi * 0.03 }}
                              className="flex items-center py-2.5 border-b border-border last:border-0 text-[12px]"
                            >
                              <div className="w-8 h-8 rounded flex items-center justify-center bg-[#f4f2ec] border border-border mr-3">
                                <Icon className="w-3.5 h-3.5 text-foreground" />
                              </div>
                              <span className="font-mono text-foreground w-32 truncate font-medium" title={field.name}>
                                {field.name}
                              </span>
                              <span className="text-[10px] font-mono text-muted-foreground bg-[#f4f2ec] border border-border px-1.5 py-0.5 rounded mr-3 uppercase">
                                {field.type}
                              </span>
                              <div className="flex items-center space-x-2 ml-auto">
                                {field.required && (
                                  <span className="flex items-center text-[9px] text-foreground border border-border px-1.5 py-0.5 rounded uppercase">
                                    <Asterisk className="w-2.5 h-2.5 mr-0.5" />
                                    Req
                                  </span>
                                )}
                                {field.unique && (
                                  <span className="text-[9px] text-foreground border border-border px-1.5 py-0.5 rounded uppercase">
                                    Unq
                                  </span>
                                )}
                                {field.options && (
                                  <span className="text-[10px] text-muted-foreground font-mono">
                                    {field.options.length} opts
                                  </span>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* SQL Preview */}
        <AnimatePresence>
          {showSQL && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.3 }}
              className="rounded-[8px] border border-border bg-white/90 shadow-xl shadow-black/[0.06] overflow-hidden mb-8"
            >
              <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-[#f4f2ec]">
                <div className="flex items-center space-x-2">
                  <Code2 className="w-4 h-4 text-foreground" />
                  <span className="text-[11px] font-mono uppercase text-foreground font-medium">
                    PostgreSQL DDL
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleCopySQL}
                    className="flex items-center space-x-1.5 px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground border border-border rounded hover:bg-background transition-colors"
                  >
                    {copied ? <CheckCircle2 className="w-3 h-3 text-foreground" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                  <button
                    onClick={handleDownloadSQL}
                    className="flex items-center space-x-1.5 px-2.5 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground border border-border rounded hover:bg-background transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
              <pre className="p-5 text-[12px] font-mono text-muted-foreground leading-relaxed overflow-x-auto max-h-[400px]">
                {sql}
              </pre>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
