import React from "react";
import { cn } from "@/lib/utils";

interface CodeProps extends React.HTMLAttributes<HTMLPreElement> {
  children: React.ReactNode;
}

/**
 * Code Component
 * A styled code container for displaying code snippets
 */
export function Code({ className, children, ...props }: CodeProps) {
  return (
    <pre
      className={cn(
        "p-3 rounded-md text-sm font-mono overflow-auto bg-slate-950 text-slate-50 dark:bg-slate-900",
        className
      )}
      {...props}
    >
      <code>{children}</code>
    </pre>
  );
}