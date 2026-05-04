"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X, GraduationCap } from "lucide-react";
import { cn } from "@/src/lib/utils";

type Side = "top" | "bottom" | "left" | "right";

interface Step {
  id: string;
  title: string;
  description: string;
  selector: string;
  side: Side;
}

const STEPS: Step[] = [
  {
    id: "search",
    title: "Search",
    description:
      "Find employees, documents, payslips and more — instantly searchable from anywhere in the platform.",
    selector: "[data-tutorial='search']",
    side: "bottom",
  },
  {
    id: "chat",
    title: "Messages",
    description:
      "Open the message panel to chat with colleagues, share files and collaborate in real time.",
    selector: "[data-tutorial='chat']",
    side: "bottom",
  },
  {
    id: "screenshare",
    title: "Screen Share",
    description:
      "Share your screen with one or more team members for live walkthroughs, reviews or remote support.",
    selector: "[data-tutorial='screenshare']",
    side: "bottom",
  },
  {
    id: "notifications",
    title: "Notifications",
    description:
      "Stay on top of leave approvals, new payslips, policy updates and important reminders.",
    selector: "[data-tutorial='notifications']",
    side: "bottom",
  },
  {
    id: "theme",
    title: "Theme",
    description:
      "Switch between light and dark mode at any time — your preference is always respected.",
    selector: "[data-tutorial='theme']",
    side: "bottom",
  },
  {
    id: "profile",
    title: "Your Profile",
    description:
      "Access your account details, role information and personal settings from here.",
    selector: "[data-tutorial='profile']",
    side: "bottom",
  },
  {
    id: "sidebar-overview",
    title: "Dashboard",
    description:
      "Your main overview — see attendance summaries, leave balances, goals and announcements at a glance.",
    selector: "[data-tutorial='sidebar-overview']",
    side: "right",
  },
  {
    id: "sidebar-nav",
    title: "Navigation",
    description:
      "All platform sections are grouped here. Click any section header to expand or collapse it.",
    selector: "[data-tutorial='sidebar-nav']",
    side: "right",
  },
  {
    id: "sidebar-upgrade",
    title: "Upgrade Plan",
    description:
      "Unlock advanced analytics, payroll automation and premium features by upgrading your plan.",
    selector: "[data-tutorial='sidebar-upgrade']",
    side: "right",
  },
];

const PAD = 10;
const TW = 284;
const OFFSET = 16;

type Spot = { top: number; left: number; right: number; bottom: number };

export function OnboardingTutorial() {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [spot, setSpot] = useState<Spot | null>(null);

  const measure = useCallback((s: number) => {
    const el = document.querySelector(STEPS[s]?.selector ?? "");
    if (!el) {
      setSpot(null);
      return false;
    }
    el.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "nearest",
    });
    const r = el.getBoundingClientRect();
    setSpot({
      top: r.top - PAD,
      left: r.left - PAD,
      right: r.right + PAD,
      bottom: r.bottom + PAD,
    });
    return true;
  }, []);

  const close = useCallback(() => {
    setActive(false);
    setSpot(null);
  }, []);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.shiftKey && e.key === "?") {
        setStep(0);
        setActive(true);
      }
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [close]);

  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => {
      const found = measure(step);
      if (!found) {
        if (step < STEPS.length - 1) {
          setStep((s) => s + 1);
        } else {
          close();
        }
      }
    }, 0);
    return () => clearTimeout(t);
  }, [active, step, measure, close]);

  useEffect(() => {
    if (!active) return;
    const fn = () => measure(step);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, [active, step, measure]);

  const next = useCallback(() => {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
    else close();
  }, [step, close]);

  const prev = useCallback(() => {
    if (step > 0) setStep((s) => s - 1);
  }, [step]);

  if (!active) return null;

  const cur = STEPS[step];
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const sr: Spot = spot ?? {
    top: vh / 2 - 20,
    left: vw / 2 - 60,
    right: vw / 2 + 60,
    bottom: vh / 2 + 20,
  };

  const sW = sr.right - sr.left;
  const sH = sr.bottom - sr.top;

  let tipTop: number;
  let tipLeft: number;

  if (cur.side === "bottom") {
    tipTop = Math.min(sr.bottom + OFFSET, vh - 200);
    tipLeft = Math.max(16, Math.min(sr.left + sW / 2 - TW / 2, vw - TW - 16));
  } else if (cur.side === "top") {
    tipTop = sr.top - OFFSET - 180;
    tipLeft = Math.max(16, Math.min(sr.left + sW / 2 - TW / 2, vw - TW - 16));
  } else if (cur.side === "right") {
    tipLeft = sr.right + OFFSET;
    tipTop = Math.max(16, Math.min(sr.top + sH / 2 - 90, vh - 220));
    if (tipLeft + TW > vw - 16) tipLeft = sr.left - OFFSET - TW;
  } else {
    tipLeft = sr.left - OFFSET - TW;
    tipTop = Math.max(16, Math.min(sr.top + sH / 2 - 90, vh - 220));
  }

  const AZ = 12;
  const AH = AZ / 2;
  let arrowStyle: React.CSSProperties = {};

  if (cur.side === "bottom") {
    const cx = sr.left + sW / 2;
    const rel = Math.max(AH + 10, Math.min(cx - tipLeft, TW - AH - 10));
    arrowStyle = {
      top: -AH,
      left: rel - AH,
      borderTop: "1px solid var(--border)",
      borderLeft: "1px solid var(--border)",
    };
  } else if (cur.side === "top") {
    const cx = sr.left + sW / 2;
    const rel = Math.max(AH + 10, Math.min(cx - tipLeft, TW - AH - 10));
    arrowStyle = {
      bottom: -AH,
      left: rel - AH,
      borderBottom: "1px solid var(--border)",
      borderRight: "1px solid var(--border)",
    };
  } else if (cur.side === "right") {
    const cy = sr.top + sH / 2;
    const rel = Math.max(AH + 10, Math.min(cy - tipTop, 150));
    arrowStyle = {
      left: -AH,
      top: rel - AH,
      borderBottom: "1px solid var(--border)",
      borderLeft: "1px solid var(--border)",
    };
  } else {
    const cy = sr.top + sH / 2;
    const rel = Math.max(AH + 10, Math.min(cy - tipTop, 150));
    arrowStyle = {
      right: -AH,
      top: rel - AH,
      borderTop: "1px solid var(--border)",
      borderRight: "1px solid var(--border)",
    };
  }

  const EASING = "cubic-bezier(0.4,0,0.2,1)";
  const OBG = "rgba(0,0,0,0.76)";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9000,
        pointerEvents: "none",
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Platform walkthrough"
    >
      <div
        style={{
          pointerEvents: "all",
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: sr.top,
          background: OBG,
          transition: `height 0.3s ${EASING}`,
        }}
        onClick={close}
      />
      <div
        style={{
          pointerEvents: "all",
          position: "absolute",
          top: sr.bottom,
          left: 0,
          right: 0,
          bottom: 0,
          background: OBG,
          transition: `top 0.3s ${EASING}`,
        }}
        onClick={close}
      />
      <div
        style={{
          pointerEvents: "all",
          position: "absolute",
          top: sr.top,
          left: 0,
          width: sr.left,
          height: sH,
          background: OBG,
          transition: `all 0.3s ${EASING}`,
        }}
        onClick={close}
      />
      <div
        style={{
          pointerEvents: "all",
          position: "absolute",
          top: sr.top,
          left: sr.right,
          right: 0,
          height: sH,
          background: OBG,
          transition: `all 0.3s ${EASING}`,
        }}
        onClick={close}
      />

      <div
        style={{
          position: "absolute",
          top: sr.top,
          left: sr.left,
          width: sW,
          height: sH,
          borderRadius: 12,
          border: "2px solid var(--primary)",
          boxShadow:
            "0 0 0 4px color-mix(in oklch, var(--primary) 22%, transparent), 0 0 30px color-mix(in oklch, var(--primary) 16%, transparent)",
          pointerEvents: "none",
          transition: `all 0.3s ${EASING}`,
        }}
      />

      <div style={{ pointerEvents: "all", position: "absolute", inset: 0 }}>
        <button
          onClick={close}
          style={{ position: "absolute", top: 16, right: 16 }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/50 backdrop-blur-sm hover:bg-black/70 border border-white/15 text-white text-xs font-medium transition-colors"
        >
          <X size={12} />
          Skip Tutorial
        </button>

        <div
          style={{ position: "absolute", top: 16, left: 16 }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/40 backdrop-blur-sm border border-white/10"
        >
          <GraduationCap size={12} className="text-white/60" />
          <span className="text-[10px] text-white/50 font-medium">
            Press{" "}
            <kbd className="px-1 py-0.5 rounded bg-white/10 text-white/70 text-[9px] font-mono">
              Shift + ?
            </kbd>{" "}
            anytime to restart
          </span>
        </div>

        <div
          style={{
            position: "absolute",
            top: tipTop,
            left: tipLeft,
            width: TW,
            transition: `top 0.3s ${EASING}, left 0.3s ${EASING}`,
          }}
          className="bg-card border border-border rounded-xl shadow-2xl overflow-visible"
        >
          <div
            style={{
              position: "absolute",
              width: AZ,
              height: AZ,
              background: "var(--card)",
              transform: "rotate(45deg)",
              ...arrowStyle,
            }}
          />

          <div className="flex items-start gap-3 px-4 pt-4 pb-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 shrink-0 mt-0.5">
              <GraduationCap size={14} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-card-foreground leading-snug">
                {cur.title}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Step {step + 1} of {STEPS.length}
              </p>
            </div>
          </div>

          <p className="px-4 pb-4 text-xs text-muted-foreground leading-relaxed">
            {cur.description}
          </p>

          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-accent/30 rounded-b-xl">
            <div className="flex items-center gap-1">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-200",
                    i === step
                      ? "w-4 bg-primary"
                      : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60",
                  )}
                />
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={prev}
                disabled={step === 0}
                className="flex items-center justify-center w-7 h-7 rounded-lg bg-accent hover:bg-muted text-muted-foreground disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={13} />
              </button>
              <button
                onClick={next}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity"
              >
                {step === STEPS.length - 1 ? "Finish" : "Next"}
                {step < STEPS.length - 1 && <ChevronRight size={12} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
