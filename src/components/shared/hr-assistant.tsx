"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Send, Sparkles } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/src/components/ui/sheet";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { cn } from "@/src/lib/utils";
import { useAppSelector } from "@/src/lib/stores/hooks";
import { useLocaleSection } from "@/src/lib/hooks/use-locale-data";
import { useCurrency } from "@/src/lib/hooks/use-currency";
import type { LocaleBundle } from "@/src/lib/types/locale";
import {
  answerQuestion,
  EMPLOYEE_SUGGESTIONS,
  HR_SUGGESTIONS,
  type AssistantAnswer,
  type AssistantPortal,
} from "@/src/lib/assistant/engine";

interface Message {
  id: number;
  role: "user" | "assistant";
  text: string;
  answer?: AssistantAnswer;
}

/**
 * MOTEE AI — the HR assistant. Employees ask about their own record ("How many
 * leave days do I have left?"); HR and managers ask about the organisation
 * ("Who are the top-performing sales staff this quarter?"). Every answer comes
 * from the tenant's own records and links to the module that owns it.
 */
export function HrAssistant({ portal }: { portal: AssistantPortal }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const nextId = useRef(1);
  const scrollRef = useRef<HTMLDivElement>(null);

  // HR sees its data scope (branch / role); an employee's answers are about
  // themselves, so the whole bundle is fine — the engine filters to them.
  const { data: bundle } = useLocaleSection<LocaleBundle>((b) => b, {
    scope: portal === "hr",
  });
  const edits = useAppSelector((s) => s.collectionEdits);
  const requests = useAppSelector((s) => s.approvals.requests);
  const user = useAppSelector((s) => s.auth.user);
  const country = useAppSelector((s) => s.locale.country);
  const { format } = useCurrency();

  const suggestions = portal === "hr" ? HR_SUGGESTIONS : EMPLOYEE_SUGGESTIONS;
  const firstName = user?.name?.split(" ")[0];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  function ask(question: string) {
    const q = question.trim();
    if (!q || !bundle || thinking) return;
    setMessages((m) => [...m, { id: nextId.current++, role: "user", text: q }]);
    setInput("");
    setThinking(true);
    // A beat before answering, so the reply reads as a response rather than
    // appearing in the same frame as the question.
    window.setTimeout(() => {
      const answer = answerQuestion(q, {
        bundle,
        edits,
        requests,
        portal,
        me: { employeeId: user?.employeeId, name: user?.name },
        country,
        formatMoney: (n) => format(n, { decimals: n % 1 !== 0 }),
      });
      setMessages((m) => [...m, { id: nextId.current++, role: "assistant", text: answer.text, answer }]);
      setThinking(false);
    }, 450);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-6 z-40 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label="Open the MOTEE HR assistant"
      >
        <Sparkles className="h-4 w-4" />
        <span className="hidden sm:inline">Ask MOTEE AI</span>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          <SheetHeader className="border-b border-border px-5 py-4">
            <SheetTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> MOTEE AI
            </SheetTitle>
            <SheetDescription className="text-xs">
              {portal === "hr"
                ? "Ask about your people, compliance, loans and performance."
                : "Ask about your leave, loans, certifications and profile."}{" "}
              Answers come from your HR records.
            </SheetDescription>
          </SheetHeader>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4">
            {messages.length === 0 ? (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-foreground">
                  Hi{firstName ? ` ${firstName}` : ""} — what would you like to know?
                </p>
                <div className="flex flex-col gap-1.5">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => ask(s)}
                      className="rounded-lg border border-border px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
                  >
                    <div
                      className={cn(
                        "max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm",
                        m.role === "user"
                          ? "rounded-br-sm bg-primary text-primary-foreground"
                          : "rounded-bl-sm bg-muted text-foreground",
                      )}
                    >
                      <p>{m.text}</p>
                      {m.answer?.rows && m.answer.rows.length > 0 && (
                        <div className="mt-2 flex flex-col divide-y divide-border/60 rounded-lg bg-background/70 text-xs">
                          {m.answer.rows.map((r, i) => {
                            const body = (
                              <>
                                <span className="min-w-0 flex-1 truncate">{r.label}</span>
                                {r.value && (
                                  <span className="shrink-0 text-muted-foreground tabular-nums">{r.value}</span>
                                )}
                              </>
                            );
                            // Suggestion rows (no value) re-ask the question.
                            if (!r.value && !r.href) {
                              return (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => ask(r.label)}
                                  className="px-2.5 py-1.5 text-left hover:text-primary"
                                >
                                  {r.label}
                                </button>
                              );
                            }
                            return r.href ? (
                              <Link
                                key={i}
                                href={r.href}
                                onClick={() => setOpen(false)}
                                className="flex items-center gap-2 px-2.5 py-1.5 hover:text-primary"
                              >
                                {body}
                              </Link>
                            ) : (
                              <div key={i} className="flex items-center gap-2 px-2.5 py-1.5">
                                {body}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {m.answer?.links && m.answer.links.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {m.answer.links.map((l) => (
                            <Link
                              key={l.href + l.label}
                              href={l.href}
                              onClick={() => setOpen(false)}
                              className="inline-flex items-center gap-0.5 rounded-full border border-border bg-background px-2 py-0.5 text-[11px] font-medium text-primary hover:border-primary/40"
                            >
                              {l.label} <ArrowUpRight className="h-3 w-3" />
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {thinking && (
                  <div className="flex justify-start">
                    <div className="flex gap-1 rounded-2xl rounded-bl-sm bg-muted px-3.5 py-3">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60"
                          style={{ animationDelay: `${i * 120}ms` }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <form
            className="flex items-center gap-2 border-t border-border px-4 py-3"
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
            }}
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={portal === "hr" ? "e.g. Who is on leave today?" : "e.g. How many leave days do I have left?"}
              className="h-9 text-sm"
              aria-label="Ask the HR assistant"
            />
            <Button type="submit" size="icon" className="h-9 w-9 shrink-0" disabled={!input.trim() || thinking}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
