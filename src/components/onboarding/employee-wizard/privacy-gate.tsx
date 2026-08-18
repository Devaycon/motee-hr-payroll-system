"use client";

import { useState } from "react";
import { ShieldCheck, FileText, ChevronRight } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Checkbox } from "@/src/components/ui/checkbox";
import { Separator } from "@/src/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import {
  PRIVACY_NOTICE_VERSION,
  PRIVACY_SUMMARY,
  PRIVACY_PURPOSES,
  PRIVACY_RECIPIENTS,
  PRIVACY_RETENTION,
  PRIVACY_SAFEGUARDS,
  PRIVACY_RIGHTS,
} from "@/src/lib/constants/privacy-notice";

interface PrivacyGateProps {
  employeeName: string;
  /** Called with the accepted notice version once the joiner consents. */
  onAccept: (version: string) => void;
}

/**
 * Consent gate shown before any personal data is collected (client feedback
 * §2.12, steps 1–3). The joiner sees a summary, can open the full notice, and
 * must tick to continue; the accepted version is handed back so it can be
 * stored against the record as an audit trail.
 */
export function PrivacyGate({ employeeName, onAccept }: PrivacyGateProps) {
  const [agreed, setAgreed] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);

  return (
    <div className="rounded-xl border border-border bg-card p-6 flex flex-col gap-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <ShieldCheck className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Before you start
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {employeeName ? `${employeeName}, we` : "We"} need your consent to
            collect and process your personal information.
          </p>
        </div>
      </div>

      <Separator />

      <p className="text-sm text-muted-foreground">{PRIVACY_SUMMARY}</p>

      <Button
        type="button"
        variant="outline"
        className="w-fit gap-1.5"
        onClick={() => setNoticeOpen(true)}
      >
        <FileText className="h-4 w-4" />
        View Privacy Notice
      </Button>

      <label className="flex items-start gap-2.5 cursor-pointer">
        <Checkbox
          checked={agreed}
          onCheckedChange={(v) => setAgreed(v === true)}
          className="mt-0.5"
          aria-describedby="privacy-consent-text"
        />
        <span id="privacy-consent-text" className="text-sm text-foreground">
          I have read and understood the Privacy Notice, and I consent to my
          personal data being processed as described.
        </span>
      </label>

      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] text-muted-foreground">
          Privacy Notice version {PRIVACY_NOTICE_VERSION} — your acceptance is
          recorded against this version.
        </p>
        <Button
          type="button"
          disabled={!agreed}
          className="gap-1.5"
          onClick={() => onAccept(PRIVACY_NOTICE_VERSION)}
        >
          Continue
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <PrivacyNoticeDialog open={noticeOpen} onOpenChange={setNoticeOpen} />
    </div>
  );
}

/**
 * The full notice (§2.12 step 2). Also reachable after onboarding, so the
 * joiner can re-read what they agreed to (step 4).
 */
export function PrivacyNoticeDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Privacy Notice</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 text-sm">
          <p className="text-xs text-muted-foreground">
            Version {PRIVACY_NOTICE_VERSION}
          </p>

          <Section title="Who collects your data">
            <p className="text-muted-foreground">
              Your employer is the Data Controller for the information collected
              during onboarding and throughout your employment.
            </p>
          </Section>

          <Section title="What we collect and why">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">
                      Data
                    </th>
                    <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">
                      Purpose
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {PRIVACY_PURPOSES.map((r) => (
                    <tr key={r.data}>
                      <td className="px-2 py-1.5 font-medium text-foreground">
                        {r.data}
                      </td>
                      <td className="px-2 py-1.5 text-muted-foreground">
                        {r.purpose}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section title="Who we share it with">
            <BulletList items={PRIVACY_RECIPIENTS} />
          </Section>

          <Section title="How long we keep it">
            <ul className="space-y-1">
              {PRIVACY_RETENTION.map((r) => (
                <li key={r.record} className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {r.record}:
                  </span>{" "}
                  {r.period}
                </li>
              ))}
            </ul>
          </Section>

          <Section title="How we protect it">
            <BulletList items={PRIVACY_SAFEGUARDS} />
          </Section>

          <Section title="Your rights">
            <BulletList items={PRIVACY_RIGHTS} />
          </Section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1">
      {items.map((i) => (
        <li key={i} className="text-xs text-muted-foreground">
          · {i}
        </li>
      ))}
    </ul>
  );
}
