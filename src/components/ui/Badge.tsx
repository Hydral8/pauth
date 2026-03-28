import type { HTMLAttributes, PropsWithChildren } from "react";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: "default" | "live" | "success" | "warning";
}

export function Badge({ children, className = "", tone = "default", ...props }: PropsWithChildren<BadgeProps>) {
  return (
    <span className={`badge badge-${tone} ${className}`.trim()} {...props}>
      {children}
    </span>
  );
}
