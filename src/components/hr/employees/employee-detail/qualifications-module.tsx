"use client";

import * as React from "react";
import { GraduationCap, Award, Users, Languages as LanguagesIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useCan } from "@/src/lib/permissions/use-can";
import { useAppDispatch } from "@/src/lib/stores/hooks";
import { COLLECTION_SCHEMAS } from "@/src/lib/profile/collections";
import { removeRecord } from "@/src/lib/stores/collection-edits-slice";
import {
  AddButton,
  EditButton,
  useRecordForm,
} from "@/src/components/shared/profile-fields/record-form";
import { CertStatusBadge } from "@/src/components/shared/cert-status-badge";
import { cn } from "@/src/lib/utils";
import {
  useEmployeeEducation,
  useEmployeeLanguages,
  useEmployeeMemberships,
  useEmployeeTraining,
} from "./hooks";
import type { ModuleProps } from "./modules";
import { useGoToModule } from "./module-navigation";
import { useProfileVariant } from "./variant";
import { Cell, DataTable, Empty, LoadingPanel, Pill, Row, Section, fmtDate } from "./ui";

/**
 * The owner of the profile may maintain their own education, memberships and
 * languages; HR may maintain anyone's.
 */
export function useCanMaintainOwnRecords(): boolean {
  const hrCanEdit = useCan("organization.employees", "edit");
  const variant = useProfileVariant();
  return hrCanEdit || variant.audience === "employee";
}

function SubHeading({
  icon: Icon,
  title,
  count,
  action,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  count?: number;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Icon className="h-4 w-4 text-muted-foreground" />
        {title}
        {count != null && (
          <span className="text-xs font-normal text-muted-foreground">({count})</span>
        )}
      </h3>
      {action}
    </div>
  );
}

function DeleteButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
}

const PROFICIENCY_TONE: Record<string, string> = {
  Native: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
  Fluent: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
  Professional: "border-blue-500/30 bg-blue-500/10 text-blue-600",
  Conversational: "border-amber-500/30 bg-amber-500/10 text-amber-600",
  Basic: "border-border bg-muted text-muted-foreground",
};

/**
 * Qualifications & Education — educational history, degrees, professional
 * certifications (summarised from the Certifications module), professional
 * memberships and languages, in one place for workforce planning.
 */
export function QualificationsModule({ employeeId }: ModuleProps) {
  const dispatch = useAppDispatch();
  const canEdit = useCanMaintainOwnRecords();
  const goToModule = useGoToModule();
  const { data: education, loading } = useEmployeeEducation(employeeId);
  const { data: memberships } = useEmployeeMemberships(employeeId);
  const { data: languages } = useEmployeeLanguages(employeeId);
  const { data: certs } = useEmployeeTraining(employeeId);

  const rfEdu = useRecordForm(COLLECTION_SCHEMAS.education, employeeId);
  const rfMem = useRecordForm(COLLECTION_SCHEMAS.professionalMemberships, employeeId);
  const rfLang = useRecordForm(COLLECTION_SCHEMAS.employeeLanguages, employeeId);

  const remove = (key: string, id: string, what: string) => {
    dispatch(removeRecord({ key, id }));
    toast.success(`${what} removed`);
  };

  if (loading && !education) return <LoadingPanel />;

  const edu = [...(education ?? [])].sort((a, b) => (b.endYear ?? 0) - (a.endYear ?? 0));
  const professional = (certs ?? []).filter((c) => c.kind === "professional");

  return (
    <Section
      title="Qualifications & Education"
      description="Educational history, degrees, professional qualifications, memberships and languages."
    >
      {rfEdu.node}
      {rfMem.node}
      {rfLang.node}

      {/* Education */}
      <div className="flex flex-col gap-2">
        <SubHeading
          icon={GraduationCap}
          title="Education"
          count={edu.length}
          action={canEdit ? <AddButton label="Add education" onClick={rfEdu.openCreate} /> : undefined}
        />
        {edu.length === 0 ? (
          <Empty label="No education history recorded." description="Add degrees, diplomas and school qualifications." />
        ) : (
          <DataTable columns={["Qualification", "Institution", "Grade", "Years", ...(canEdit ? [""] : [])]}>
            {edu.map((e) => (
              <Row key={e.id}>
                <Cell>
                  <p className="font-medium">
                    {e.qualification} {e.fieldOfStudy}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{e.level}</p>
                </Cell>
                <Cell>{e.institution}</Cell>
                <Cell>{e.grade ?? "—"}</Cell>
                <Cell className="whitespace-nowrap">
                  {e.startYear ?? "—"} – {e.endYear ?? "present"}
                </Cell>
                {canEdit && (
                  <Cell className="whitespace-nowrap">
                    <EditButton onClick={() => rfEdu.openEdit(e)} />
                    <DeleteButton label="Remove qualification" onClick={() => remove("education", e.id, "Qualification")} />
                  </Cell>
                )}
              </Row>
            ))}
          </DataTable>
        )}
      </div>

      {/* Professional qualifications — owned by the Certifications module */}
      <div className="flex flex-col gap-2">
        <SubHeading
          icon={Award}
          title="Professional Qualifications"
          count={professional.length}
          action={
            goToModule ? (
              <button
                type="button"
                onClick={() => goToModule("training")}
                className="text-xs font-medium text-primary hover:underline"
              >
                Manage in Certifications →
              </button>
            ) : undefined
          }
        />
        {professional.length === 0 ? (
          <Empty label="No professional certifications recorded." />
        ) : (
          <div className="flex flex-wrap gap-2">
            {professional.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2"
              >
                <div>
                  <p className="text-xs font-medium">{c.title}</p>
                  <p className="text-[10px] text-muted-foreground">{c.issuingBody}</p>
                </div>
                <CertStatusBadge expiresAt={c.expiresAt} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Professional memberships */}
      <div className="flex flex-col gap-2">
        <SubHeading
          icon={Users}
          title="Professional Memberships"
          count={memberships?.length ?? 0}
          action={canEdit ? <AddButton label="Add membership" onClick={rfMem.openCreate} /> : undefined}
        />
        {!memberships?.length ? (
          <Empty label="No professional memberships recorded." description="E.g. CIPM, ICAN, CIPD, BCS." />
        ) : (
          <DataTable columns={["Professional Body", "Grade", "Membership No.", "Member Since", "Renewal", "Status", ...(canEdit ? [""] : [])]}>
            {memberships.map((m) => (
              <Row key={m.id}>
                <Cell className="font-medium">{m.body}</Cell>
                <Cell>{m.grade}</Cell>
                <Cell className="font-mono text-xs">{m.membershipNumber ?? "—"}</Cell>
                <Cell>{fmtDate(m.since)}</Cell>
                <Cell>{fmtDate(m.renewalDate)}</Cell>
                <Cell>
                  <Pill
                    className={
                      m.status === "active"
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                        : "border-rose-500/30 bg-rose-500/10 text-rose-600"
                    }
                  >
                    {m.status}
                  </Pill>
                </Cell>
                {canEdit && (
                  <Cell className="whitespace-nowrap">
                    <EditButton onClick={() => rfMem.openEdit(m)} />
                    <DeleteButton label="Remove membership" onClick={() => remove("professionalMemberships", m.id, "Membership")} />
                  </Cell>
                )}
              </Row>
            ))}
          </DataTable>
        )}
      </div>

      {/* Languages */}
      <div className="flex flex-col gap-2">
        <SubHeading
          icon={LanguagesIcon}
          title="Languages"
          count={languages?.length ?? 0}
          action={canEdit ? <AddButton label="Add language" onClick={rfLang.openCreate} /> : undefined}
        />
        {!languages?.length ? (
          <Empty label="No languages recorded." />
        ) : (
          <div className="flex flex-wrap gap-2">
            {languages.map((l) => (
              <div
                key={l.id}
                className="group flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5"
              >
                <span className="text-xs font-medium">{l.language}</span>
                <Pill className={cn(PROFICIENCY_TONE[l.proficiency] ?? PROFICIENCY_TONE.Basic)}>
                  {l.proficiency}
                </Pill>
                {canEdit && (
                  <span className="flex items-center opacity-60 group-hover:opacity-100">
                    <EditButton onClick={() => rfLang.openEdit(l)} />
                    <DeleteButton label={`Remove ${l.language}`} onClick={() => remove("employeeLanguages", l.id, "Language")} />
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}
