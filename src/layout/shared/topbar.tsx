import { ReactNode } from "react";
import { cn } from "@/src/lib/utils";

interface TopbarProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}

export function Topbar({ title, subtitle, actions, className }: TopbarProps) {
  return (
    <header
      className={cn(
        "flex items-center justify-between bg-background border-b border-border px-6",
        className,
      )}
      style={{ height: 56 }}
    >
      <div className="flex flex-col justify-center gap-0.5">
        <span className="text-sm font-semibold text-foreground leading-none">
          {title}
        </span>
        {subtitle && (
          <span className="text-xs text-muted-foreground leading-none">
            {subtitle}
          </span>
        )}
      </div>

      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
