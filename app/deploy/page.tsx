"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAppStore } from "@/store/use-app-store";
import { apiClient } from "@/lib/api-client";
import { exportToGitHub } from "@/lib/auth/github-auth";
import { toast } from "sonner";
import {
  Rocket,
  CheckCircle2,
  Circle,
  Github,
  Download,
  Flame,
  ArrowRight,
  ArrowLeft,
  Loader2,
  ExternalLink,
  Database,
  Eye,
  Shield,
  FileJson2,
  Copy,
  Package,
  Globe,
} from "lucide-react";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";

const STEPS = [
  { id: "review", label: "Review", icon: Eye },
  { id: "target", label: "Target", icon: Rocket },
  { id: "configure", label: "Configure", icon: FileJson2 },
  { id: "deploy", label: "Deploy", icon: Package },
];

const TARGETS = [
  {
    id: "github",
    label: "GitHub Repository",
    description: "Export as a complete Next.js + Express project",
    icon: Github,
    available: true,
  },
  {
    id: "zip",
    label: "Download ZIP",
    description: "Download project files as a ZIP archive",
    icon: Download,
    available: false,
    badge: "Coming Soon",
  },
  {
    id: "firebase",
    label: "Firebase Hosting",
    description: "Deploy directly to Firebase with CI/CD",
    icon: Flame,
    available: false,
    badge: "Coming Soon",
  },
];

export default function DeployPage() {
  const { parsedConfig, validationResult } = useAppStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedTarget, setSelectedTarget] = useState("github");
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployComplete, setDeployComplete] = useState(false);
  const [repoUrl, setRepoUrl] = useState("");

  // GitHub config
  const [repoName, setRepoName] = useState(
    parsedConfig?.app?.name?.toLowerCase().replace(/\s+/g, "-") || "my-ai-app"
  );
  const [description, setDescription] = useState(
    parsedConfig?.app?.description || "An AI-generated application."
  );
  const [isPrivate, setIsPrivate] = useState(false);
  const [licenseTemplate, setLicenseTemplate] = useState("mit");

  // Deploy progress
  const [deploySteps, setDeploySteps] = useState([
    { label: "Validating configuration", status: "pending" as "pending" | "active" | "done" | "error" },
    { label: "Generating project files", status: "pending" as const },
    { label: "Creating GitHub repository", status: "pending" as const },
    { label: "Pushing code to repository", status: "pending" as const },
    { label: "Finalizing deployment", status: "pending" as const },
  ]);

  const handleDeploy = async () => {
    if (!parsedConfig?.app?.id) return;
    setIsDeploying(true);

    const updateStep = (index: number, status: "active" | "done" | "error") => {
      setDeploySteps((prev) =>
        prev.map((s, i) => (i === index ? { ...s, status } : s))
      );
    };

    try {
      updateStep(0, "active");
      await new Promise((r) => setTimeout(r, 600));
      updateStep(0, "done");

      updateStep(1, "active");
      await new Promise((r) => setTimeout(r, 800));
      updateStep(1, "done");

      updateStep(2, "active");
      const resData = await exportToGitHub(
        parsedConfig.app.id,
        repoName,
        isPrivate,
        description,
        licenseTemplate !== "none" ? licenseTemplate : undefined
      );
      updateStep(2, "done");

      updateStep(3, "active");
      await new Promise((r) => setTimeout(r, 500));
      updateStep(3, "done");

      updateStep(4, "active");
      await new Promise((r) => setTimeout(r, 300));
      updateStep(4, "done");

      if (resData.success) {
        setRepoUrl(resData.repoUrl);
        setDeployComplete(true);
        toast.success("Successfully deployed!");
      }
    } catch (e: any) {
      const failIdx = deploySteps.findIndex((s) => s.status === "active");
      if (failIdx >= 0) updateStep(failIdx, "error");

      if (e.response?.status === 422 && e.response?.data?.error === "repo_exists") {
        toast.error(`Repository already exists. Try ${e.response.data.suggestion}`);
      } else if (e.response?.status === 401) {
        toast.error("Authentication required. Please sign in.");
      } else {
        toast.error("Deployment failed. Check console for details.");
      }
    } finally {
      setIsDeploying(false);
    }
  };

  const canProceed = () => {
    if (currentStep === 0) return !!parsedConfig;
    if (currentStep === 1) return selectedTarget === "github";
    if (currentStep === 2) return repoName.trim().length > 0;
    return false;
  };

  if (!parsedConfig) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center">
        <div className="app-panel flex max-w-md flex-col items-center rounded-[8px] p-10">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-[8px] border border-border bg-white">
            <Rocket className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="mb-2 text-lg font-medium text-foreground">
            Nothing to Deploy
          </h2>
          <p className="max-w-xs font-sans text-[13px] text-muted-foreground">
            Open the Builder and apply a configuration before deploying.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full p-6 lg:p-10 text-foreground font-sans">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="app-panel studio-surface mb-10 rounded-[8px] p-6"
        >
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="app-eyebrow mb-4">
                <Rocket className="h-3.5 w-3.5 text-[#9a5b3f]" />
                Release workflow
              </div>
              <h1 className="font-heading text-3xl text-foreground mb-2 flex items-center space-x-3">
                <span>Export & Deploy</span>
              </h1>
              <p className="text-muted-foreground text-[14px]">
                Deploy{" "}
                <span className="text-foreground font-medium">
                  {parsedConfig.app.name}
                </span>{" "}
                to your target platform.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                ["Valid", validationResult?.valid ? "Ready" : "Check"],
                ["Entities", String(parsedConfig.entities?.length || 0)],
                ["Views", String(parsedConfig.views?.length || 0)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[8px] border border-border bg-white/86 px-3 py-2 text-center shadow-sm shadow-black/[0.02]">
                  <div className="font-mono text-[9px] uppercase text-muted-foreground">{label}</div>
                  <div className="mt-1 font-heading text-[18px] text-foreground">{value}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-10 relative">
          <div className="absolute top-4 left-0 right-0 h-[1px] bg-border" />
          <div
            className="absolute top-4 left-0 h-[1px] bg-foreground transition-all duration-500"
            style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
          />

          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const isActive = i === currentStep;
            const isDone = i < currentStep || deployComplete;

            return (
              <div key={step.id} className="relative z-10 flex flex-col items-center bg-background px-2">
                <div
                  className={`w-8 h-8 rounded-sm flex items-center justify-center border transition-all duration-300 ${
                    isDone
                      ? "bg-foreground border-foreground text-background"
                      : isActive
                        ? "bg-background border-foreground text-foreground"
                        : "bg-background border-border text-muted-foreground"
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>
                <span
                  className={`mt-2 text-[10px] font-mono uppercase ${
                    isActive || isDone ? "text-foreground font-medium" : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {/* Step 0: Review */}
          {currentStep === 0 && (
            <motion.div
              key="review"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <h2 className="text-[13px] font-mono uppercase font-medium text-foreground mb-4">
                1. Review Configuration
              </h2>

              <BentoGrid className="grid grid-cols-2 gap-4 md:auto-rows-[10rem]">
                <BentoGridItem
                  className="p-4"
                  header={<div className="text-[10px] font-mono text-muted-foreground uppercase mb-2">App Name</div>}
                  title={<div className="text-[14px] text-foreground font-medium">{parsedConfig.app.name}</div>}
                />
                <BentoGridItem
                  className="p-4"
                  header={<div className="text-[10px] font-mono text-muted-foreground uppercase mb-2">Version</div>}
                  title={<div className="text-[14px] text-foreground font-mono">{parsedConfig.app.version || "1.0.0"}</div>}
                />
                <BentoGridItem
                  className="p-4"
                  header={<div className="text-[10px] font-mono text-muted-foreground uppercase mb-2">Entities</div>}
                  title={<div className="text-[14px] text-foreground font-medium">{parsedConfig.entities?.length || 0}</div>}
                />
                <BentoGridItem
                  className="p-4"
                  header={<div className="text-[10px] font-mono text-muted-foreground uppercase mb-2">Views</div>}
                  title={<div className="text-[14px] text-foreground font-medium">{parsedConfig.views?.length || 0}</div>}
                />
              </BentoGrid>

              {/* Validation */}
              <BentoGridItem
                className={`p-4 ${validationResult?.valid ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}
                title={
                  <div className="flex items-center space-x-2">
                    {validationResult?.valid ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="text-[13px] text-emerald-700 font-medium">Configuration is valid</span>
                      </>
                    ) : (
                      <>
                        <Circle className="w-4 h-4 text-amber-600" />
                        <span className="text-[13px] text-amber-700 font-medium">{validationResult ? `${validationResult.errors.length} validation issues` : "Not validated yet"}</span>
                      </>
                    )}
                  </div>
                }
              />

              {/* Features */}
              <BentoGrid className="grid grid-cols-1 md:grid-cols-3 gap-4 md:auto-rows-[8rem]">
                {parsedConfig.auth?.enabled && (
                  <BentoGridItem
                    className="p-4"
                    header={<Shield className="w-4 h-4" />}
                    title={<span className="text-[11px] font-mono text-muted-foreground uppercase">Auth</span>}
                    description={<span className="text-[13px] text-foreground font-medium">{parsedConfig.auth.provider}</span>}
                  />
                )}
                {parsedConfig.i18n && (
                  <BentoGridItem
                    className="p-4"
                    header={<Globe className="w-4 h-4" />}
                    title={<span className="text-[11px] font-mono text-muted-foreground uppercase">i18n</span>}
                    description={<span className="text-[13px] text-foreground font-medium">{parsedConfig.i18n.supportedLocales.length} locales</span>}
                  />
                )}
                <BentoGridItem
                  className="p-4"
                  header={<Database className="w-4 h-4" />}
                  title={<span className="text-[11px] font-mono text-muted-foreground uppercase">Fields</span>}
                  description={<span className="text-[13px] text-foreground font-medium">{parsedConfig.entities.reduce((a: any, e: any) => a + e.fields.length, 0)} fields</span>}
                />
              </BentoGrid>
            </motion.div>
          )}

          {/* Step 1: Choose Target */}
          {currentStep === 1 && (
            <motion.div
              key="target"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <h2 className="text-[13px] font-mono uppercase font-medium text-foreground mb-4">
                2. Choose Deploy Target
              </h2>

              <div className="space-y-3">
                {TARGETS.map((target) => {
                  const Icon = target.icon;
                  const isSelected = selectedTarget === target.id;

                  return (
                    <button
                      key={target.id}
                      onClick={() => target.available && setSelectedTarget(target.id)}
                      disabled={!target.available}
                      className={`w-full flex items-center p-4 rounded border transition-all text-left ${
                        isSelected
                          ? "border-foreground bg-accent"
                          : target.available
                            ? "border-border bg-background hover:bg-accent"
                            : "border-border bg-background opacity-50 cursor-not-allowed"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded border flex items-center justify-center mr-4 ${
                          isSelected
                            ? "bg-foreground text-background border-foreground"
                            : "bg-accent text-muted-foreground border-border"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className={`text-[14px] font-medium ${isSelected ? "text-foreground" : "text-muted-foreground"}`}>
                            {target.label}
                          </span>
                          {target.badge && (
                            <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded border border-border bg-background text-muted-foreground">
                              {target.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[12px] text-muted-foreground mt-0.5">
                          {target.description}
                        </p>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-5 h-5 text-foreground shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Step 2: Configure */}
          {currentStep === 2 && (
            <motion.div
              key="configure"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-5"
            >
              <h2 className="text-[13px] font-mono uppercase font-medium text-foreground mb-4">
                3. Configure GitHub Export
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase text-muted-foreground mb-1.5">
                    Repository Name
                  </label>
                  <input
                    value={repoName}
                    onChange={(e) => setRepoName(e.target.value)}
                    placeholder="my-ai-app"
                    className="w-full bg-background border border-border rounded px-3.5 py-2.5 text-[13px] font-mono text-foreground focus:border-foreground outline-none transition-all placeholder:text-muted-foreground"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-muted-foreground mb-1.5">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    placeholder="Brief description..."
                    className="w-full bg-background border border-border rounded px-3.5 py-2.5 text-[13px] text-foreground focus:border-foreground outline-none transition-all placeholder:text-muted-foreground resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-muted-foreground mb-1.5">
                      Visibility
                    </label>
                    <select
                      value={isPrivate ? "private" : "public"}
                      onChange={(e) => setIsPrivate(e.target.value === "private")}
                      className="w-full bg-background border border-border rounded px-3.5 py-2.5 text-[13px] text-foreground focus:border-foreground outline-none"
                    >
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-muted-foreground mb-1.5">
                      License
                    </label>
                    <select
                      value={licenseTemplate}
                      onChange={(e) => setLicenseTemplate(e.target.value)}
                      className="w-full bg-background border border-border rounded px-3.5 py-2.5 text-[13px] text-foreground focus:border-foreground outline-none"
                    >
                      <option value="none">None</option>
                      <option value="mit">MIT</option>
                      <option value="apache-2.0">Apache 2.0</option>
                      <option value="gpl-3.0">GPLv3</option>
                    </select>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Deploy / Complete */}
          {currentStep === 3 && (
            <motion.div
              key="deploy"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {!deployComplete ? (
                <>
                  <h2 className="text-[13px] font-mono uppercase font-medium text-foreground mb-4">
                    {isDeploying ? "Deploying..." : "4. Ready to Deploy"}
                  </h2>

                  <BentoGrid className="grid grid-cols-1 gap-3 md:auto-rows-[5.5rem]">
                    {deploySteps.map((step, i) => (
                      <BentoGridItem
                        key={i}
                        className={`p-4 ${
                          step.status === "done"
                            ? "border-emerald-200 bg-emerald-50"
                            : step.status === "active"
                              ? "border-foreground bg-accent"
                              : step.status === "error"
                                ? "border-red-200 bg-red-50"
                                : "border-border bg-background"
                        }`}
                        header={
                          step.status === "done" ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : step.status === "active" ? (
                            <Loader2 className="w-4 h-4 text-foreground animate-spin shrink-0" />
                          ) : step.status === "error" ? (
                            <Circle className="w-4 h-4 text-red-600 shrink-0" />
                          ) : (
                            <Circle className="w-4 h-4 text-border shrink-0" />
                          )
                        }
                        title={<span className={`text-[13px] font-mono ${step.status === "done" ? "text-emerald-700 font-medium" : step.status === "active" ? "text-foreground font-medium" : step.status === "error" ? "text-red-700 font-medium" : "text-muted-foreground"}`}>{step.label}</span>}
                      />
                    ))}
                  </BentoGrid>

                  {!isDeploying && (
                    <button
                      onClick={handleDeploy}
                      className="w-full flex items-center justify-center space-x-2 py-3 rounded bg-foreground text-background font-medium text-[13px] hover:bg-foreground/90 transition-all"
                    >
                      <Rocket className="w-4 h-4" />
                      <span>Start Deployment</span>
                    </button>
                  )}
                </>
              ) : (
                /* Success State */
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="text-center py-8"
                >
                  <div className="w-16 h-16 rounded border-2 border-emerald-500 bg-emerald-50 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground mb-2">
                    Deployed Successfully!
                  </h2>
                  <p className="text-muted-foreground text-[14px] mb-6">
                    Your app has been exported to GitHub.
                  </p>

                  {repoUrl && (
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                      <a
                        href={repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-2 px-5 py-2.5 rounded bg-foreground text-background hover:bg-foreground/90 transition-colors text-[13px] font-medium"
                      >
                        <Github className="w-4 h-4" />
                        <span>Open in GitHub</span>
                        <ExternalLink className="w-3 h-3 text-background/60" />
                      </a>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(repoUrl);
                          toast.success("URL copied");
                        }}
                        className="inline-flex items-center space-x-2 px-5 py-2.5 rounded border border-border text-foreground hover:bg-accent transition-colors text-[13px] font-medium"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy URL</span>
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        {!deployComplete && (
          <div className="flex items-center justify-between mt-10 pt-6 border-t border-border">
            <button
              onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
              disabled={currentStep === 0}
              className="flex items-center space-x-2 px-4 py-2 rounded text-[13px] font-medium text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            {currentStep < 3 && (
              <button
                onClick={() => setCurrentStep((s) => Math.min(3, s + 1))}
                disabled={!canProceed()}
                className="flex items-center space-x-2 px-5 py-2 rounded bg-foreground text-background text-[13px] font-medium disabled:opacity-40 disabled:cursor-not-allowed hover:bg-foreground/90 transition-all"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
