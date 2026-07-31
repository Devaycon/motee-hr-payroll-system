"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Pencil,
  Mail,
  Briefcase,
  DollarSign,
  ShieldCheck,
  Building2,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { PermissionGate } from "@/src/components/shared/permission-gate";
import {
  Section,
  StatStrip,
  InfoGrid,
  formatDuration,
  fmtDate,
  titleCase,
} from "@/src/components/hr/employees/employee-detail/ui";
import { formatMoney } from "@/src/lib/hooks/use-currency";
import { PersonPhoto } from "@/src/components/shared/person-photo";
import { cn } from "@/src/lib/utils";
import type { EorWorker, EorProvider } from "../types";
import {
  EOR_WORKER_STATUS_LABELS,
  EOR_WORKER_STATUS_STYLES,
  EOR_PROVIDER_STATUS_LABELS,
  EOR_PROVIDER_STATUS_STYLES,
  EOR_COMPLIANCE_LABELS,
  EOR_COMPLIANCE_STYLES,
  formatUsd,
} from "../data";

type SectionKey = "engagement" | "contact" | "cost" | "compliance" | "provider";

const NAV: { key: SectionKey; label: string; icon: typeof Mail }[] = [
  { key: "engagement", label: "Engagement", icon: Briefcase },
  { key: "contact", label: "Contact", icon: Mail },
  { key: "cost", label: "Cost Breakdown", icon: DollarSign },
  { key: "compliance", label: "Compliance", icon: ShieldCheck },
  { key: "provider", label: "Provider", icon: Building2 },
];

interface WorkerDetailProps {
  worker: EorWorker;
  provider?: EorProvider;
  onBack: () => void;
  onEdit: () => void;
}

export function WorkerDetail({ worker, provider, onBack, onEdit }: WorkerDetailProps) {
  const [active, setActive] = useState<SectionKey>("engagement");

  const money = (n: number) => formatMoney(n, worker.currencySymbol);
  const totalLocal =
    worker.grossSalaryMonthly + worker.employerCost + worker.managementFee;
  const compliantCount = worker.compliance.filter(
    (c) => c.status === "complete" || c.status === "not_applicable",
  ).length;

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">EOR Worker</h1>
            <p className="text-sm text-muted-foreground">
              Engaged via {worker.providerName}
            </p>
          </div>
        </div>
        <PermissionGate module="organization.eor" action="edit">
          <Button size="sm" variant="outline" className="gap-1.5" onClick={onEdit}>
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </Button>
        </PermissionGate>
      </div>

      {/* Top: avatar card + Personal details */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5 lg:items-stretch">
        <Card className="lg:h-full">
          <CardContent className="px-5 py-6 flex flex-col items-center gap-4 h-full">
            <div className="w-full aspect-square overflow-hidden rounded-2xl bg-primary/10 shrink-0 flex items-center justify-center">
              <PersonPhoto
                name={worker.name}
                gender={worker.gender}
                className="h-full w-full"
                fallbackClassName="text-4xl"
              />
            </div>
            <h2 className="text-xl font-bold text-foreground text-center break-words">
              {worker.name}
            </h2>
            <p className="text-sm text-muted-foreground -mt-2">{worker.role}</p>
            <Badge
              variant="outline"
              className={cn("text-xs", EOR_WORKER_STATUS_STYLES[worker.status])}
            >
              {EOR_WORKER_STATUS_LABELS[worker.status]}
            </Badge>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardContent className="px-5 py-5">
            <Section title="Personal" description="Personal details on record.">
              <InfoGrid
                rows={[
                  { label: "Title", value: worker.title },
                  { label: "Legal First Name", value: worker.legalFirstName },
                  { label: "Middle Name(s)", value: worker.middleName },
                  { label: "Legal Last Name", value: worker.legalLastName },
                  { label: "Preferred Name", value: worker.preferredName },
                  { label: "Maiden Name", value: worker.maidenName },
                  { label: "Initials", value: worker.initials },
                  { label: "Date of birth", value: fmtDate(worker.dateOfBirth) },
                  { label: "Gender", value: titleCase(worker.gender) },
                  { label: "Marital status", value: worker.maritalStatus },
                  { label: "Nationality", value: worker.nationality },
                ]}
              />
            </Section>
          </CardContent>
        </Card>
      </div>

      {/* Stat strip */}
      <StatStrip
        items={[
          { label: "Monthly cost (USD)", value: formatUsd(worker.monthlyCostUsd), accent: "text-emerald-600" },
          { label: "Gross / mo", value: money(worker.grossSalaryMonthly) },
          { label: "Employer cost", value: money(worker.employerCost) },
          { label: "Mgmt fee", value: money(worker.managementFee) },
          { label: "Compliance", value: `${compliantCount}/${worker.compliance.length}` },
          { label: "Tenure", value: formatDuration(worker.startDate) },
        ]}
      />

      {/* Section nav + content */}
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-5 lg:min-h-[24rem]">
        <nav className="rounded-xl bg-card text-card-foreground shadow-xs ring-1 ring-foreground/10 overflow-hidden lg:h-full">
          <div className="flex flex-col gap-0.5 px-4 py-5">
            {NAV.map((item) => {
              const Icon = item.icon;
              const isActive = item.key === active;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setActive(item.key)}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        <Card className="min-w-0">
          <CardContent className="px-5 py-5">
            {active === "engagement" && (
              <Section title="Engagement" description="Role and EOR engagement details.">
                <InfoGrid
                  rows={[
                    { label: "Role", value: worker.role },
                    { label: "Department", value: worker.department },
                    { label: "Country", value: `${worker.country} (${worker.countryCode})` },
                    { label: "EOR provider", value: worker.providerName },
                    { label: "Status", value: EOR_WORKER_STATUS_LABELS[worker.status] },
                    { label: "Start date", value: fmtDate(worker.startDate) },
                    ...(worker.endDate
                      ? [{ label: "End date", value: fmtDate(worker.endDate) }]
                      : []),
                    { label: "Pay currency", value: worker.currency },
                    { label: "Pay frequency", value: titleCase(worker.payFrequency) },
                    { label: "Tenure", value: formatDuration(worker.startDate) },
                  ]}
                />
              </Section>
            )}

            {active === "contact" && (
              <Section title="Contact" description="How to reach this worker.">
                <InfoGrid
                  rows={[
                    { label: "Work email", value: worker.email },
                    { label: "Personal email", value: worker.personalEmail },
                    { label: "Phone", value: worker.phone },
                    { label: "Country", value: `${worker.country} (${worker.countryCode})` },
                  ]}
                />
              </Section>
            )}

            {active === "cost" && (
              <Section
                title="Monthly cost breakdown"
                description={`Local pay in ${worker.currency}; total cost normalised to USD for reporting.`}
              >
                <div className="rounded-xl border border-border divide-y divide-border text-sm max-w-md">
                  <CostRow label="Gross salary" value={money(worker.grossSalaryMonthly)} />
                  <CostRow label="Employer statutory cost" value={money(worker.employerCost)} />
                  <CostRow label="EOR management fee" value={money(worker.managementFee)} />
                  <div className="flex items-center justify-between px-3 py-2.5 font-semibold">
                    <span>Total ({worker.currency})</span>
                    <span>{money(totalLocal)}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  ≈ {formatUsd(worker.monthlyCostUsd)} / month (USD equivalent)
                </p>
              </Section>
            )}

            {active === "compliance" && (
              <Section
                title="Compliance checklist"
                description="Statutory and onboarding compliance status."
              >
                <div className="space-y-2">
                  {worker.compliance.map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5"
                    >
                      <div>
                        <p className="text-sm">{item.label}</p>
                        {item.note && (
                          <p className="text-xs text-muted-foreground">{item.note}</p>
                        )}
                      </div>
                      <Badge
                        variant="outline"
                        className={cn("text-[10px] shrink-0", EOR_COMPLIANCE_STYLES[item.status])}
                      >
                        {EOR_COMPLIANCE_LABELS[item.status]}
                      </Badge>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {active === "provider" && (
              <Section title="Provider" description="EOR partner managing this engagement.">
                {provider ? (
                  <InfoGrid
                    rows={[
                      { label: "Provider", value: provider.name },
                      {
                        label: "Status",
                        value: (
                          <Badge
                            variant="outline"
                            className={cn("text-[10px]", EOR_PROVIDER_STATUS_STYLES[provider.status])}
                          >
                            {EOR_PROVIDER_STATUS_LABELS[provider.status]}
                          </Badge>
                        ),
                      },
                      { label: "Management fee", value: `${provider.managementFeePct}%` },
                      { label: "Workers", value: provider.workerCount },
                      { label: "Countries covered", value: provider.countriesCovered.join(", ") },
                      { label: "Partner since", value: fmtDate(provider.since) },
                      {
                        label: "Website",
                        value: provider.website ? (
                          <span className="text-primary">
                            {provider.website.replace(/^https?:\/\//, "")}
                          </span>
                        ) : (
                          "—"
                        ),
                      },
                    ]}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Provider record not found.
                  </p>
                )}
              </Section>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CostRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-3 py-2.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
