"use client";

import { useState } from "react";
import { Pencil, Lock, Check, X, Monitor, LogOut } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent, CardHeader } from "@/src/components/ui/card";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { PageTabsList } from "@/src/components/shared/page-tabs";
import { Separator } from "@/src/components/ui/separator";
import { Badge } from "@/src/components/ui/badge";
import { Input } from "@/src/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { Textarea } from "@/src/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { cn } from "@/src/lib/utils";
import { DEMO_MY_PROFILE } from "@/src/data/employee-demo";

const STATUS_STYLES: Record<string, string> = {
  active: "border-[#1D9E75]/30 bg-[#1D9E75]/10 text-[#1D9E75]",
  inactive: "border-slate-400/30 bg-slate-400/10 text-slate-500",
  on_leave: "border-blue-500/30 bg-blue-500/10 text-blue-600",
  terminated: "border-red-500/30 bg-red-500/10 text-red-600",
};
const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  inactive: "Inactive",
  on_leave: "On Leave",
  terminated: "Terminated",
};
const EMP_TYPE_STYLES: Record<string, string> = {
  full_time: "border-violet-500/30 bg-violet-500/10 text-violet-600",
  part_time: "border-amber-500/30 bg-amber-500/10 text-amber-600",
  contract: "border-cyan-500/30 bg-cyan-500/10 text-cyan-600",
  intern: "border-pink-500/30 bg-pink-500/10 text-pink-600",
};
const EMP_TYPE_LABELS: Record<string, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contract: "Contract",
  intern: "Intern",
};

const FIELD_OPTIONS = [
  { value: "name", label: "Full Name" },
  { value: "dob", label: "Date of Birth" },
  { value: "bank_account", label: "Bank Account Details" },
  { value: "employee_id", label: "Employee ID" },
  { value: "other", label: "Other" },
];

const PROFILE_FIELDS = [
  { label: "Profile photo", done: true },
  { label: "Phone number", done: true },
  { label: "Home address", done: true },
  { label: "Emergency contact", done: true },
  { label: "Bank account", done: true },
  { label: "Date of birth", done: true },
  { label: "Nationality", done: true },
  { label: "Marital status", done: false },
  { label: "National ID (NIN)", done: false },
];

function InfoRow({
  label,
  value,
  editable,
  fieldKey,
  editingKey,
  draft,
  onEdit,
  onDraftChange,
  onSave,
  onCancel,
}: {
  label: string;
  value?: string | null;
  editable?: boolean;
  fieldKey?: string;
  editingKey?: string | null;
  draft?: string;
  onEdit?: (key: string, current: string) => void;
  onDraftChange?: (val: string) => void;
  onSave?: () => void;
  onCancel?: () => void;
}) {
  const isEditing = editable && fieldKey && editingKey === fieldKey;
  return (
    <div className="flex items-start gap-2 py-1.5 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground w-32 shrink-0">
        {label}:
      </span>
      {isEditing ? (
        <div className="flex items-center gap-1.5 flex-1">
          <Input
            value={draft}
            onChange={(e) => onDraftChange?.(e.target.value)}
            className="h-6 text-xs px-2"
            autoFocus
          />
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 text-[#1D9E75]"
            onClick={onSave}
          >
            <Check className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 text-muted-foreground"
            onClick={onCancel}
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between flex-1 gap-2 group/row">
          <span className="text-xs text-foreground font-medium">
            {value ?? (
              <span className="italic text-muted-foreground/50">—</span>
            )}
          </span>
          {editable && fieldKey && (
            <Button
              size="icon"
              variant="ghost"
              className="h-5 w-5 text-muted-foreground opacity-0 group-hover/row:opacity-100 transition-opacity shrink-0"
              onClick={() => onEdit?.(fieldKey, value ?? "")}
            >
              <Pencil className="w-3 h-3" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function DocCard({ type, number }: { type: string; number?: string }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0">
      <div className="w-8 h-8 rounded-md bg-[#7F77DD]/10 flex items-center justify-center shrink-0">
        <span className="text-[9px] font-bold text-[#7F77DD] uppercase">
          ID
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground truncate">{type}</p>
        {number ? (
          <p className="text-[11px] text-muted-foreground font-mono">
            {number}
          </p>
        ) : (
          <p className="text-[11px] text-muted-foreground italic">
            Not provided
          </p>
        )}
      </div>
    </div>
  );
}

export function EmployeeProfilePage() {
  const p = DEMO_MY_PROFILE;

  const [editOpen, setEditOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [personalValues, setPersonalValues] = useState({
    phone: p.phone,
    street: p.address.street,
    city: p.address.city,
    state: p.address.state,
    postalCode: p.address.postalCode,
  });
  const [emergencyValues, setEmergencyValues] = useState({
    ecName: p.emergencyContact.name,
    ecRelationship: p.emergencyContact.relationship,
    ecPhone: p.emergencyContact.phone,
  });
  const [reqField, setReqField] = useState("");
  const [reqCurrent, setReqCurrent] = useState("");
  const [reqNew, setReqNew] = useState("");
  const [reqReason, setReqReason] = useState("");
  const [reqSubmitted, setReqSubmitted] = useState(false);

  const handleEdit = (key: string, current: string) => {
    setEditingKey(key);
    setDraft(current);
  };
  const handleSave = () => {
    if (!editingKey) return;
    if (editingKey in personalValues)
      setPersonalValues((prev) => ({ ...prev, [editingKey]: draft }));
    else setEmergencyValues((prev) => ({ ...prev, [editingKey]: draft }));
    setEditingKey(null);
  };
  const handleCancel = () => setEditingKey(null);
  const rowProps = {
    editingKey,
    draft,
    onEdit: handleEdit,
    onDraftChange: setDraft,
    onSave: handleSave,
    onCancel: handleCancel,
  };

  const pct = Math.round(
    (PROFILE_FIELDS.filter((f) => f.done).length / PROFILE_FIELDS.length) * 100,
  );

  const handleReqSubmit = () => {
    setReqSubmitted(true);
    setTimeout(() => {
      setReqSubmitted(false);
      setReqField("");
      setReqCurrent("");
      setReqNew("");
      setReqReason("");
      setEditOpen(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col gap-5 pb-10">
      <div className="py-6 w-fit">
        <h1 className="text-4xl font-bold text-foreground">My Profile</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          View and manage your personal information.
        </p>
      </div>

      {/* TOP SECTION — Avatar card + Personal Information card */}
      <div className="grid grid-cols-1 sm:grid-cols-[260px_1fr] gap-4 items-start">
        {/* Avatar card */}
        <Card>
          <CardContent className="p-4 flex flex-col items-center gap-4">
            <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-muted cursor-pointer group">
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-5xl font-bold text-[#7F77DD]/40">
                  {p.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-xl font-extrabold text-foreground leading-tight">
                {p.name}
              </p>
              <p className="text-sm font-semibold text-muted-foreground mt-0.5">
                {p.jobTitle}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full h-8 text-xs gap-1.5"
              onClick={() => setEditOpen(true)}
            >
              <Lock className="w-3.5 h-3.5" /> Request Name / ID Change
            </Button>
          </CardContent>
        </Card>

        {/* Personal Information card */}
        <Card className="h-full">
          <CardContent className="px-5 pb-2 pt-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-foreground">
                Personal Information
              </p>
            </div>
            <Separator className="mb-3" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
              <InfoRow label="Email" value={p.email} />
              <InfoRow
                label="Phone"
                value={personalValues.phone}
                editable
                fieldKey="phone"
                {...rowProps}
              />
              <InfoRow label="Department" value={p.department} />
              <InfoRow label="Date of birth" value="14 Jul 1992" />
              <InfoRow label="Gender" value="Male" />
              <InfoRow label="Nationality" value="Nigerian" />
              <InfoRow label="Marital status" value="Single" />
              <InfoRow
                label="Street address"
                value={personalValues.street}
                editable
                fieldKey="street"
                {...rowProps}
              />
              <InfoRow
                label="City"
                value={personalValues.city}
                editable
                fieldKey="city"
                {...rowProps}
              />
              <InfoRow
                label="State"
                value={personalValues.state}
                editable
                fieldKey="state"
                {...rowProps}
              />
              <InfoRow label="Country" value={p.address.country} />
              <InfoRow
                label="Postal code"
                value={personalValues.postalCode}
                editable
                fieldKey="postalCode"
                {...rowProps}
              />
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border/50">
              <span
                className={cn(
                  "text-[10px] px-2 py-0.5 rounded-full border font-semibold",
                  STATUS_STYLES[p.status] ?? "",
                )}
              >
                {STATUS_LABELS[p.status] ?? p.status}
              </span>
              <span
                className={cn(
                  "text-[10px] px-2 py-0.5 rounded-full border font-semibold",
                  EMP_TYPE_STYLES[p.employmentType] ?? "",
                )}
              >
                {EMP_TYPE_LABELS[p.employmentType] ?? p.employmentType}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* BOTTOM SECTION — single tabbed card */}
      <Card>
        <Tabs defaultValue="employment">
          <CardHeader className="pb-0 pt-4 px-5">
            <PageTabsList
              tabs={[
                { value: "employment", label: "Employment Details" },
                { value: "documents", label: "Identity Documents" },
                { value: "bank", label: "Bank Details" },
                { value: "emergency", label: "Emergency Contact" },
                { value: "security", label: "Security" },
                { value: "completeness", label: "Profile Completeness" },
              ]}
            />
          </CardHeader>
          <Separator className="mt-3" />
          <CardContent className="px-5 pb-5 pt-3">
            <TabsContent value="employment" className="mt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                <InfoRow label="Employee ID" value={p.id} />
                <InfoRow label="Job title" value={p.jobTitle} />
                <InfoRow label="Department" value={p.department} />
                <InfoRow
                  label="Employment type"
                  value={EMP_TYPE_LABELS[p.employmentType] ?? p.employmentType}
                />
                <InfoRow label="Start date" value={p.startDate} />
                <InfoRow label="Work location" value="Victoria Island Office" />
                <InfoRow label="Work mode" value="Hybrid" />
                <InfoRow label="Grade" value="L4 — Senior Engineer" />
                <InfoRow label="Line manager" value="Chidinma Okeke" />
                <InfoRow label="Direct reports" value="None" />
              </div>
            </TabsContent>

            <TabsContent value="documents" className="mt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                <DocCard type="National ID (NIN)" />
                <DocCard type="International Passport" />
                <DocCard type="Driver's License" />
                <DocCard type="Tax Identification (TIN)" />
                <DocCard type="Pension ID (PFA)" />
                <DocCard type="National Housing Fund (NHF)" />
              </div>
            </TabsContent>

            <TabsContent value="bank" className="mt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                <InfoRow label="Bank name" value={p.bankAccount.bankName} />
                <InfoRow
                  label="Account number"
                  value={p.bankAccount.accountNumber}
                />
                <InfoRow
                  label="Account name"
                  value={p.bankAccount.accountName}
                />
              </div>
              <p className="text-[11px] text-muted-foreground mt-4 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Bank details require HR approval to change.{" "}
                <button
                  className="text-[#7F77DD] underline underline-offset-2"
                  onClick={() => setEditOpen(true)}
                >
                  Request a change
                </button>
              </p>
            </TabsContent>

            <TabsContent value="emergency" className="mt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                <InfoRow
                  label="Full name"
                  value={emergencyValues.ecName}
                  editable
                  fieldKey="ecName"
                  {...rowProps}
                />
                <InfoRow
                  label="Relationship"
                  value={emergencyValues.ecRelationship}
                  editable
                  fieldKey="ecRelationship"
                  {...rowProps}
                />
                <InfoRow
                  label="Phone"
                  value={emergencyValues.ecPhone}
                  editable
                  fieldKey="ecPhone"
                  {...rowProps}
                />
              </div>
            </TabsContent>

            <TabsContent value="security" className="mt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 mb-5">
                <InfoRow label="Last login" value="Apr 23, 2026 · 8:48 AM" />
                <InfoRow label="Two-factor auth" value="Not enabled" />
              </div>
              <p className="text-xs font-medium text-foreground mb-3">
                Active Sessions
              </p>
              <div className="flex flex-col gap-0">
                {[
                  {
                    id: "s-001",
                    device: "Chrome · macOS",
                    location: "Lagos, Nigeria",
                    lastActive: "Now",
                    current: true,
                  },
                  {
                    id: "s-002",
                    device: "Safari · iPhone",
                    location: "Lagos, Nigeria",
                    lastActive: "2 hours ago",
                    current: false,
                  },
                ].map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between gap-2 py-2.5 border-b border-border/50 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-md bg-muted shrink-0">
                        <Monitor className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs text-foreground font-medium">
                          {s.device}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {s.location} · {s.lastActive}
                        </p>
                      </div>
                    </div>
                    {s.current ? (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 border-[#1D9E75]/30 bg-[#1D9E75]/10 text-[#1D9E75]"
                      >
                        Current
                      </Badge>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1 text-muted-foreground hover:text-rose-600"
                      >
                        <LogOut className="w-3.5 h-3.5" /> Sign out
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="completeness" className="mt-0">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground">
                    Overall completeness
                  </p>
                  <span className="text-xs font-bold text-[#7F77DD]">
                    {pct}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#7F77DD] transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
                {PROFILE_FIELDS.map((f) => (
                  <div
                    key={f.label}
                    className="flex items-center gap-2 py-1.5 border-b border-border/50 last:border-0"
                  >
                    <span
                      className={cn(
                        "w-2 h-2 rounded-full shrink-0",
                        f.done ? "bg-[#1D9E75]" : "bg-muted-foreground/30",
                      )}
                    />
                    <span
                      className={cn(
                        "text-xs",
                        f.done ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {f.label}
                    </span>
                  </div>
                ))}
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

      {/* Edit Request Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-[#7F77DD]/10">
                <Lock className="w-4 h-4 text-[#7F77DD]" />
              </div>
              <DialogTitle className="text-sm font-semibold">
                Request a Profile Change
              </DialogTitle>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              This field requires HR approval. Your request will be sent to HR
              for review.
            </p>
          </DialogHeader>
          {reqSubmitted ? (
            <div className="py-6 text-center">
              <p className="text-sm font-medium text-[#1D9E75]">
                ✓ Request submitted
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                HR will review and update your profile shortly.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 py-2">
              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-medium">Field to change</p>
                <Select value={reqField} onValueChange={setReqField}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_OPTIONS.map((f) => (
                      <SelectItem
                        key={f.value}
                        value={f.value}
                        className="text-xs"
                      >
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-medium">Current value</p>
                <Input
                  value={reqCurrent}
                  onChange={(e) => setReqCurrent(e.target.value)}
                  placeholder="What it currently says"
                  className="h-8 text-xs"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-medium">Requested new value</p>
                <Input
                  value={reqNew}
                  onChange={(e) => setReqNew(e.target.value)}
                  placeholder="What it should be changed to"
                  className="h-8 text-xs"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-medium">Reason for change</p>
                <Textarea
                  value={reqReason}
                  onChange={(e) => setReqReason(e.target.value)}
                  placeholder="Briefly explain why this change is needed..."
                  className="text-xs min-h-17.5 resize-none"
                />
              </div>
            </div>
          )}
          {!reqSubmitted && (
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8"
                onClick={() => setEditOpen(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="text-xs h-8 bg-[#7F77DD] hover:bg-[#6c64cc] text-white"
                onClick={handleReqSubmit}
                disabled={!reqField || !reqNew || !reqReason}
              >
                Submit Request
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
