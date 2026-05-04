"use client";

import { useState } from "react";
import {
  Download,
  Eye,
  TrendingUp,
  Banknote,
  ReceiptText,
  X,
  Lock,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Separator } from "@/src/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { DEMO_MY_PAYSLIPS, DEMO_MY_PROFILE } from "@/src/data/employee-demo";

function formatCurrency(amount: number) {
  return `₦${amount.toLocaleString("en-NG")}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface PayslipBreakdown {
  earnings: { label: string; amount: number }[];
  deductions: { label: string; amount: number }[];
}

function getBreakdown(gross: number): PayslipBreakdown {
  const paye = Math.round(gross * 0.12);
  const pension = Math.round(gross * 0.08);
  const nhf = Math.round(gross * 0.025);
  const housing = Math.round(gross * 0.015);
  return {
    earnings: [
      { label: "Basic Salary", amount: Math.round(gross * 0.6) },
      { label: "Housing Allowance", amount: Math.round(gross * 0.2) },
      { label: "Transport Allowance", amount: Math.round(gross * 0.1) },
      { label: "Meal Allowance", amount: Math.round(gross * 0.1) },
    ],
    deductions: [
      { label: "PAYE Tax", amount: paye },
      { label: "Pension (8%)", amount: pension },
      { label: "NHF (2.5%)", amount: nhf },
      { label: "Housing Levy", amount: housing },
    ],
  };
}

export function MyPayslipsPage() {
  const payslips = DEMO_MY_PAYSLIPS;
  const p = DEMO_MY_PROFILE;

  const [viewingId, setViewingId] = useState<string | null>(null);

  const viewing = payslips.find((ps) => ps.id === viewingId) ?? null;

  const ytdGross = payslips.reduce((s, ps) => s + ps.gross, 0);
  const ytdDeductions = payslips.reduce((s, ps) => s + ps.deductions, 0);
  const ytdNet = payslips.reduce((s, ps) => s + ps.net, 0);
  const ytdPaye = payslips.reduce(
    (s, ps) => s + Math.round(ps.gross * 0.12),
    0,
  );

  const breakdown = viewing ? getBreakdown(viewing.gross) : null;

  return (
    <div className="flex flex-col gap-5 pb-10">
      <div className="py-6 w-fit">
        <h1 className="text-4xl font-bold text-foreground">Payslips</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          View and download your monthly payslips.
        </p>
      </div>

      {/* YTD summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "YTD Gross Pay",
            value: formatCurrency(ytdGross),
            icon: TrendingUp,
            color: "#7F77DD",
          },
          {
            label: "YTD Deductions",
            value: formatCurrency(ytdDeductions),
            icon: ReceiptText,
            color: "#EF4444",
          },
          {
            label: "YTD Net Pay",
            value: formatCurrency(ytdNet),
            icon: Banknote,
            color: "#1D9E75",
          },
          {
            label: "YTD PAYE Tax",
            value: formatCurrency(ytdPaye),
            icon: ReceiptText,
            color: "#F59E0B",
          },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${s.color}18` }}
              >
                <s.icon className="w-4 h-4" style={{ color: s.color }} />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground leading-none">
                  {s.value}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {s.label}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main content — payslip list + salary info side by side */}
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_280px] gap-4 items-start">
        {/* Payslip list */}
        <Card>
          <CardHeader className="pb-0 pt-4 px-5">
            <p className="text-sm font-semibold text-foreground">
              Payslip History
            </p>
          </CardHeader>
          <Separator className="mt-3" />
          <CardContent className="px-5 pb-3 pt-0">
            <div className="flex flex-col">
              {[...payslips].reverse().map((ps) => (
                <div
                  key={ps.id}
                  className="flex items-center gap-4 py-3 border-b border-border/50 last:border-0"
                >
                  <div className="w-9 h-9 rounded-lg bg-[#7F77DD]/10 flex items-center justify-center shrink-0">
                    <ReceiptText className="w-4 h-4 text-[#7F77DD]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground">
                      {ps.period}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Paid {formatDate(ps.paidDate)} · Gross{" "}
                      {formatCurrency(ps.gross)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-[#1D9E75]">
                      {formatCurrency(ps.net)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Net pay</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:text-[#7F77DD]"
                      onClick={() => setViewingId(ps.id)}
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:text-[#1D9E75]"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Salary + bank info */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardContent className="p-4 flex flex-col gap-0">
              <p className="text-xs font-semibold text-foreground mb-3">
                Salary Information
              </p>
              <Separator className="mb-3" />
              {[
                { label: "Current Gross", value: formatCurrency(p.salary) },
                { label: "Employment Type", value: "Full-time" },
                { label: "Pay Frequency", value: "Monthly" },
                { label: "Currency", value: "NGN (₦)" },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0"
                >
                  <span className="text-[11px] text-muted-foreground">
                    {row.label}
                  </span>
                  <span className="text-[11px] font-medium text-foreground">
                    {row.value}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex flex-col gap-0">
              <p className="text-xs font-semibold text-foreground mb-3">
                Bank Account on File
              </p>
              <Separator className="mb-3" />
              {[
                { label: "Bank", value: p.bankAccount.bankName },
                { label: "Account Number", value: p.bankAccount.accountNumber },
                { label: "Account Name", value: p.bankAccount.accountName },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0"
                >
                  <span className="text-[11px] text-muted-foreground">
                    {row.label}
                  </span>
                  <span className="text-[11px] font-medium text-foreground font-mono">
                    {row.value}
                  </span>
                </div>
              ))}
              <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-3">
                <Lock className="w-3 h-3" /> Changes require HR approval.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Payslip Detail Modal */}
      <Dialog open={!!viewing} onOpenChange={() => setViewingId(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-[#7F77DD]/10">
                <ReceiptText className="w-4 h-4 text-[#7F77DD]" />
              </div>
              <div>
                <DialogTitle className="text-sm font-semibold">
                  {viewing?.period} Payslip
                </DialogTitle>
                <p className="text-[11px] text-muted-foreground">
                  Paid {viewing ? formatDate(viewing.paidDate) : ""}
                </p>
              </div>
            </div>
          </DialogHeader>

          {viewing && breakdown && (
            <div className="flex flex-col gap-4 py-2">
              {/* Earnings */}
              <div>
                <p className="text-xs font-semibold text-foreground mb-2">
                  Earnings
                </p>
                <div className="flex flex-col">
                  {breakdown.earnings.map((e) => (
                    <div
                      key={e.label}
                      className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0"
                    >
                      <span className="text-xs text-muted-foreground">
                        {e.label}
                      </span>
                      <span className="text-xs font-medium text-foreground">
                        {formatCurrency(e.amount)}
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between py-1.5 mt-1 bg-[#7F77DD]/5 rounded px-2">
                    <span className="text-xs font-semibold text-foreground">
                      Gross Pay
                    </span>
                    <span className="text-xs font-bold text-[#7F77DD]">
                      {formatCurrency(viewing.gross)}
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Deductions */}
              <div>
                <p className="text-xs font-semibold text-foreground mb-2">
                  Deductions
                </p>
                <div className="flex flex-col">
                  {breakdown.deductions.map((d) => (
                    <div
                      key={d.label}
                      className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0"
                    >
                      <span className="text-xs text-muted-foreground">
                        {d.label}
                      </span>
                      <span className="text-xs font-medium text-red-500">
                        -{formatCurrency(d.amount)}
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between py-1.5 mt-1 bg-red-500/5 rounded px-2">
                    <span className="text-xs font-semibold text-foreground">
                      Total Deductions
                    </span>
                    <span className="text-xs font-bold text-red-500">
                      -{formatCurrency(viewing.deductions)}
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Net */}
              <div className="flex items-center justify-between px-3 py-3 rounded-lg bg-[#1D9E75]/10 border border-[#1D9E75]/20">
                <span className="text-sm font-bold text-foreground">
                  Net Pay
                </span>
                <span className="text-lg font-bold text-[#1D9E75]">
                  {formatCurrency(viewing.net)}
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8"
              onClick={() => setViewingId(null)}
            >
              <X className="w-3.5 h-3.5 mr-1" /> Close
            </Button>
            <Button
              size="sm"
              className="text-xs h-8 bg-[#7F77DD] hover:bg-[#6c64cc] text-white gap-1.5"
            >
              <Download className="w-3.5 h-3.5" /> Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
