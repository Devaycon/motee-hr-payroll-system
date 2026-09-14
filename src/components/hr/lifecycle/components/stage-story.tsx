"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowUpRight, Quote, Sparkles } from "lucide-react";
import { cn } from "@/src/lib/utils";
import {
  LIFECYCLE_STAGES,
  STAGE_COLOR_CLASSES,
  STAGE_COLOR_HEX,
} from "../data";
import { guideForStage } from "../guide-data";
import { FlowChips } from "./flow-chips";
import { ExampleBlock } from "./example-block";
import { StageNumberBadge } from "./stage-number";

/** The connecting thread running behind every stage icon, flowing through each stage's own colour in turn. */
const THREAD_GRADIENT = `linear-gradient(180deg, ${LIFECYCLE_STAGES.map(
  (s, i) => `${STAGE_COLOR_HEX[s.color]} ${(i / (LIFECYCLE_STAGES.length - 1)) * 100}%`,
).join(", ")})`;

interface StageStoryProps {
  /** Lets the closing panel hand the reader off to the live Journey Map tab. */
  onViewJourney?: () => void;
}

/**
 * Replaces the old accordion with a scroll-driven narrative: every stage is
 * always visible, in order, connected by one continuous coloured thread —
 * read top to bottom like a story, rather than clicked open one at a time.
 * A sticky chapter rail tracks where the reader is and jumps on click.
 */
export function StageStory({ onViewJourney }: StageStoryProps) {
  const [activeId, setActiveId] = useState(LIFECYCLE_STAGES[0].id);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  function jumpTo(stageId: string) {
    sectionRefs.current[stageId]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  // Scrollspy for the chapter rail, kept separate from the reveal animation
  // below — sharing one narrow "midpoint of the viewport" band between both
  // meant a stage's content stayed invisible until the reader scrolled far
  // enough to cross that band, including the very first stage on page load.
  useEffect(() => {
    const entries = Object.entries(sectionRefs.current).filter(
      (e): e is [string, HTMLDivElement] => e[1] !== null,
    );
    const observer = new IntersectionObserver(
      (observed) => {
        const hit = observed.find((o) => o.isIntersecting);
        if (hit) {
          const match = entries.find(([, el]) => el === hit.target);
          if (match) setActiveId(match[0]);
        }
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: 0 },
    );
    entries.forEach(([, el]) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
      {/* Mobile chapter strip — the sticky side rail below doesn't fit narrow screens. */}
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:hidden">
        {LIFECYCLE_STAGES.map((stage) => {
          const colors = STAGE_COLOR_CLASSES[stage.color];
          const active = activeId === stage.id;
          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => jumpTo(stage.id)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                active
                  ? cn(colors.bg, colors.text, "border-transparent")
                  : "border-border bg-card text-muted-foreground",
              )}
            >
              {stage.step}. {stage.label}
            </button>
          );
        })}
      </div>

      {/*
        Desktop chapter rail. The outer div stretches to match the story
        column's full height (the default flex align-items: stretch) so the
        inner `sticky` nav has somewhere to stay stuck — a sticky element can
        only stay pinned for as long as its own box is tall, and shrinking
        this wrapper to the nav's intrinsic (short) height would make it
        scroll away after the first screenful.
      */}
      <div className="hidden shrink-0 lg:block lg:w-64">
        <nav className="sticky top-24 flex flex-col gap-1">
          {LIFECYCLE_STAGES.map((stage) => {
            const active = activeId === stage.id;
            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => jumpTo(stage.id)}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors",
                  active ? "bg-muted/60" : "hover:bg-muted/30",
                )}
              >
                <StageNumberBadge
                  step={stage.step}
                  className={cn(
                    "transition-all",
                    active ? "scale-110 ring-2 ring-blue-500/30" : "opacity-60 group-hover:opacity-100",
                  )}
                />
                <span
                  className={cn(
                    "truncate text-base font-bold transition-colors",
                    active ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {stage.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* The story itself. */}
      <div className="min-w-0 flex-1">
        {/*
          The thread is scoped to this wrapper alone, not the closing panel
          below — it used to sit in a `relative` ancestor shared with the
          panel, so its `bottom-7` anchored to the bottom of the panel
          instead of the last stage, making the line climb straight through
          it.
        */}
        <div className="relative">
          <div
            aria-hidden
            className="pointer-events-none absolute left-[27px] top-7 bottom-7 hidden w-0.5 sm:block"
            style={{ background: THREAD_GRADIENT }}
          />

          <div className="flex flex-col gap-16">
          {LIFECYCLE_STAGES.map((stage) => {
            const guide = guideForStage(stage.id);
            const colors = STAGE_COLOR_CLASSES[stage.color];
            const Icon = stage.icon;

            return (
              <motion.div
                key={stage.id}
                ref={(el) => {
                  sectionRefs.current[stage.id] = el;
                }}
                className="scroll-mt-24"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <div className="flex items-start gap-4 sm:gap-5">
                  <div
                    className={cn(
                      "relative z-10 flex size-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-lg",
                      colors.solid,
                    )}
                  >
                    <Icon className="size-6" />
                  </div>

                  <div className="relative min-w-0 flex-1 pt-1">
                    <span
                      aria-hidden
                      className="pointer-events-none absolute -top-3 right-0 hidden select-none text-7xl font-black leading-none text-foreground/[0.04] sm:block sm:text-8xl"
                    >
                      {String(stage.step).padStart(2, "0")}
                    </span>

                    <p
                      className={cn(
                        "text-[11px] font-bold uppercase tracking-[0.2em]",
                        colors.text,
                      )}
                    >
                      Stage {stage.step} of {LIFECYCLE_STAGES.length}
                    </p>
                    <h3 className="mt-1 text-2xl font-bold text-foreground sm:text-[1.75rem]">
                      {stage.label}
                    </h3>
                    <p className={cn("mt-1 text-base font-medium italic", colors.text)}>
                      &ldquo;{stage.question}&rdquo;
                    </p>

                    <p className="relative mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                      {guide?.overview ?? stage.description}
                    </p>

                    {guide?.flow && (
                      <div className="mt-5 space-y-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          How it flows
                        </p>
                        <FlowChips steps={guide.flow} color={stage.color} />
                      </div>
                    )}

                    {guide?.sections && guide.sections.length > 0 && (
                      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {guide.sections.map((section) => (
                          <div
                            key={section.heading}
                            className={cn(
                              "rounded-xl border-t-2 bg-card p-4 shadow-sm ring-1 ring-border/60",
                              colors.border,
                            )}
                          >
                            <p className="text-xs font-semibold text-foreground">
                              {section.heading}
                            </p>
                            <ul className="mt-2 space-y-1.5">
                              {section.bullets.map((b) => (
                                <li
                                  key={b}
                                  className="flex gap-2 text-xs text-muted-foreground"
                                >
                                  <span
                                    className={cn(
                                      "mt-1 size-1 shrink-0 rounded-full",
                                      colors.solid,
                                    )}
                                  />
                                  <span>{b}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    )}

                    {guide?.example && (
                      <div className="mt-5">
                        <ExampleBlock example={guide.example} color={stage.color} />
                      </div>
                    )}

                    {guide?.callout && (
                      <div
                        className={cn(
                          "mt-5 flex gap-3 rounded-xl border-l-4 bg-muted/30 p-4",
                          colors.border,
                        )}
                      >
                        <Quote className={cn("size-4 shrink-0", colors.text)} />
                        <div>
                          <p className="text-xs font-semibold text-foreground">
                            {guide.callout.title}
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                            {guide.callout.body}
                          </p>
                        </div>
                      </div>
                    )}

                    <Link
                      href={stage.href}
                      className={cn(
                        "mt-5 inline-flex items-center gap-1 text-xs font-semibold hover:underline",
                        colors.text,
                      )}
                    >
                      Open {stage.label}
                      <ArrowUpRight className="size-3.5" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 mt-14 flex flex-col items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-6 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 size-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                That&apos;s the story — here&apos;s what&apos;s actually moving
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Switch to the Journey Map to see live counts for every stage
                right now.
              </p>
            </div>
          </div>
          {onViewJourney && (
            <button
              type="button"
              onClick={onViewJourney}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              View Journey Map
              <ArrowUpRight className="size-3.5" />
            </button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
