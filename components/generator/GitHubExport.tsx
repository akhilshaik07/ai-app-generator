"use client";

import React, { useState } from "react";
import { DownloadCloud, Loader2, Github, CheckCircle2, ExternalLink } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/store/use-app-store";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase-client";
import confetti from "canvas-confetti";

export function GitHubExport() {
  const parsedConfig = useAppStore(s => s.parsedConfig);
  const [open, setOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [repoUrl, setRepoUrl] = useState("");

  // Form State
  const [repoName, setRepoName] = useState(parsedConfig?.app?.name?.toLowerCase().replace(/\s+/g, '-') || "my-ai-app");
  const [description, setDescription] = useState(parsedConfig?.app?.description || "An AI-generated application.");
  const [isPrivate, setIsPrivate] = useState(false);
  const [licenseTemplate, setLicenseTemplate] = useState("mit");
  const [githubToken, setGithubToken] = useState("");

  const handleExport = async () => {
    if (!parsedConfig?.app?.id) return;
    if (!repoName.trim()) {
      toast.error("Repository name is required");
      return;
    }

    setIsExporting(true);
    try {
      const payload = {
        appId: parsedConfig.app.id,
        repoName,
        isPrivate,
        description,
        licenseTemplate: licenseTemplate !== "none" ? licenseTemplate : undefined,
        userGithubToken: githubToken || undefined,
      };

      const res = await apiClient.post("/export/github", payload);
      if (res.data.success) {
        setRepoUrl(res.data.repoUrl);
        setExportSuccess(true);
        
        // Trigger confetti
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function() {
          const timeLeft = animationEnd - Date.now();

          if (timeLeft <= 0) {
            return clearInterval(interval);
          }

          const particleCount = 50 * (timeLeft / duration);
          confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
          confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);

        toast.success("Export successful! Enjoy your new repository.");
      }
    } catch (e: any) {
      if (e.response?.status === 422 && e.response?.data?.error === "repo_exists") {
         toast.error(`Repository name already exists. Try ${e.response.data.suggestion}`);
      } else if (e.response?.status === 401) {
         toast.error("Authentication required to export. Please sign in.");
      } else {
         toast.error("Failed to export to GitHub.");
      }
    } finally {
      setIsExporting(false);
    }
  };

  const resetState = () => {
    setExportSuccess(false);
    setRepoUrl("");
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) resetState(); }}>
      <DialogTrigger className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8 text-[13px] border-border-default space-x-1 outline-none cursor-pointer bg-background")}>
        <Github className="w-3.5 h-3.5 fill-current" />
        <span>Export</span>
      </DialogTrigger>
      <DialogContent className="max-w-[450px] bg-background border">
        {!exportSuccess ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-foreground flex items-center space-x-2">
                <Github className="w-5 h-5 text-primary" />
                <span>Export to GitHub</span>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="gh-reponame">Repository Name</Label>
                <Input id="gh-reponame" value={repoName} onChange={e => setRepoName(e.target.value)} placeholder="my-ai-app" className="col-span-3 text-sm h-8" />
              </div>
              
              <div className="space-y-2">
                 <div className="flex items-center justify-between">
                    <Label htmlFor="gh-desc">Description</Label>
                    <button 
                      onClick={() => {
                        const entities = parsedConfig?.entities?.map((e: any) => e.name).join(", ") || "";
                        const pages = parsedConfig?.pages?.length || 0;
                        setDescription(`A ${pages}-page AI application with ${entities} built with AI Studio.`);
                      }}
                      className="text-[10px] text-primary hover:underline font-medium"
                    >
                      Auto-generate
                    </button>
                 </div>
                 <Textarea id="gh-desc" value={description} onChange={e => setDescription(e.target.value)} className="text-sm min-h-[60px]" placeholder="Brief description of your app..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gh-license">License</Label>
                  <select 
                    id="gh-license"
                    value={licenseTemplate}
                    onChange={e => setLicenseTemplate(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="none">None</option>
                    <option value="mit">MIT License</option>
                    <option value="apache-2.0">Apache License 2.0</option>
                    <option value="gpl-3.0">GNU GPLv3</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                   <Label htmlFor="gh-visibility">Visibility</Label>
                   <select 
                    id="gh-visibility"
                    onChange={e => setIsPrivate(e.target.value === "private")}
                    value={isPrivate ? "private" : "public"}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gh-token">GitHub Token (Optional)</Label>
                <Input type="password" id="gh-token" value={githubToken} onChange={e => setGithubToken(e.target.value)} placeholder="Leave blank to use system token" className="text-sm h-8" />
                <p className="text-[10px] text-muted-foreground leading-tight">
                  Provide a personal access token with &quot;repo&quot; scope if the system default lacks permissions or if you want it credited entirely to your account.
                </p>
              </div>

              <Button onClick={handleExport} disabled={isExporting || !parsedConfig} className="w-full h-9 text-xs">
                {isExporting ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <Github className="w-3.5 h-3.5 mr-2" />}
                {isExporting ? "Exporting..." : "Create Repository"}
              </Button>
            </div>
          </>
        ) : (
          <div className="py-10 flex flex-col items-center text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-emerald-50 border-4 border-emerald-500/20 flex items-center justify-center animate-in zoom-in duration-500">
               <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Successfully Popped!</h2>
              <p className="text-muted-foreground max-w-[280px] text-sm">
                Your repository <span className="font-mono text-foreground font-semibold px-1 bg-muted rounded">{repoName}</span> is now live on GitHub.
              </p>
            </div>
            <div className="flex flex-col w-full gap-3">
              <a 
                href={repoUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className={cn(buttonVariants({ variant: "default" }), "w-full bg-foreground text-background hover:bg-foreground/90 flex items-center justify-center gap-2")}
              >
                <Github className="w-4 h-4" />
                View on GitHub
                <ExternalLink className="w-3 h-3 opacity-50" />
              </a>
              <Button variant="outline" onClick={() => setOpen(false)} className="w-full">
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
