"use client";

import * as React from "react";
import { MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";

export interface RowAction {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onSelect: () => void;
  destructive?: boolean;
  /** Renders a divider above this item. */
  separatorBefore?: boolean;
}

/**
 * The per-row "⋯" menu used by the module tables.
 *
 * Every row action lives behind one trigger rather than a strip of icons, so a
 * table can gain "View details" without the row growing another column — and
 * so the same gesture means the same thing in every module.
 *
 * "View details" is always first: it's the non-destructive, always-available
 * action, and the one a viewer without edit rights is usually after.
 */
export function RowActions({
  onView,
  onEdit,
  onDelete,
  extra = [],
  label = "Row actions",
}: {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  /** Module-specific items, appended after the standard ones. */
  extra?: RowAction[];
  label?: string;
}) {
  const items: RowAction[] = [
    ...(onView ? [{ label: "View details", icon: Eye, onSelect: onView }] : []),
    ...extra,
    ...(onEdit
      ? [{ label: "Edit", icon: Pencil, onSelect: onEdit, separatorBefore: true }]
      : []),
    ...(onDelete
      ? [
          {
            label: "Delete",
            icon: Trash2,
            onSelect: onDelete,
            destructive: true,
            separatorBefore: !onEdit,
          },
        ]
      : []),
  ];
  if (items.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={label}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {items.map((item, i) => (
          <React.Fragment key={item.label}>
            {item.separatorBefore && i > 0 && <DropdownMenuSeparator />}
            <DropdownMenuItem
              variant={item.destructive ? "destructive" : undefined}
              onClick={item.onSelect}
            >
              {item.icon && <item.icon className="h-3.5 w-3.5" />}
              {item.label}
            </DropdownMenuItem>
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
