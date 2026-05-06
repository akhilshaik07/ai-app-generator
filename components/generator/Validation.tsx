"use client";

import React, { useState } from "react";
import { useAppStore } from "../../store/use-app-store";
import { CheckCircle2, AlertCircle, AlertTriangle, ChevronUp, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export function Validation() {
  const validationResult = useAppStore(state => state.validationResult);
  const [expanded, setExpanded] = useState(false);

  if (!validationResult) return null;

  const { valid, errors, warnings } = validationResult;
  const hasIssues = errors.length > 0 || warnings.length > 0;

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-background border-t border-border flex flex-col z-40">
      {/* Status Bar */}
      <div 
        className="h-8 w-full flex items-center justify-between px-4 cursor-pointer hover:bg-accent transition-colors shrink-0"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center space-x-2 text-[12px] font-medium font-mono uppercase">
          {valid && warnings.length === 0 ? (
            <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> <span className="text-emerald-700">Valid</span></>
          ) : !valid ? (
            <><AlertCircle className="w-3.5 h-3.5 text-red-600" /> <span className="text-red-700">{errors.length} error{errors.length > 1 ? 's' : ''}</span></>
          ) : (
            <><AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> <span className="text-amber-700">{warnings.length} warning{warnings.length > 1 ? 's' : ''}</span></>
          )}
        </div>
        <button className="text-muted-foreground hover:text-foreground p-1 transition-colors">
          {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Expanded List */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 220, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-border"
          >
            <div className="h-[220px] overflow-auto p-2 bg-background">
              {!hasIssues ? (
                <div className="p-4 text-[13px] text-muted-foreground font-mono">No issues found. Engine is ready.</div>
              ) : (
                <div className="space-y-1">
                  {errors.map((err, i) => (
                    <motion.div
                      key={`err-${i}`}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: i * 0.04 }}
                      className="flex items-start space-x-3 p-2 bg-red-50 hover:bg-red-100 border border-red-200 rounded group cursor-pointer"
                    >
                      <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                      <div>
                        <div className="text-[12px] font-mono text-foreground mb-1">{err.path}</div>
                        <div className="text-[13px] text-muted-foreground">{err.message}</div>
                      </div>
                    </motion.div>
                  ))}
                  {warnings.map((warn, i) => (
                    <motion.div
                      key={`warn-${i}`}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: (errors.length + i) * 0.04 }}
                      className="flex items-start space-x-3 p-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded group cursor-pointer"
                    >
                      <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                      <div>
                        <div className="text-[12px] font-mono text-foreground mb-1">{warn.path}</div>
                        <div className="text-[13px] text-muted-foreground">{warn.message}</div>
                        {warn.suggestion && <div className="text-[11px] text-muted-foreground mt-1">Suggestion: {warn.suggestion}</div>}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
