"use client";

import Link from "next/link";
import { Download, FileSpreadsheet, FileText, MoreHorizontal, Sheet } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/src/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { FORMAT_LABELS, type ExportFormat } from "@/src/lib/payroll/exports";
import { cn } from "@/src/lib/utils";

export interface RowAction {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  /** Navigate. */
  href?: string;
  onSelect?: () => void;
  disabled?: boolean;
  /** A download item: shows Excel / CSV / PDF as a sub-menu. */
  download?: { formats?: ExportFormat[]; onDownload: (f: ExportFormat) => void };
  tone?: "danger";
  /** Draw a separator above this item. */
  separated?: boolean;
}

/**
 * The ⋯ actions button used on every row and card that drills down: "View
 * details" first, then the other actions. One pattern across payroll.
 */
export function RowActions({ actions, label = "Actions", className, align = "end" }: { actions: RowAction[]; label?: string; className?: string; align?: "start" | "end" }) {
  const shown = actions.filter(Boolean);
  if (!shown.length) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" className={cn("h-7 w-7 shrink-0", className)} aria-label={label} onClick={(e) => e.stopPropagation()}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="min-w-48" onClick={(e) => e.stopPropagation()}>
        {shown.map((a, i) => {
          const Icon = a.icon;
          const body = (
            <>
              {Icon && <Icon className="h-3.5 w-3.5" />}
              {a.label}
            </>
          );
          const sep = a.separated && i > 0 ? <DropdownMenuSeparator /> : null;
          if (a.download) {
            return (
              <span key={a.label}>
                {sep}
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="gap-2 text-xs">{Icon ? <Icon className="h-3.5 w-3.5" /> : <Download className="h-3.5 w-3.5" />}{a.label}</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {(a.download.formats ?? ["xlsx", "csv", "pdf"]).map((f) => (
                      <DropdownMenuItem key={f} className="gap-2 text-xs" onClick={() => a.download!.onDownload(f)}>
                        <FormatIcon f={f} /> {FORMAT_LABELS[f]}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </span>
            );
          }
          return (
            <span key={a.label}>
              {sep}
              {a.href ? (
                <DropdownMenuItem asChild className="gap-2 text-xs" disabled={a.disabled}>
                  <Link href={a.href}>{body}</Link>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem className={cn("gap-2 text-xs", a.tone === "danger" && "text-rose-600")} disabled={a.disabled} onClick={a.onSelect}>
                  {body}
                </DropdownMenuItem>
              )}
            </span>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function FormatIcon({ f }: { f: ExportFormat }) {
  if (f === "pdf") return <FileText className="h-3.5 w-3.5" />;
  if (f === "csv") return <Sheet className="h-3.5 w-3.5" />;
  return <FileSpreadsheet className="h-3.5 w-3.5" />;
}

/** "Download ▾" with Excel / CSV / PDF — every payroll download offers PDF. */
export function DownloadMenu({
  onDownload,
  formats = ["xlsx", "csv", "pdf"],
  label = "Download",
  disabled,
  size = "sm",
  title,
}: {
  onDownload: (f: ExportFormat) => void;
  formats?: ExportFormat[];
  label?: string;
  disabled?: boolean;
  size?: "sm" | "xs";
  title?: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline" className={cn("gap-1.5", size === "xs" && "h-7 text-[11px]")} disabled={disabled}>
          <Download className="h-3.5 w-3.5" /> {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {title && <DropdownMenuLabel className="text-[11px]">{title}</DropdownMenuLabel>}
        {formats.map((f) => (
          <DropdownMenuItem key={f} className="gap-2 text-xs" onClick={() => onDownload(f)}>
            <FormatIcon f={f} /> {FORMAT_LABELS[f]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Drill-down modal: title, a facts grid, then any detail. */
export function DetailModal({
  open,
  onClose,
  title,
  description,
  facts,
  actions,
  children,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  facts?: { label: string; value: React.ReactNode; tone?: "good" | "bad" | "warn" }[];
  actions?: React.ReactNode;
  children?: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className={cn("max-h-[88vh] overflow-y-auto", wide ? "sm:max-w-4xl" : "sm:max-w-2xl")}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {facts && facts.length > 0 && (
          <div className="grid grid-cols-2 gap-3 rounded-lg bg-muted/40 p-3 sm:grid-cols-4">
            {facts.map((f) => (
              <div key={f.label} className="min-w-0">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{f.label}</p>
                <p className={cn("truncate text-sm font-semibold tabular-nums", f.tone === "bad" && "text-rose-600", f.tone === "good" && "text-emerald-700 dark:text-emerald-400", f.tone === "warn" && "text-amber-700 dark:text-amber-400")}>{f.value}</p>
              </div>
            ))}
          </div>
        )}
        {children}
        {actions && <div className="flex flex-wrap justify-end gap-2 border-t pt-3">{actions}</div>}
      </DialogContent>
    </Dialog>
  );
}
