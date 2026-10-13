"use client";

import type { ReactNode } from "react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import { cn } from "@/src/lib/utils";

export const NOT_INTEGRATED_MESSAGE =
  "This feature has not been integrated yet.";

function messageFor(label?: string): string {
  return label
    ? `${label} has not been integrated yet.`
    : NOT_INTEGRATED_MESSAGE;
}

/** The feedback shown when someone tries to use something not yet wired up. */
export function notifyNotIntegrated(label?: string): void {
  // One id, so repeated clicks update a single toast instead of stacking.
  toast.info(messageFor(label), { id: "not-integrated" });
}

interface NotIntegratedProps {
  children: ReactNode;
  /** What this is, for the message: "Chat has not been integrated yet." */
  label?: string;
  /** For buttons, tabs and other inline pieces. Blocks are the default. */
  inline?: boolean;
  /** Whole screens also get a banner, since a tooltip is easy to miss. */
  page?: boolean;
  className?: string;
}

/**
 * Marks part of the approved design that has no working endpoint behind it
 * yet. The piece stays exactly where the design puts it — blurred, inert, and
 * answering any click with the reason — so what is still to be integrated is
 * visible on the screen rather than missing from it.
 *
 * To ship the feature, wire it up and remove this wrapper.
 */
export function NotIntegrated({
  children,
  label,
  inline = false,
  page = false,
  className,
}: NotIntegratedProps) {
  const Wrapper = inline ? "span" : "div";
  const message = messageFor(label);

  return (
    <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Wrapper
          aria-disabled
          data-not-integrated
          className={cn(
            "relative cursor-not-allowed",
            inline ? "inline-flex" : "block",
            className,
          )}
          onClickCapture={(event) => {
            event.preventDefault();
            event.stopPropagation();
            notifyNotIntegrated(label);
          }}
        >
          {page && (
            <span className="sticky top-20 z-20 mx-auto mb-3 flex w-fit items-center rounded-full border border-amber-500/40 bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
              {message}
            </span>
          )}
          <Wrapper
            inert
            className={cn(
              "pointer-events-none select-none opacity-60 blur-[1.5px]",
              inline ? "inline-flex" : "block",
            )}
          >
            {children}
          </Wrapper>
          {/* Sits over the content so the pointer always lands on the wrapper. */}
          <span aria-hidden className="absolute inset-0 z-10" />
        </Wrapper>
      </TooltipTrigger>
      <TooltipContent>{message}</TooltipContent>
    </Tooltip>
    </TooltipProvider>
  );
}
