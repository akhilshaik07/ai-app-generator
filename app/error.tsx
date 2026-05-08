"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-full items-center justify-center p-6">
      <div className="max-w-md rounded-[8px] border border-red-200 bg-white p-6 text-center shadow-sm shadow-black/[0.04]">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-[8px] border border-red-200 bg-red-50 text-red-600">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Something went wrong</h2>
        <p className="mt-2 text-[13px] leading-6 text-muted-foreground">
          The interface hit an unexpected error. Your configuration and database are unchanged.
        </p>
        {error?.message && (
          <div className="mt-4 rounded-[8px] border border-border bg-[#fbfaf7] p-3 text-left font-mono text-[11px] text-muted-foreground">
            {error.message}
          </div>
        )}
        <Button onClick={reset} className="mt-5">
          <RotateCcw className="h-3.5 w-3.5" />
          Try again
        </Button>
      </div>
    </div>
  );
}
