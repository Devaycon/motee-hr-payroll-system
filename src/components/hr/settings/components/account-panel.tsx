"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Download, Trash2, RotateCcw, Zap, Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/src/components/ui/alert-dialog";
import type { AccountSettings, BillingRecord } from "../types";

interface Props {
  account: AccountSettings;
  billing: BillingRecord[];
}

const PLAN_COLORS: Record<string, string> = {
  starter:
    "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300",
  growth:
    "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-400",
  enterprise:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400",
};

export function AccountPanel({ account, billing }: Props) {
  const [clearLoading, setClearLoading] = useState(false);

  function handleClearDemo() {
    setClearLoading(true);
    setTimeout(() => {
      setClearLoading(false);
      toast.success("Demo data cleared.");
    }, 800);
  }

  const seatsPercent = Math.round((account.usedSeats / account.seats) * 100);

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm ring-1 ring-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Subscription</CardTitle>
          <CardDescription>
            Your current plan and usage details.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Company</p>
              <p className="font-semibold text-foreground">
                {account.companyName}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Plan</p>
              <Badge
                variant="outline"
                className={`${PLAN_COLORS[account.plan]}`}
              >
                <Zap className="mr-1 h-3 w-3" />
                {account.planLabel}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Renewal Date</p>
              <p className="font-medium">
                {new Date(account.renewalDate).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Contact</p>
              <p className="font-medium">{account.contactEmail}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                <span>Seats used</span>
              </div>
              <span className="font-medium">
                {account.usedSeats} / {account.seats}
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  seatsPercent >= 90
                    ? "bg-red-500"
                    : seatsPercent >= 70
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                }`}
                style={{ width: `${seatsPercent}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {account.seats - account.usedSeats} seats available
            </p>
          </div>

          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              Manage Subscription
            </Button>
            <Button size="sm" variant="outline">
              Upgrade Plan
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm ring-1 ring-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Billing History</CardTitle>
          <CardDescription>
            Download past invoices for your records.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-border overflow-hidden bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Period
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground"></th>
                </tr>
              </thead>
              <tbody>
                {billing.map((b) => (
                  <tr
                    key={b.id}
                    className="bg-card border-b border-border last:border-0"
                  >
                    <td className="px-4 py-3">{b.period}</td>
                    <td className="px-4 py-3 font-medium">
                      {b.currency} {b.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      {b.status === "paid" ? (
                        <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">
                          Paid
                        </span>
                      ) : b.status === "pending" ? (
                        <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400">
                          Pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400">
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 gap-1.5 text-xs"
                        asChild
                      >
                        <a href={b.downloadUrl} download>
                          <Download className="h-3.5 w-3.5" />
                          PDF
                        </a>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm ring-1 ring-destructive/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-destructive">
            Danger Zone
          </CardTitle>
          <CardDescription>
            Irreversible actions that affect your entire account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4 rounded-lg border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-800 dark:bg-amber-950/20">
            <div>
              <p className="text-sm font-medium text-foreground">
                Clear Demo Data
              </p>
              <p className="text-xs text-muted-foreground">
                Remove all demo records and start fresh with real data.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleClearDemo}
              disabled={clearLoading}
              className="gap-1.5 shrink-0"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {clearLoading ? "Clearing..." : "Clear Demo"}
            </Button>
          </div>

          <div className="flex items-center justify-between gap-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <div>
              <p className="text-sm font-medium text-foreground">
                Delete Account
              </p>
              <p className="text-xs text-muted-foreground">
                Permanently delete this company account and all associated data.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="destructive"
                  className="gap-1.5 shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Company Account</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete{" "}
                    <span className="font-semibold">{account.companyName}</span>{" "}
                    and all employees, records, payroll, and settings. This
                    action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() =>
                      toast.error(
                        "Account deletion requires owner confirmation via email.",
                      )
                    }
                  >
                    Delete Account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
