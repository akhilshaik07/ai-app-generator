"use client";

import React, { useState } from "react";
import { useAppStore } from "../../store/use-app-store";
import { apiClient } from "../../lib/api-client";
import { Loader2 } from "lucide-react";

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
    <div className="flex flex-col items-center justify-center p-8 bg-base">
      <div className="w-full max-w-[400px] border border-border-default rounded-[14px] bg-surface overflow-hidden relative shadow-lg">
        {/* Subtle gradient top border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-30"></div>
        
        <div className="p-8">
          <h2 className="text-2xl font-bold text-center mb-6 text-text-primary">{appName}</h2>
          
          <div className="flex bg-elevated rounded-[7px] p-1 mb-6 border border-border-default">
             <button 
                onClick={() => { setIsSignIn(true); setError("") }}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors 
                  ${isSignIn ? 'bg-surface text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
             >
                {t('sign_in') || "Sign In"}
             </button>
             <button 
                onClick={() => { setIsSignIn(false); setError("") }}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors 
                  ${!isSignIn ? 'bg-surface text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
             >
                {t('create_account') || "Create Account"}
             </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[13px] font-medium text-text-secondary mb-1.5">Email address</label>
              <input 
                type="email" 
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={loading}
                className="w-full bg-base border border-border-default rounded-[7px] px-3 py-2 text-sm focus:border-accent outline-none text-text-primary"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-text-secondary mb-1.5">Password</label>
              <input 
                type="password" 
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={loading}
                className="w-full bg-base border border-border-default rounded-[7px] px-3 py-2 text-sm focus:border-accent outline-none text-text-primary"
              />
              {error && <div className="mt-2 text-xs text-accent-error">{error}</div>}
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full button-primary bg-accent hover:opacity-90 disabled:opacity-50 text-white font-medium text-[15px] py-2.5 rounded-[7px] mt-4 flex justify-center items-center h-10 transition-colors"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isSignIn ? t('sign_in') || "Sign In" : t('create_account') || "Create Account")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}