import { AlertTriangle } from "lucide-react";

interface PendingAckBannerProps {
  count: number;
}

export function PendingAckBanner({ count }: PendingAckBannerProps) {
  if (count === 0) return null;

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900">
      <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
      <p className="text-sm text-amber-700 dark:text-amber-400">
        You have{" "}
        <span className="font-semibold">
          {count} announcement{count > 1 ? "s" : ""}
        </span>{" "}
        requiring your acknowledgement.
      </p>
    </div>
  );
}
