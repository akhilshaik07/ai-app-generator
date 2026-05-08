"use client";

import React, { useState, useEffect } from "react";
import { History, Save, DownloadCloud, Clock, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppStore } from "@/store/use-app-store";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase-client";

export function VersionControl() {
  const parsedConfig = useAppStore(s => s.parsedConfig);
  const setRawConfig = useAppStore(s => s.setRawConfig);
  const setValidationResult = useAppStore(s => s.setValidationResult);
  const [open, setOpen] = useState(false);
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });
  }, []);

  const fetchSnapshots = async () => {
    if (!parsedConfig?.app?.id) return;
    setIsLoading(true);
    try {
      const res = await apiClient.get(`/config/${parsedConfig.app.id}/snapshots`);
      setSnapshots(res.data.snapshots || []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load history");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => fetchSnapshots(), 0);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, parsedConfig?.app?.id]);

  const handleSave = async () => {
    if (!parsedConfig?.app?.id) return;
    setIsSaving(true);
    try {
      await apiClient.post(`/config/${parsedConfig.app.id}/snapshot`, {
        name: name || "Untitled Snapshot",
        description,
        config: JSON.stringify(parsedConfig)
      });
      toast.success("Snapshot saved successfully");
      setName("");
      setDescription("");
      fetchSnapshots();
    } catch (e) {
      toast.error("Failed to save snapshot");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestore = (config: any) => {
    const raw = JSON.stringify(config, null, 2);
    setRawConfig(raw);
    toast.success("Restored version config");
    setOpen(false);
    setTimeout(() => {
      apiClient.post("/config/validate", { config: raw })
        .then(res => setValidationResult(res.data))
        .catch(e => console.error(e));
    }, 100);
  };

  const handleDelete = async (snapshotId: string) => {
    if (!parsedConfig?.app?.id) return;
    try {
      await apiClient.delete(`/config/${parsedConfig.app.id}/snapshots/${snapshotId}`);
      toast.success("Snapshot deleted successfully");
      fetchSnapshots();
    } catch (e) {
      toast.error("Failed to delete snapshot");
    }
  };

  if (!user) return null; // Only show version control for logged in users

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8 text-[13px] border-border-default space-x-1 outline-none cursor-pointer bg-background")}>
        <History className="w-3.5 h-3.5" />
        <span>Versions</span>
      </DialogTrigger>
      <DialogContent className="max-w-[600px] bg-background border">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center space-x-2">
            <History className="w-5 h-5 text-primary" />
            <span>Version Control</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-6 mt-4">
          <div className="space-y-4">
             <h4 className="text-sm font-medium text-foreground">Save Current State</h4>
             <div className="space-y-2">
                <Label htmlFor="v-name">Snapshot Name</Label>
                <Input id="v-name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Added User Authentication" className="h-8 text-sm" />
             </div>
             <div className="space-y-2">
                <Label htmlFor="v-desc">Description (optional)</Label>
                <Input id="v-desc" value={description} onChange={e => setDescription(e.target.value)} placeholder="Summary of changes..." className="h-8 text-sm" />
             </div>
             <Button onClick={handleSave} disabled={isSaving || !parsedConfig} className="w-full h-8 text-xs">
                <Save className="w-3.5 h-3.5 mr-2" />
                {isSaving ? "Saving..." : "Save Snapshot"}
             </Button>
          </div>

          <div className="space-y-4 border-l pl-6">
             <h4 className="text-sm font-medium text-foreground">Snapshot History</h4>
             <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                {isLoading ? (
                  <p className="text-xs text-muted-foreground">Loading snapshots...</p>
                ) : snapshots.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No snapshots saved yet.</p>
                ) : (
                  Array.isArray(snapshots) && snapshots.slice().reverse().map((snap) => (
                    <div key={snap.id} className="p-3 bg-muted/50 border rounded-lg flex flex-col space-y-3 transition-colors hover:bg-muted">
                       <div className="flex justify-between items-start">
                          <div>
                            <h5 className="text-[13px] font-semibold text-foreground">{snap.name}</h5>
                            {snap.description && <p className="text-xs text-muted-foreground mt-1">{snap.description}</p>}
                            <div className="mt-2 font-mono text-[9px] text-muted-foreground/60 truncate bg-muted/30 px-1.5 py-0.5 rounded border border-border/50">
                               {typeof snap.config === 'object' ? JSON.stringify(snap.config).substring(0, 80) : String(snap.config).substring(0, 80)}...
                            </div>
                          </div>
                       </div>
                       <div className="flex items-center justify-between pt-3 border-t">
                          <span className="text-[10px] text-muted-foreground flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {new Date(snap.createdAt).toLocaleString(undefined, {
                                month: 'short', day: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                            })}
                          </span>
                          <div className="flex items-center space-x-1">
                            <Button variant="ghost" size="icon" onClick={() => handleRestore(snap.config)} className="h-6 w-6 text-foreground hover:text-primary hover:bg-primary/10" title="Restore Snapshot">
                               <DownloadCloud className="w-3.5 h-3.5" /> 
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(snap.id)} className="h-6 w-6 text-foreground hover:text-destructive hover:bg-destructive/10" title="Delete Snapshot">
                               <Trash2 className="w-3.5 h-3.5" /> 
                            </Button>
                          </div>
                       </div>
                    </div>
                  ))
                )}
             </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
