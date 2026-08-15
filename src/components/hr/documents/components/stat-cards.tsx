import { FileText, Clock, AlertCircle, Archive } from "lucide-react";
import {
  HrStatCardsGrid,
  type HrStatCardItem,
} from "@/src/components/shared/hr-stat-card";
import type { HRDocument } from "../types";

/** The slice a KPI card drills the document grid down to. */
export type DocumentCardFilter = "all" | "expiring" | "expired" | "archived";

export const DOCUMENT_CARD_FILTER_LABELS: Record<
  Exclude<DocumentCardFilter, "all">,
  string
> = {
  expiring: "Expiring soon",
  expired: "Expired",
  archived: "Archived",
};

function getExpiryStatus(expiryDate?: string) {
  if (!expiryDate) return null;
  const today = new Date();
  const expiry = new Date(expiryDate);
  const daysLeft = Math.ceil(
    (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (daysLeft < 0) return "expired";
  if (daysLeft <= 30) return "expiring";
  return "valid";
}

/** Single source of truth for what each card counts and the grid then shows. */
export function matchesDocumentCardFilter(
  document: HRDocument,
  filter: DocumentCardFilter,
): boolean {
  switch (filter) {
    case "expiring":
      return !document.isArchived && getExpiryStatus(document.expiryDate) === "expiring";
    case "expired":
      return !document.isArchived && getExpiryStatus(document.expiryDate) === "expired";
    case "archived":
      return document.isArchived === true;
    default:
      return true;
  }
}

interface StatCardsProps {
  documents: HRDocument[];
  /** The card drill-down currently applied. */
  cardFilter: DocumentCardFilter;
  /** Drill-down: shows the documents behind the number, across all folders. */
  onDrillDown: (filter: DocumentCardFilter) => void;
}

export function StatCards({
  documents,
  cardFilter,
  onDrillDown,
}: StatCardsProps) {
  const count = (filter: DocumentCardFilter) =>
    documents.filter((d) => matchesDocumentCardFilter(d, filter)).length;
  const total = documents.filter((d) => !d.isArchived).length;

  const card = (key: DocumentCardFilter) => ({
    active: cardFilter === key,
    // Re-clicking the selected card clears back to every document.
    onClick: () => onDrillDown(cardFilter === key ? "all" : key),
  });

  const cards: HrStatCardItem[] = [
    {
      label: "Total Documents",
      value: total,
      sub: `${documents.length} including archived`,
      icon: FileText,
      tone: "blue",
      active: cardFilter === "all",
      onClick: () => onDrillDown("all"),
    },
    {
      label: "Expiring Soon",
      value: count("expiring"),
      sub: "Within 30 days",
      icon: Clock,
      tone: "amber",
      ...card("expiring"),
    },
    {
      label: "Expired",
      value: count("expired"),
      sub: "Renewal required",
      icon: AlertCircle,
      tone: "red",
      ...card("expired"),
    },
    {
      label: "Archived",
      value: count("archived"),
      sub: "Stored securely",
      icon: Archive,
      tone: "violet",
      ...card("archived"),
    },
  ];

  return <HrStatCardsGrid stats={cards} columns={4} />;
}
