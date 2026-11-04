import React from "react";

export function Skeleton({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-gray-200/90 dark:bg-gray-800/90 border border-transparent dark:border-gray-800/50 transition-colors ${className}`}
      {...props}
    />
  );
}
