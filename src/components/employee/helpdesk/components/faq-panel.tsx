"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Badge } from "@/src/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Search, Plus, BookOpen, ThumbsUp } from "lucide-react";
import {
  FAQ_ARTICLES,
  TICKET_CATEGORY_CONFIG,
  TICKET_CATEGORY_OPTIONS,
  CATEGORY_ICON_MAP,
} from "./data";
import type { TicketCategory } from "./data";

interface Props {
  onSubmitCase: () => void;
}

export function FaqPanel({ onSubmitCase }: Props) {
  const [faqSearch, setFaqSearch] = useState("");
  const [faqCategory, setFaqCategory] = useState<TicketCategory | "all">("all");
  const [helpfulVotes, setHelpfulVotes] = useState<Set<string>>(new Set());

  const filteredFaqs = useMemo(() => {
    return FAQ_ARTICLES.filter((f) => {
      const matchCat = faqCategory === "all" || f.category === faqCategory;
      const matchSearch =
        !faqSearch ||
        f.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
        f.answer.toLowerCase().includes(faqSearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [faqSearch, faqCategory]);

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search FAQs…"
            value={faqSearch}
            onChange={(e) => setFaqSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={faqCategory}
          onValueChange={(v) => setFaqCategory(v as TicketCategory | "all")}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {TICKET_CATEGORY_OPTIONS.map((c) => {
              const I = CATEGORY_ICON_MAP[c];
              return (
                <SelectItem key={c} value={c}>
                  <div className="flex items-center gap-1.5">
                    <I
                      className={`h-3.5 w-3.5 ${TICKET_CATEGORY_CONFIG[c].color}`}
                    />
                    {TICKET_CATEGORY_CONFIG[c].label}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {faqSearch && (
        <div className="p-3 rounded-lg bg-[#4361ee]/5 border border-[#4361ee]/20 text-xs text-[#4361ee]">
          {filteredFaqs.length} result{filteredFaqs.length !== 1 ? "s" : ""} for
          &ldquo;{faqSearch}&rdquo;
          {filteredFaqs.length === 0 && (
            <span className="text-muted-foreground">
              {" "}
              — can&apos;t find what you&apos;re looking for?{" "}
              <button
                onClick={onSubmitCase}
                className="text-[#4361ee] underline font-medium"
              >
                Submit a case
              </button>
            </span>
          )}
        </div>
      )}

      <div className="space-y-3">
        {filteredFaqs.map((faq) => {
          const catCfg = TICKET_CATEGORY_CONFIG[faq.category];
          const isHelpful = helpfulVotes.has(faq.id);
          return (
            <Card key={faq.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-lg ${catCfg.bg} ${catCfg.border} border shrink-0`}
                  >
                    {(() => {
                      const I = CATEGORY_ICON_MAP[faq.category];
                      return <I className={`h-4 w-4 ${catCfg.color}`} />;
                    })()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground leading-snug">
                        {faq.question}
                      </p>
                      <Badge
                        variant="outline"
                        className={`text-xs shrink-0 ${catCfg.color} ${catCfg.bg} ${catCfg.border}`}
                      >
                        {catCfg.label}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                      {faq.answer}
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" /> {faq.views} views
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="h-3 w-3" />{" "}
                        {faq.helpful + (isHelpful ? 1 : 0)} helpful
                      </span>
                      <button
                        onClick={() =>
                          setHelpfulVotes((prev) => {
                            const next = new Set(prev);
                            if (next.has(faq.id)) next.delete(faq.id);
                            else next.add(faq.id);
                            return next;
                          })
                        }
                        className={`ml-auto flex items-center gap-1 px-2 py-0.5 rounded-full border transition-colors ${
                          isHelpful
                            ? "bg-[#4361ee]/10 border-[#4361ee]/40 text-[#4361ee]"
                            : "border-border hover:border-[#4361ee]/40 hover:text-[#4361ee]"
                        }`}
                      >
                        <ThumbsUp className="h-3 w-3" />
                        {isHelpful ? "Helpful" : "Mark helpful"}
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredFaqs.length === 0 && !faqSearch && (
        <div className="text-center py-10 text-muted-foreground text-sm">
          No FAQs in this category yet.
        </div>
      )}

      <Card className="border-dashed border-[#4361ee]/30 bg-[#4361ee]/5">
        <CardContent className="p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">
              Can&apos;t find your answer?
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Submit a case and our HR team will get back to you.
            </p>
          </div>
          <Button
            size="sm"
            onClick={onSubmitCase}
            className="bg-[#4361ee] hover:bg-[#3451d1] text-white"
          >
            <Plus className="h-4 w-4 mr-1" /> Submit a Case
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
