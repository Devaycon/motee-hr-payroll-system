"use client";

import { Badge } from "@/src/components/ui/badge";
import { cn } from "@/src/lib/utils";
import {
  CERT_STATUS_DOT,
  CERT_STATUS_LABELS,
  CERT_STATUS_STYLES,
  certStatus,
  daysToExpiry,
} from "@/src/lib/certifications/status";

/**
 * Renewal badge for a certification: 🟢 Active · 🟡 Expires in 60 days ·
 * 🟠 Expires in 30 days · 🔴 Expired. The tooltip gives the exact day count.
 */
export function CertStatusBadge({
  expiresAt,
  className,
}: {
  expiresAt?: string | null;
  className?: string;
}) {
  const status = certStatus(expiresAt);
  const d = daysToExpiry(expiresAt);
  const title =
    d == null
      ? "This certification does not expire"
      : d < 0
        ? `Expired ${-d} day${d === -1 ? "" : "s"} ago`
        : `Expires in ${d} day${d === 1 ? "" : "s"}`;
  return (
    <Badge
      variant="outline"
      title={title}
      className={cn("gap-1.5 text-[10px] font-medium", CERT_STATUS_STYLES[status], className)}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", CERT_STATUS_DOT[status])} aria-hidden />
      {CERT_STATUS_LABELS[status]}
    </Badge>
  );
}
