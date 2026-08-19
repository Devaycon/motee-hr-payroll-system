"use client";

import { CalendarDays } from "lucide-react";
import {
  HrStatCardsGrid,
  type HrStatCardItem,
  type HrStatCardTone,
} from "@/src/components/shared/hr-stat-card";
import { LEAVE_TYPE_LABELS } from "@/src/data/leave-demo";
import type { LeaveTypeName } from "@/src/lib/types/leave";
import type { LeaveBalance } from "./types";

const SHOWN_TYPES: LeaveTypeName[] = [
  "annual",
  "sick",
  "compassionate",
  "study",
];

/** Keeps each card's accent recognisable per leave type. */
const TYPE_TONES: Partial<Record<LeaveTypeName, HrStatCardTone>> = {
  annual: "blue",
  sick: "red",
  compassionate: "violet",
  study: "emerald",
};

interface BalanceCardsProps {
  balances: LeaveBalance;
  /** Starts a request for this leave type — the action behind the number. */
  onRequestType: (type: LeaveTypeName) => void;
}

export function BalanceCards({ balances, onRequestType }: BalanceCardsProps) {
  const cards: HrStatCardItem[] = SHOWN_TYPES.map((t) => {
    const b = balances[t];
    const rem = b.total - b.used - b.pending;
    return {
      // "Annual Leave Remaining", not "Annual Remaining" — the shared labels
      // are the bare type name (§14.4).
      label: `${LEAVE_TYPE_LABELS[t]} Leave Remaining`,
      value: `${rem} / ${b.total} days`,
      sub: b.pending > 0 ? `${b.pending} days pending` : "Request this leave",
      icon: CalendarDays,
      tone: TYPE_TONES[t] ?? "violet",
      onClick: () => onRequestType(t),
    };
  });

  return <HrStatCardsGrid stats={cards} columns={4} />;
}
