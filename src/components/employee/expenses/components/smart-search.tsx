"use client";

import { Search, Sparkles, X } from "lucide-react";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import type { ParsedQuery, ParsedTermKind } from "../nl-search";

const KIND_LABEL: Record<ParsedTermKind, string> = {
  category: "Category",
  amount: "Amount",
  date: "Date",
  status: "Status",
  text: "Merchant",
};

interface SmartSearchProps {
  value: string;
  onChange: (next: string) => void;
  parsed: ParsedQuery;
  /** How many claims the query matched, for the "no results" case. */
  resultCount: number;
}

/**
 * §8.8 — natural-language expense search.
 *
 * The chips are the important half. A parser that quietly misreads a query and
 * returns nothing is indistinguishable from having no matching claims, so
 * every term it understood is shown and can be removed individually.
 */
export function SmartSearch({
  value,
  onChange,
  parsed,
  resultCount,
}: SmartSearchProps) {
  function removeTerm(source: string) {
    // Strip just this term's text and tidy up the spacing left behind.
    const next = value
      .replace(new RegExp(source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"), "")
      .replace(/\s+/g, " ")
      .trim();
    onChange(next);
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value}
          placeholder="Try: travel over 500 last month"
          className="pl-9 pr-9"
          aria-label="Search expenses"
          onChange={(e) => onChange(e.target.value)}
        />
        {value && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground"
            aria-label="Clear search"
            onClick={() => onChange("")}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {value.trim() && (
        <div className="flex flex-wrap items-center gap-1.5">
          {parsed.terms.length > 0 ? (
            <>
              <Sparkles
                className="h-3 w-3 text-[#7F77DD]"
                aria-hidden
              />
              <span className="text-[11px] text-muted-foreground">
                Reading as
              </span>
              {parsed.terms.map((term, i) => (
                <Badge
                  key={`${term.kind}-${i}`}
                  variant="secondary"
                  className="gap-1 py-0 pl-2 pr-1 text-[10px]"
                >
                  <span className="text-muted-foreground">
                    {KIND_LABEL[term.kind]}:
                  </span>
                  {term.label}
                  <button
                    type="button"
                    className="rounded p-0.5 hover:bg-background/60"
                    aria-label={`Remove ${term.label} filter`}
                    onClick={() => removeTerm(term.source)}
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </Badge>
              ))}
              <span className="text-[11px] text-muted-foreground">
                · {resultCount} match{resultCount === 1 ? "" : "es"}
              </span>
            </>
          ) : (
            <span className="text-[11px] text-muted-foreground">
              Searching titles, merchants and notes for &ldquo;{value.trim()}
              &rdquo;
            </span>
          )}
        </div>
      )}
    </div>
  );
}
