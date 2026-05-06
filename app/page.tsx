"use client";

import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/use-app-store";
import { templates } from "@/lib/templates";
import { supabase } from "@/lib/supabase-client";
import { apiClient } from "@/lib/api-client";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import { Spotlight } from "@/components/ui/spotlight";
import {
  ArrowRight,
  Braces,
  CheckCircle2,
  Code2,
  Database,
  Eye,
  FileJson2,
  Github,
  Layers,
  Rocket,
  Shield,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

const FEATURES = [
  {
    icon: Code2,
    title: "Schema-first generation",
    description: "Describe data, pages, auth, and workflows once. The runtime renders the app and the backend contract from the same source.",
  },
  {
    icon: Eye,
    title: "Live app preview",
    description: "Validate JSON and inspect the generated product in the builder without waiting on a deploy cycle.",
  },
  {
    icon: Github,
    title: "Repository export",
    description: "Ship a complete project to GitHub with generated routes, schema helpers, and deployment-ready files.",
  },
  {
    icon: Database,
    title: "Postgres-ready DDL",
    description: "Turn entities and fields into readable SQL that your team can review before it becomes infrastructure.",
  },
  {
    icon: Shield,
    title: "Auth and protected pages",
    description: "Enable email, OAuth, and protected views from config instead of rebuilding the same guard rails.",
  },
  {
    icon: Layers,
    title: "Operational imports",
    description: "Bring CSV data into generated tables with column mapping, preview, validation, and bulk insert support.",
  },
];

const STATS = [
  { value: "8", label: "Templates" },
  { value: "Live", label: "Preview" },
  { value: "SQL", label: "Schema" },
  { value: "GitHub", label: "Export" },
];

const FLOW = [
  { label: "JSON", icon: FileJson2 },
  { label: "Preview", icon: Eye },
  { label: "Schema", icon: Database },
  { label: "Deploy", icon: Rocket },
];

const accentLines = ["#0f6b7a", "#9a5b3f", "#51624d", "#111318"];

export default function LandingPage() {
  const router = useRouter();
  const setRawConfig = useAppStore(state => state.setRawConfig);
  const applyConfigLocally = useAppStore(state => state.applyConfigLocally);
  const setValidationResult = useAppStore(state => state.setValidationResult);
  const user = useAppStore(state => state.user);
  const [myApps, setMyApps] = useState<any[]>([]);

  useEffect(() => {
    const fetchApps = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          const res = await apiClient.get("/apps");
          setMyApps(res.data.apps || []);
        }
      } catch (e) {
        console.error("Failed to fetch user apps", e);
      }
    };
    fetchApps();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        fetchApps();
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadTemplate = (template: any) => {
    const raw = JSON.stringify(template, null, 2);
    setRawConfig(raw);
    applyConfigLocally(raw);
    fetch("/api/v1/config/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config: raw }),
    })
      .then((res) => res.json())
      .then((data) => setValidationResult(data))
      .catch(() => {});
    router.push("/builder");
  };

  const deleteApp = async (appId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this app?")) {
      try {
        await apiClient.delete(`/apps/${appId}`);
        setMyApps(myApps.filter((app) => app.app.id !== appId));
        toast.success("App deleted");
      } catch {
        toast.error("Failed to delete app");
      }
    }
  };

  return (
    <div className="min-h-full text-foreground selection:bg-foreground selection:text-background">
      <section className="relative overflow-hidden border-b border-border hero-stage">
        <Spotlight className="-top-40 left-0 md:left-60 md:-top-20" fill="white" />
        <Spotlight className="top-10 left-full md:-left-40" fill="#0f6b7a" />
        <div className="absolute inset-0 opacity-70">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(17,19,24,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(17,19,24,0.05)_1px,transparent_1px)] bg-[size:42px_42px]" />
          <div className="absolute right-[-8%] top-8 h-[540px] w-[72%] rounded-[8px] border border-white/20 bg-white/40 backdrop-blur-xl shadow-2xl shadow-black/10" />
          <div className="absolute right-[6%] top-24 hidden h-[382px] w-[48%] rounded-[8px] border border-white/10 bg-[#111318]/90 backdrop-blur-xl p-4 shadow-xl shadow-black/30 lg:block">
            <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#9a5b3f]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#d7b56d]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#0f6b7a]" />
              </div>
              <span className="font-mono text-[10px] text-white/45">builder.preview</span>
            </div>
            <div className="grid h-[314px] grid-cols-[0.8fr_1fr] gap-4">
              <div className="rounded-[8px] border border-white/10 bg-white/[0.04] p-3 font-mono text-[11px] leading-6 text-white/65">
                <div className="text-[#8dd6df]">{"{"}</div>
                <div className="pl-3">{"\"name\": \"Hiring CRM\","}</div>
                <div className="pl-3">{"\"pages\": ["}</div>
                <div className="pl-6 text-white">{"\"Candidates\","}</div>
                <div className="pl-6 text-white">{"\"Interview Form\""}</div>
                <div className="pl-3">]</div>
                <div className="text-[#8dd6df]">{"}"}</div>
              </div>
              <div className="rounded-[8px] border border-white/10 bg-[#fbfaf7] p-4">
                <div className="mb-4 flex gap-2">
                  <span className="rounded border border-[#111318] bg-[#111318] px-3 py-1 font-mono text-[10px] text-white">Candidates</span>
                  <span className="rounded border border-black/10 bg-white px-3 py-1 font-mono text-[10px] text-[#68635c]">Interview</span>
                </div>
                <div className="space-y-2">
                  {["Ari Chen", "Maya Singh", "Jon Bell"].map((name, index) => (
                    <div key={name} className="flex items-center justify-between rounded border border-black/10 bg-white px-3 py-2">
                      <span className="text-[12px] font-semibold">{name}</span>
                      <span className="rounded bg-[#edf7f8] px-2 py-0.5 font-mono text-[10px] text-[#0f6b7a]">
                        {index === 0 ? "Screen" : index === 1 ? "Offer" : "New"}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {["SQL", "Auth", "Export"].map((item) => (
                    <div key={item} className="rounded border border-black/10 bg-white px-2 py-2 text-center font-mono text-[9px] font-semibold text-[#68635c]">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6 pb-14 pt-16 lg:px-12 lg:pb-24 lg:pt-24">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="max-w-3xl"
          >
            <div className="app-eyebrow mb-6">
              <Sparkles className="h-3.5 w-3.5 text-[#0f6b7a]" />
              Config-driven app generator
            </div>
            <h1 className="font-heading text-5xl leading-[1.02] sm:text-6xl lg:text-[78px]">
              AI Studio
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
              Build internal tools from JSON, preview the real app
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => router.push("/builder")}
                className="group inline-flex h-11 items-center justify-center rounded-lg bg-foreground px-5 text-[13px] font-semibold text-background shadow-lg shadow-black/10 transition-all hover:-translate-y-0.5 hover:bg-[#252a33]"
              >
                Open Builder
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
              <a
                href="#templates"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-white/80 px-5 text-[13px] font-semibold text-foreground shadow-sm shadow-black/[0.03] transition-all hover:border-foreground/25 hover:bg-white"
              >
                Browse Templates
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-2">
              {FLOW.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="studio-chip rounded-[8px]">
                    <Icon className="h-3.5 w-3.5 text-[#0f6b7a]" />
                    <span>{index + 1}. {item.label}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-12 lg:py-14">
        <BentoGrid className="grid grid-cols-2 gap-4 md:auto-rows-[9rem] md:grid-cols-4">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <BentoGridItem
                className="h-full studio-surface p-5 border border-white/20 shadow-sm backdrop-blur-md bg-white/60 hover:bg-white/90 transition-all"
                header={<div className="flex items-center justify-between"><div className="font-mono text-[10px] font-semibold uppercase text-muted-foreground">{stat.label}</div><span className="h-2 w-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.2)]" style={{ backgroundColor: accentLines[i % accentLines.length] }} /></div>}
                title={<div className="font-heading text-3xl text-foreground">{stat.value}</div>}
              />
            </motion.div>
          ))}
        </BentoGrid>

        <section className="mt-8 rounded-[8px] border border-border bg-[#111318] p-4 text-white shadow-xl shadow-black/[0.08]">
          <div className="grid gap-3 md:grid-cols-4">
            {[
              "Validate configuration",
              "Render working screens",
              "Review database schema",
              "Export GitHub project",
            ].map((step) => (
              <div key={step} className="flex items-center gap-3 rounded-[8px] border border-white/10 bg-white/[0.04] px-3 py-3">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#8dd6df]" />
                <span className="text-[12px] font-medium text-white/82">{step}</span>
              </div>
            ))}
          </div>
        </section>

        {user && myApps.length > 0 && (
          <section className="mt-16">
            <SectionHeader title="My Applications" description="Saved configurations ready to reopen, revise, or export." />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {myApps.map((tpl, i) => (
                <TemplateCard
                  key={tpl.app.id}
                  title={tpl.app.name}
                  description={tpl.app.description || "Saved generated app configuration."}
                  meta={`${tpl.entities?.length || 0} entities / ${tpl.views?.length || 0} views`}
                  accent={accentLines[i % accentLines.length]}
                  onClick={() => loadTemplate(tpl)}
                  action={
                    <button
                      onClick={(e) => deleteApp(tpl.app.id, e)}
                      className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-white group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  }
                />
              ))}
            </div>
          </section>
        )}

        <section id="templates" className="mt-16">
          <SectionHeader title="Templates" description="Start with a polished structure, then adapt the JSON to your workflow." />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {templates.map((tpl, i) => (
              <TemplateCard
                key={tpl.app.id}
                title={tpl.app.name}
                description={"description" in tpl.app ? String(tpl.app.description) : "A ready-to-edit app scaffold with entities and pages."}
                meta={`${tpl.entities.length} entities / ${tpl.views.length} views`}
                accent={accentLines[i % accentLines.length]}
                badge={tpl.auth?.enabled ? "Auth enabled" : "No auth"}
                details={tpl.entities.slice(0, 2).map((entity) => entity.label || entity.name).join(" • ")}
                onClick={() => loadTemplate(tpl)}
              />
            ))}
          </div>
        </section>

        <section className="mt-16 pb-10">
          <SectionHeader title="Built For Operators" description="Dense, practical workflows for teams who need apps that do something on the first screen." />
          <BentoGrid className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 md:auto-rows-[15rem]">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                >
                  <BentoGridItem
                    className="h-full p-6 border border-white/20 bg-white/70 backdrop-blur-sm shadow-sm hover:shadow-xl hover:bg-white/90 transition-all hover:-translate-y-1"
                    header={<div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-white shadow-sm text-[#0f6b7a]"><Icon className="h-4 w-4" /></div>}
                    title={<h3 className="text-[15px] font-semibold text-foreground">{feature.title}</h3>}
                    description={<p className="text-[13px] leading-6 text-muted-foreground">{feature.description}</p>}
                  />
                </motion.div>
              );
            })}
          </BentoGrid>
        </section>
      </div>
    </div>
  );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-3 border-b border-border pb-4 sm:flex-row sm:items-end">
      <div>
        <div className="app-eyebrow mb-3">
          <Braces className="h-3.5 w-3.5 text-[#9a5b3f]" />
          Library
        </div>
        <h2 className="font-heading text-3xl">{title}</h2>
      </div>
      <p className="max-w-md text-[13px] leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}

function TemplateCard({
  title,
  description,
  meta,
  accent,
  badge,
  details,
  action,
  onClick,
}: {
  title: string;
  description: string;
  meta: string;
  accent: string;
  badge?: string;
  details?: string;
  action?: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group studio-surface relative flex h-56 flex-col overflow-hidden rounded-[12px] border border-border bg-white/92 p-5 text-left shadow-sm shadow-black/[0.03] transition-all hover:-translate-y-0.5 hover:border-[#0f6b7a]/35 hover:shadow-xl hover:shadow-black/[0.08]"
    >
      <span className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: accent }} />
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-[#111318] font-mono text-[13px] font-bold text-white shadow-sm">
          {title.charAt(0)}
        </div>
        <div className="flex items-center gap-2">
          {badge && <span className="rounded-full border border-border bg-[#fbfaf7] px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">{badge}</span>}
          {action}
        </div>
      </div>
      <h3 className="text-[16px] font-semibold text-foreground">{title}</h3>
      <p className="mt-2 line-clamp-3 text-[13px] leading-6 text-muted-foreground">{description}</p>
      {details && <p className="mt-3 font-mono text-[10px] uppercase tracking-wide text-[#6b6258]">{details}</p>}
      <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
        <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">{meta}</span>
        <span className="flex h-7 w-7 items-center justify-center rounded-[8px] border border-border bg-white text-muted-foreground transition-all group-hover:border-[#0f6b7a]/40 group-hover:text-foreground">
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </button>
  );
}
