"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Mail,
  Calendar,
  Users,
  TrendingUp,
  Eye,
  ShieldAlert,
  Ban,
  CheckCircle2,
  RefreshCw,
  Download,
  Tag,
  X,
  Plus,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Textarea } from "@/src/components/ui/textarea";
import { Separator } from "@/src/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { DEMO_TENANTS, DEMO_INVOICES } from "@/src/data/motee-demo";
import type { TenantPlan, TenantStatus } from "@/src/lib/types/motee.types";

const planStyles: Record<TenantPlan, string> = {
  starter: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
  growth: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  enterprise: "bg-[#ff8b2d]/10 text-[#ff8b2d]",
};

const statusStyles: Record<TenantStatus, string> = {
  active: "bg-[#4ED251]/10 text-[#4ED251]",
  trial: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  suspended: "bg-red-500/10 text-red-600 dark:text-red-400",
};

const invoiceStatusStyles: Record<string, string> = {
  paid: "bg-[#4ED251]/10 text-[#4ED251]",
  pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  overdue: "bg-red-500/10 text-red-600 dark:text-red-400",
};

const adminUsers = [
  {
    name: "Amara Okafor",
    role: "HR Admin",
    email: "amara.okafor@org.com",
    lastLogin: "2 hours ago",
  },
  {
    name: "Chidi Nwosu",
    role: "Super Admin",
    email: "chidi.nwosu@org.com",
    lastLogin: "1 day ago",
  },
  {
    name: "Fatima Bello",
    role: "Finance Admin",
    email: "fatima.bello@org.com",
    lastLogin: "3 days ago",
  },
];

const defaultTags = ["Enterprise", "Priority Support"];

type Tab = "overview" | "invoices" | "users" | "notes";

interface TenantDetailPageProps {
  id: string;
}

export function TenantDetailPage({ id }: TenantDetailPageProps) {
  const router = useRouter();
  const tenant = DEMO_TENANTS.find((t) => t.id === id);

  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [assistedAccessActive, setAssistedAccessActive] = useState(false);
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [accessReason, setAccessReason] = useState("");
  const [noteText, setNoteText] = useState("");
  const [notes, setNotes] = useState<
    { id: number; text: string; time: string }[]
  >([]);
  const [tags, setTags] = useState<string[]>(defaultTags);

  if (!tenant) return null;

  const tenantInvoices = DEMO_INVOICES.filter(
    (inv) => inv.tenantId === tenant.id,
  );

  const tabs: { key: Tab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "invoices", label: `Invoices (${tenantInvoices.length})` },
    { key: "users", label: `Users (${adminUsers.length})` },
    { key: "notes", label: `Notes (${notes.length})` },
  ];

  function handleStartAccess() {
    if (!accessReason.trim()) return;
    setAssistedAccessActive(true);
    setShowAccessModal(false);
    setAccessReason("");
  }

  function handleEndAccess() {
    setAssistedAccessActive(false);
  }

  function handleAddNote() {
    if (!noteText.trim()) return;
    setNotes((prev) => [
      ...prev,
      {
        id: Date.now(),
        text: noteText.trim(),
        time: new Date().toLocaleString("en-GB", {
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);
    setNoteText("");
  }

  return (
    <div className="flex flex-col gap-6">
      {assistedAccessActive && (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-[#ff8b2d]/50 bg-[#ff8b2d]/10 px-4 py-3">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-[#ff8b2d]" />
            <span className="text-sm font-medium text-[#ff8b2d]">
              Assisted Access Active — You are viewing {tenant.name} in
              read-only mode
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleEndAccess}
            className="border-[#ff8b2d]/50 text-[#ff8b2d] hover:bg-[#ff8b2d]/10 shrink-0"
          >
            End Session
          </Button>
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div>
          <button
            onClick={() => router.push("/tenants")}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All Tenants
          </button>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold text-foreground">
              {tenant.name}
            </h1>
            <Badge
              className={`capitalize text-xs font-medium border-0 ${statusStyles[tenant.status]}`}
            >
              {tenant.status}
            </Badge>
            <Badge
              className={`capitalize text-xs font-medium border-0 ${planStyles[tenant.plan]}`}
            >
              {tenant.plan}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {tenant.billingEmail}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAccessModal(true)}
            className="gap-2 border-[#ff8b2d]/30 text-[#ff8b2d] hover:bg-[#ff8b2d]/10"
          >
            <Eye className="h-4 w-4" />
            Assisted Access
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export Data
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Employees</p>
            <div className="mt-1 flex items-center gap-2">
              <Users className="h-4 w-4 text-[#ff8b2d]" />
              <p className="text-xl font-bold text-foreground">
                {tenant.employeeCount.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Monthly Revenue</p>
            <div className="mt-1 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#4ED251]" />
              <p className="text-xl font-bold text-foreground">
                ${tenant.mrr.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Annual Revenue</p>
            <div className="mt-1 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <p className="text-xl font-bold text-foreground">
                ${(tenant.mrr * 12).toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total Invoices</p>
            <div className="mt-1 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[#ff8b2d]" />
              <p className="text-xl font-bold text-foreground">
                {tenantInvoices.length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-1 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.key
                ? "border-[#ff8b2d] text-[#ff8b2d]"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="xl:col-span-2 flex flex-col gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">
                  Company Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Company Name</p>
                  <p className="mt-0.5 text-sm font-medium text-foreground">
                    {tenant.name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Billing Email</p>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">
                      {tenant.billingEmail}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Primary Contact
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-foreground">
                    ops@{tenant.name.toLowerCase().replace(/[^a-z0-9]+/g, "")}
                    .com
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Registered</p>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">
                      {new Date(tenant.createdAt).toLocaleDateString("en-GB", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Current Plan</p>
                  <div className="mt-1">
                    <Badge
                      className={`capitalize text-xs font-medium border-0 ${planStyles[tenant.plan]}`}
                    >
                      {tenant.plan}
                    </Badge>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">
                    Account Status
                  </p>
                  <div className="mt-1">
                    <Badge
                      className={`capitalize text-xs font-medium border-0 ${statusStyles[tenant.status]}`}
                    >
                      {tenant.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 flex-wrap">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground"
                    >
                      <Tag className="h-3 w-3" />
                      {tag}
                      <button
                        onClick={() =>
                          setTags((prev) => prev.filter((t) => t !== tag))
                        }
                        className="ml-0.5 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  <button className="flex items-center gap-1 rounded-full border border-dashed border-border px-3 py-1 text-xs text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors">
                    <Plus className="h-3 w-3" />
                    Add tag
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {tenant.status === "active" || tenant.status === "trial" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="justify-start gap-2 text-red-600 hover:text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
                  >
                    <Ban className="h-4 w-4" />
                    Suspend Tenant
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="justify-start gap-2 text-[#4ED251] hover:text-[#4ED251] border-[#4ED251]/20 hover:bg-[#4ED251]/10"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Reactivate Tenant
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Change Plan
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export Data
                </Button>
                <Separator />
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start gap-2 text-red-600 hover:text-red-600 border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950"
                >
                  <ShieldAlert className="h-4 w-4" />
                  Offboard Tenant
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "invoices" && (
        <div className="flex flex-col gap-3">
          {tenantInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-sm text-muted-foreground">
                No invoices found for this tenant
              </p>
            </div>
          ) : (
            tenantInvoices.map((invoice) => (
              <Card key={invoice.id}>
                <CardContent className="flex items-center justify-between gap-4 p-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      ${invoice.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Issued {invoice.issuedDate} · Due {invoice.dueDate}
                    </p>
                  </div>
                  <Badge
                    className={`capitalize text-xs font-medium border-0 ${invoiceStatusStyles[invoice.status]}`}
                  >
                    {invoice.status}
                  </Badge>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === "users" && (
        <div className="flex flex-col gap-3">
          {adminUsers.map((user) => (
            <Card key={user.email}>
              <CardContent className="flex items-center justify-between gap-4 p-4">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-[#ff8b2d]/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-semibold text-[#ff8b2d]">
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {user.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="capitalize text-xs mb-1">
                    {user.role}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    Last login: {user.lastLogin}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === "notes" && (
        <div className="flex flex-col gap-4">
          <Card>
            <CardContent className="p-4 flex flex-col gap-3">
              <Textarea
                placeholder="Add an internal note about this tenant..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={3}
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleAddNote}
                  disabled={!noteText.trim()}
                  size="sm"
                  className="bg-[#ff8b2d] hover:bg-[#ff8b2d]/90 text-white"
                >
                  Add Note
                </Button>
              </div>
            </CardContent>
          </Card>

          {notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-muted-foreground">
                No notes yet. Add one above.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {[...notes].reverse().map((note) => (
                <Card key={note.id}>
                  <CardContent className="p-4">
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {note.text}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {note.time}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      <Dialog open={showAccessModal} onOpenChange={setShowAccessModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-[#ff8b2d]" />
              Assisted Access
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <p className="text-sm text-muted-foreground">
              You are about to enter a read-only session for{" "}
              <span className="font-semibold text-foreground">
                {tenant.name}
              </span>
              . This action will be logged in the audit trail.
            </p>
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-foreground">
                Reason <span className="text-red-500">*</span>
              </p>
              <Textarea
                placeholder="Enter the reason for accessing this tenant's account..."
                value={accessReason}
                onChange={(e) => setAccessReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowAccessModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleStartAccess}
              disabled={!accessReason.trim()}
              className="bg-[#ff8b2d] hover:bg-[#ff8b2d]/90 text-white"
            >
              Start Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
