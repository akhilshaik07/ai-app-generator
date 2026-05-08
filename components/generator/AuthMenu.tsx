"use client";

import React, { useState, useEffect } from "react";
import { User, LogOut, Settings } from "lucide-react";
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
import { Github } from "lucide-react";
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

  const hasRestoredRef = React.useRef(false);

  useEffect(() => {
    let cancelled = false;

    const syncSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (cancelled) return;
        setUser(session?.user || null);
        setDisplayName(session?.user?.user_metadata?.name || "");
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
      } catch (err) {
        console.error("Failed to load auth session", err);
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
      setDisplayName(session?.user?.user_metadata?.name || "");
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
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger className={cn(buttonVariants({ variant: "outline", size: "icon" }), "h-8 w-8 rounded-full bg-primary/10 border-primary/20 outline-none hover:bg-primary/20", "text-primary cursor-pointer")}>
            <User className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-surface border-border-default">
            <div className="flex items-center justify-start gap-2 p-2">
              <div className="flex flex-col space-y-1 leading-none">
                {user.user_metadata?.name && <p className="font-medium text-sm">{user.user_metadata.name}</p>}
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <DropdownMenuItem onClick={() => setProfileOpen(true)} className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>Manage Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout} className="text-red-400 focus:text-red-400 cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
          <DialogContent className="sm:max-w-[400px] bg-background border">
            <DialogHeader>
              <DialogTitle>Manage Profile</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
               <div className="space-y-2">
                 <Label htmlFor="displayName">Display Name</Label>
                 <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your Name" />
               </div>
               <div className="space-y-2 flex flex-col">
                 <Label>Email</Label>
                 <span className="text-sm text-muted-foreground rounded-md border px-3 py-2 bg-muted/50">{user.email}</span>
               </div>
               <Button onClick={handleUpdateProfile} disabled={isUpdatingProfile} className="w-full">
                 {isUpdatingProfile ? "Saving..." : "Save Changes"}
               </Button>
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
