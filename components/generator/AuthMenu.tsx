"use client";

import React, { useState, useEffect } from "react";
import { User, LogOut, Settings, CreditCard, Shield, Activity, Github, Mail, Edit2, Camera } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase-client";
import { signInWithGitHub } from "@/lib/auth/github-auth";
import { saveUserActivity, clearUserActivity } from "@/lib/services/activity";
import { useAppStore } from "@/store/use-app-store";
import { apiClient } from "@/lib/api-client";

export function AuthMenu() {
  const user = useAppStore(state => state.user);
  const setUser = useAppStore(state => state.setUser);
  const isAuthMenuOpen = useAppStore(state => state.isAuthMenuOpen);
  const setIsAuthMenuOpen = useAppStore(state => state.setIsAuthMenuOpen);
  const restoreUserActivity = useAppStore(state => state.restoreUserActivity);
  const rawConfig = useAppStore(state => state.rawConfig);
  const currentPageSlug = useAppStore(state => state.currentPageSlug);
  const activeAppId = useAppStore(state => state.activeAppId);
  const editorPanelWidth = useAppStore(state => state.editorPanelWidth);
  const sidebarCollapsed = useAppStore(state => state.sidebarCollapsed);
  const parsedConfig = useAppStore(state => state.parsedConfig);
  
  const [profileOpen, setProfileOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");

  // Profile Edit State
  const [displayName, setDisplayName] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [userStats, setUserStats] = useState({ apps: 0, exports: 0 });

  const hasRestoredRef = React.useRef(false);

  useEffect(() => {
    if (user && profileOpen) {
      // Fetch user stats when profile is open
      apiClient.get("/apps").then(res => {
        setUserStats(prev => ({ ...prev, apps: res.data.apps?.length || 0 }));
      }).catch(console.error);
    }
  }, [user, profileOpen]);

  useEffect(() => {
    let cancelled = false;

    const syncSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (cancelled) return;
        setUser(session?.user || null);
        setDisplayName(session?.user?.user_metadata?.name || session?.user?.user_metadata?.full_name || "");
        if (session && typeof window !== "undefined") {
          localStorage.setItem("jwt_token", session.access_token);
          // Restore user activity after session init (only once)
          if (!hasRestoredRef.current) {
            hasRestoredRef.current = true;
            try {
              await restoreUserActivity();
            } catch (e) {
              console.warn("Activity restore failed (non-fatal):", e);
            }
          }
        }
      } catch (err: any) {
        const msg = err instanceof Error ? err.message : (typeof err === 'string' ? err : "Auth error");
        console.error("Failed to load auth session:", msg);
        if (!cancelled) {
          setUser(null);
          setDisplayName("");
        }
      }
    };

    syncSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (cancelled) return;
      setUser(session?.user || null);
      setDisplayName(session?.user?.user_metadata?.name || session?.user?.user_metadata?.full_name || "");
      if (session && typeof window !== "undefined") {
        localStorage.setItem("jwt_token", session.access_token);
        // Restore activity on explicit sign in (only if not already restored)
        if (_event === "SIGNED_IN" && !hasRestoredRef.current) {
          hasRestoredRef.current = true;
          try {
            await restoreUserActivity();
          } catch (e) {
            console.warn("Activity restore failed (non-fatal):", e);
          }
        }
      } else {
        if (typeof window !== "undefined") {
          localStorage.removeItem("jwt_token");
        }
        // Reset restore flag on sign out so next sign-in will restore
        hasRestoredRef.current = false;
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const handleUpdateProfile = async () => {
    setIsUpdatingProfile(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { name: displayName }
      });
      if (error) throw error;
      toast.success("Profile updated successfully");
      setProfileOpen(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleAuth = async (isSignUp: boolean) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    try {
      let data: any;
      let authError: any;

      if (isSignUp) {
        const response = await apiClient.post("/auth/register", { email, password });
        data = response.data;
        // apiClient throws on non-2xx, so if we're here it succeeded
      } else {
        const result = await supabase.auth.signInWithPassword({ email, password });
        data = result.data;
        authError = result.error;
      }

      if (authError) throw authError;

      if (isSignUp && data?.session?.access_token && typeof window !== "undefined") {
        localStorage.setItem("jwt_token", data.session.access_token);
      }

      if (isSignUp) {
        setSuccess("Account created! You can now log in.");
        setActiveTab("login");
        setEmail("");
        setPassword("");
      } else {
        setSuccess("Welcome back!");
        setTimeout(() => {
          setIsAuthMenuOpen(false);
          setSuccess(null);
        }, 1000);
      }
    } catch (err: any) {
      const raw = err?.response?.data?.error || err?.message || err?.error_description || "Something went wrong";
      if (raw.includes("Invalid login credentials")) {
        setError("Wrong email or password. Please try again.");
      } else if (raw.includes("User already registered")) {
        setError("An account with this email already exists. Try logging in.");
      } else if (raw.includes("Password should be")) {
        setError("Password must be at least 6 characters.");
      } else if (raw.includes("Unable to validate email")) {
        setError("Please enter a valid email address.");
      } else {
        setError(raw);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Save current activity before logout
      await saveUserActivity({
        appId: activeAppId,
        currentPageSlug,
        rawConfig,
        parsedConfig: parsedConfig || {},
        editorPanelWidth,
        sidebarCollapsed,
      });
      
      await supabase.auth.signOut();
      await clearUserActivity();
      toast.success("Logged out");
    } catch (err: any) {
      toast.error(err?.message || "Failed to log out");
    }
  };

  if (user) {
    const avatarUrl = user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`;

    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger className={cn(buttonVariants({ variant: "outline", size: "icon" }), "h-8 w-8 rounded-full border-primary/20 p-0 overflow-hidden outline-none hover:border-primary/40 transition-all relative", "cursor-pointer")}>
            <img src={avatarUrl} alt="User Avatar" className="w-full h-full object-cover" />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-background rounded-full" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 bg-surface border-border-default p-2">
            <div className="flex flex-col space-y-2 p-2 mb-2">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full overflow-hidden border border-border">
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col min-w-0 leading-tight">
                  <p className="font-semibold text-sm truncate">{displayName || "AI Architect"}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
            </div>
            
            <div className="h-[1px] bg-border-default mx-1 mb-1" />
            
            <DropdownMenuItem onClick={() => setProfileOpen(true)} className="cursor-pointer py-2 px-3 rounded-md focus:bg-primary/5 group transition-colors">
              <Settings className="mr-3 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <div className="flex flex-col">
                <span className="text-sm font-medium">Manage Profile</span>
                <span className="text-[10px] text-muted-foreground">Account & App settings</span>
              </div>
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={handleLogout} className="text-red-400 focus:text-red-500 cursor-pointer py-2 px-3 rounded-md focus:bg-red-50/50 group mt-1">
              <LogOut className="mr-3 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              <span className="text-sm font-medium">Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
          <DialogContent className="sm:max-w-[550px] p-0 bg-background border border-border overflow-hidden rounded-xl shadow-2xl">
            <div className="flex h-[450px]">
              {/* Sidebar */}
              <div className="w-[180px] border-r border-border bg-muted/30 p-4 flex flex-col space-y-1">
                <div className="text-[10px] font-bold uppercase text-muted-foreground px-2 mb-2 tracking-wider">Account</div>
                <Button variant="ghost" size="sm" className="justify-start gap-2 h-9 text-[13px] bg-primary/10 text-primary hover:bg-primary/10">
                  <User className="w-3.5 h-3.5" />
                  Overview
                </Button>
                <Button variant="ghost" size="sm" className="justify-start gap-2 h-9 text-[13px] text-muted-foreground hover:bg-muted">
                  <Shield className="w-3.5 h-3.5" />
                  Security
                </Button>
                <Button variant="ghost" size="sm" className="justify-start gap-2 h-9 text-[13px] text-muted-foreground hover:bg-muted">
                  <Github className="w-3.5 h-3.5" />
                  Connections
                </Button>
                
                <div className="mt-auto pt-4">
                  <div className="text-[10px] font-bold uppercase text-muted-foreground px-2 mb-2 tracking-wider">Plan</div>
                  <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-3 rounded-lg border border-primary/10">
                    <div className="text-[11px] font-bold text-primary mb-1">PRO PLAN</div>
                    <div className="text-[10px] text-muted-foreground leading-tight">Unlimited apps & priority support</div>
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <div className="flex-1 flex flex-col min-w-0">
                <DialogHeader className="p-6 border-b border-border bg-background/50 backdrop-blur-sm sticky top-0 z-10">
                  <DialogTitle className="text-xl font-heading flex items-center gap-2">
                    Profile Overview
                  </DialogTitle>
                </DialogHeader>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
                  {/* Header/Avatar */}
                  <div className="flex items-center gap-5">
                    <div className="relative group">
                      <div className="h-20 w-20 rounded-2xl overflow-hidden border-2 border-primary/20 shadow-lg ring-4 ring-primary/5 transition-all group-hover:ring-primary/10">
                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                      </div>
                      <button className="absolute -bottom-2 -right-2 p-2 rounded-full bg-background border border-border shadow-sm hover:bg-muted transition-colors">
                        <Camera className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </div>
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2">
                         <h3 className="font-bold text-lg leading-none truncate">{displayName || "AI Architect"}</h3>
                         <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 text-[9px] font-bold tracking-tighter uppercase border border-emerald-100">Verified</span>
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <Mail className="w-3 h-3" />
                        {user.email}
                      </p>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-1">
                      <div className="flex items-center justify-between">
                         <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Apps Built</span>
                         <Activity className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div className="text-2xl font-bold font-heading">{userStats.apps}</div>
                      <div className="text-[10px] text-muted-foreground leading-tight">Last built 2 days ago</div>
                    </div>
                    <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-1">
                      <div className="flex items-center justify-between">
                         <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">GitHub Exports</span>
                         <Github className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div className="text-2xl font-bold font-heading">12</div>
                      <div className="text-[10px] text-muted-foreground leading-tight">Total contributions</div>
                    </div>
                  </div>

                  {/* Form */}
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="displayName" className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider ml-1">Display Name</Label>
                      <div className="relative group">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input 
                          id="displayName" 
                          value={displayName} 
                          onChange={(e) => setDisplayName(e.target.value)} 
                          placeholder="Your Name" 
                          className="pl-10 h-11 bg-muted/30 border-border focus:ring-primary/20 focus:border-primary transition-all rounded-xl"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                       <Label className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider ml-1">Account Email</Label>
                       <div className="flex items-center gap-3 px-4 py-3 bg-muted/50 border border-border/50 rounded-xl">
                         <Mail className="w-4 h-4 text-muted-foreground/60" />
                         <span className="text-sm font-medium text-muted-foreground/80">{user.email}</span>
                         <span title="Identity Verified" className="ml-auto flex items-center">
                           <Shield className="w-3.5 h-3.5 text-emerald-500" />
                         </span>
                       </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-border mt-4 flex items-center justify-between gap-4">
                    <Button variant="ghost" onClick={() => setProfileOpen(false)} className="text-[13px] font-medium h-11 px-6 hover:bg-muted transition-all">
                      Cancel
                    </Button>
                    <Button onClick={handleUpdateProfile} disabled={isUpdatingProfile} className="flex-1 h-11 text-[13px] font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all rounded-xl">
                      {isUpdatingProfile ? (
                         <div className="flex items-center gap-2">
                           <Activity className="w-4 h-4 animate-spin" />
                           <span>Syncing...</span>
                         </div>
                      ) : (
                        "Update Identity"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <Dialog open={isAuthMenuOpen} onOpenChange={setIsAuthMenuOpen}>
      <DialogTrigger className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8 text-[13px] border-border-default outline-none bg-background cursor-pointer")}>
        Sign In
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px] bg-surface border-border-default">
        <DialogHeader>
          <DialogTitle className="text-text-primary">Authentication</DialogTitle>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as "login" | "signup"); setError(null); setSuccess(null); }} className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-2 bg-base">
            <TabsTrigger value="login" className="data-[state=active]:bg-elevated">Login</TabsTrigger>
            <TabsTrigger value="signup" className="data-[state=active]:bg-elevated">Sign Up</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login" className="space-y-4 pt-4">
            <Button 
              variant="outline" 
              className="w-full bg-surface border-border-default hover:bg-elevated"
              onClick={() => {
                setIsLoading(true);
                signInWithGitHub().catch(err => {
                  toast.error(err.message);
                  setIsLoading(false);
                });
              }}
              disabled={isLoading}
            >
              <Github className="mr-2 h-4 w-4" />
              Continue with GitHub
            </Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border-default" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-surface px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => { setEmail(e.target.value); setError(null); }} className="bg-base border-border-default" placeholder="you@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={e => { setPassword(e.target.value); setError(null); }} className="bg-base border-border-default" />
            </div>
            {error && (
              <div className="w-full px-3 py-2 rounded-md bg-red-50 border border-red-200 text-red-600 text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="w-full px-3 py-2 rounded-md bg-green-50 border border-green-200 text-green-600 text-sm">
                {success}
              </div>
            )}
            <Button className="w-full bg-accent hover:bg-accent/90" onClick={() => handleAuth(false)} disabled={isLoading}>
              {isLoading ? "Signing in..." : "Login"}
            </Button>
          </TabsContent>
          
          <TabsContent value="signup" className="space-y-4 pt-4">
            <Button 
              variant="outline" 
              className="w-full bg-surface border-border-default hover:bg-elevated"
              onClick={() => {
                setIsLoading(true);
                signInWithGitHub().catch(err => {
                  toast.error(err.message);
                  setIsLoading(false);
                });
              }}
              disabled={isLoading}
            >
              <Github className="mr-2 h-4 w-4" />
              Continue with GitHub
            </Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border-default" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-surface px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-up">Email</Label>
              <Input id="email-up" type="email" value={email} onChange={e => { setEmail(e.target.value); setError(null); }} className="bg-base border-border-default" placeholder="you@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password-up">Password</Label>
              <Input id="password-up" type="password" value={password} onChange={e => { setPassword(e.target.value); setError(null); }} className="bg-base border-border-default" />
            </div>
            {error && (
              <div className="w-full px-3 py-2 rounded-md bg-red-50 border border-red-200 text-red-600 text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="w-full px-3 py-2 rounded-md bg-green-50 border border-green-200 text-green-200 text-sm">
                {success}
              </div>
            )}
            <Button className="w-full bg-accent hover:bg-accent/90" onClick={() => handleAuth(true)} disabled={isLoading}>
              {isLoading ? "Creating account..." : "Create Account"}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
