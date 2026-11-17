"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Loader2, SearchCheck, ShieldAlert, ShieldX } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { useAppSelector } from "@/src/lib/stores/hooks";
import { payslipHashPayload } from "@/src/lib/payroll/run-builder";
import { sha256Hex } from "@/src/lib/payroll/hash";
import { verifyHref } from "@/src/lib/payroll/constants";
import type { Payslip } from "@/src/lib/payroll/types";

/**
 * Public, login-free payslip check for banks, landlords and embassies.
 * Shows only what's needed to confirm authenticity — name (shortened),
 * period, net pay and issuer — and re-hashes the stored figures so an
 * altered record can never verify.
 */
export function VerifyPayslipPage({ code }: { code?: string }) {
  const router = useRouter();
  const [input, setInput] = useState(code ?? "");
  const [settled, setSettled] = useState(false);
  const byTenant = useAppSelector((s) => s.payroll.byTenant);

  // Give persisted payroll data a moment to hydrate before reporting "not found".
  useEffect(() => {
    const t = setTimeout(() => setSettled(true), 1200);
    return () => clearTimeout(t);
  }, []);

  const normalised = (code ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const match = useMemo<Payslip | null>(() => {
    if (!normalised) return null;
    for (const t of Object.values(byTenant)) {
      const p = t.payslips.find((x) => x.verification.code.replace(/-/g, "") === normalised);
      if (p) return p;
    }
    return null;
  }, [byTenant, normalised]);

  const intact = match ? sha256Hex(payslipHashPayload(match)) === match.verification.hash : false;
  const shortName = match ? shorten(match.employee.fullName) : "";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const c = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (c.length !== 12) return;
    router.push(verifyHref(`${c.slice(0, 4)}-${c.slice(4, 8)}-${c.slice(8)}`));
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 px-4 py-16 text-slate-900">
      <div className="w-full max-w-lg">
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">MOTEE</p>
          <h1 className="mt-1 text-2xl font-bold">Payslip verification</h1>
          <p className="mt-1 text-sm text-slate-500">Confirm a payslip was genuinely issued, and hasn&apos;t been altered.</p>
        </div>

        <form onSubmit={submit} className="flex gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="XXXX-XXXX-XXXX"
            className="border-0 font-mono text-base tracking-widest shadow-none focus-visible:ring-0"
            aria-label="Verification code"
          />
          <Button type="submit" className="gap-1.5"><SearchCheck className="h-4 w-4" /> Verify</Button>
        </form>

        {code && (
          <div className="mt-5">
            {!match && !settled ? (
              <Result tone="pending" icon={<Loader2 className="h-6 w-6 animate-spin" />} title="Checking…" />
            ) : !match ? (
              <Result tone="bad" icon={<ShieldX className="h-6 w-6" />} title="No payslip matches this code">
                Check the code was typed correctly. A payslip that doesn&apos;t verify should not be relied on.
              </Result>
            ) : match.verification.revoked ? (
              <Result tone="bad" icon={<ShieldAlert className="h-6 w-6" />} title="This payslip has been withdrawn">
                {match.company.tradingName} has revoked this payslip ({match.period.label}). Please ask the employee for a current one.
              </Result>
            ) : !intact ? (
              <Result tone="bad" icon={<ShieldX className="h-6 w-6" />} title="Record failed its integrity check">
                The stored figures don&apos;t match the payslip&apos;s fingerprint. Treat it as unverified.
              </Result>
            ) : (
              <Result tone="good" icon={<BadgeCheck className="h-6 w-6" />} title="This payslip is genuine">
                <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
                  <dt className="text-slate-500">Employee</dt>
                  <dd className="font-medium">{shortName}</dd>
                  <dt className="text-slate-500">Period</dt>
                  <dd className="font-medium">{match.period.label}</dd>
                  <dt className="text-slate-500">Net pay</dt>
                  <dd className="font-semibold tabular-nums">
                    ₦{match.computation.net.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </dd>
                  <dt className="text-slate-500">Issued by</dt>
                  <dd className="font-medium">{match.company.legalName}</dd>
                  <dt className="text-slate-500">Reference</dt>
                  <dd className="font-mono text-xs">{match.reference}</dd>
                </dl>
                <p className="mt-3 text-xs text-slate-500">
                  Compare these with the printed payslip. If the net pay or name differ, the document has been altered.
                </p>
              </Result>
            )}
          </div>
        )}
        <p className="mt-8 text-center text-[11px] text-slate-400">
          Only the details above are ever shown here. No login is needed and no other pay information is disclosed.
        </p>
      </div>
    </main>
  );
}

function shorten(name: string): string {
  const [first, ...rest] = name.split(/\s+/);
  return [first, ...rest.map((r) => `${r[0]}.`)].join(" ");
}

function Result({ tone, icon, title, children }: { tone: "good" | "bad" | "pending"; icon: React.ReactNode; title: string; children?: React.ReactNode }) {
  const styles = {
    good: "border-emerald-200 bg-emerald-50 text-emerald-700",
    bad: "border-rose-200 bg-rose-50 text-rose-700",
    pending: "border-slate-200 bg-white text-slate-500",
  }[tone];
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border ${styles}`}>{icon}</span>
        <div className="min-w-0 flex-1 text-slate-700">
          <p className="pt-2.5 text-base font-semibold text-slate-900">{title}</p>
          {children && <div className="mt-1 text-sm">{children}</div>}
        </div>
      </div>
    </div>
  );
}
