"use client";

import React, { useState } from "react";
import { useAppStore } from "../../store/use-app-store";
import { apiClient } from "../../lib/api-client";
import { AlertCircle, Loader2, Lock } from "lucide-react";

export function DynamicAuth() {
  const parsedConfig = useAppStore(s => s.parsedConfig);
  const [isSignIn, setIsSignIn] = useState(true);
  const t = useAppStore(s => s.getTranslation);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const appName = parsedConfig?.app.name || "App";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const endpoint = isSignIn ? "/auth/login" : "/auth/register";
      const res = await apiClient.post(endpoint, { email, password });

      const token = res.data.session?.access_token;
      if (token) {
        localStorage.setItem("jwt_token", token);
        alert("Success! " + (isSignIn ? "Logged in." : "Account created."));
      } else {
        alert("Success!");
      }

    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-[#fbfaf7] p-6">
      <div className="w-full max-w-[400px] overflow-hidden rounded-[8px] border border-border bg-white shadow-lg shadow-black/[0.08]">
        <div className="border-b border-border bg-[#111318] px-8 py-6 text-white">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-[8px] border border-white/10 bg-white/10">
            <Lock className="h-4 w-4" />
          </div>
          <h2 className="text-2xl font-semibold">{appName}</h2>
          <p className="mt-1 text-sm text-white/55">Secure access for this generated app.</p>
        </div>

        <div className="p-8">
          <div className="mb-6 grid grid-cols-2 rounded-[8px] border border-border bg-[#f4f2ec] p-1">
            <button
              onClick={() => { setIsSignIn(true); setError(""); }}
              className={`rounded-md py-1.5 text-sm font-medium transition-colors ${
                isSignIn ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("sign_in") || "Sign In"}
            </button>
            <button
              onClick={() => { setIsSignIn(false); setError(""); }}
              className={`rounded-md py-1.5 text-sm font-medium transition-colors ${
                !isSignIn ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("create_account") || "Create Account"}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-foreground">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={loading}
                className="w-full rounded-[8px] border border-border bg-[#fbfaf7] px-3 py-2 text-sm text-foreground outline-none focus:border-[#0f6b7a]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-foreground">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={loading}
                className="w-full rounded-[8px] border border-border bg-[#fbfaf7] px-3 py-2 text-sm text-foreground outline-none focus:border-[#0f6b7a]"
              />
              {error && (
                <div className="mt-2 flex items-start gap-1.5 text-xs text-red-700">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {error}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-4 flex h-10 w-full items-center justify-center rounded-[8px] bg-foreground py-2.5 text-[15px] font-medium text-background transition-colors hover:bg-[#252a33] disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (isSignIn ? t("sign_in") || "Sign In" : t("create_account") || "Create Account")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
