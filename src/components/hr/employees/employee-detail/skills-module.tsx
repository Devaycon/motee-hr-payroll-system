"use client";

import * as React from "react";
import { Star, Target, Compass, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAppDispatch } from "@/src/lib/stores/hooks";
import { COLLECTION_SCHEMAS } from "@/src/lib/profile/collections";
import { removeRecord } from "@/src/lib/stores/collection-edits-slice";
import {
  AddButton,
  EditButton,
  useRecordForm,
} from "@/src/components/shared/profile-fields/record-form";
import { cn } from "@/src/lib/utils";
import {
  GAP_STYLES,
  gapSeverity,
  proficiencyLabel,
  skillGap,
  summariseSkills,
  toLevel,
} from "@/src/lib/skills/proficiency";
import type { LocaleEmployeeSkill } from "@/src/lib/types/locale";
import { useEmployeeAspirations, useEmployeeSkills } from "./hooks";
import type { ModuleProps } from "./modules";
import { useCanMaintainOwnRecords } from "./qualifications-module";
import { Cell, DataTable, Empty, LoadingPanel, Pill, Row, Section, StatStrip, fmtDate } from "./ui";

/** ★★★★☆ — filled to the current level, with the role's target outlined. */
export function ProficiencyStars({
  level,
  required,
}: {
  level: number | string;
  required?: number | string;
}) {
  const lvl = toLevel(level);
  const req = required != null ? toLevel(required) : null;
  return (
    <span
      className="inline-flex items-center gap-0.5"
      title={`${proficiencyLabel(lvl)}${req ? ` · role expects ${proficiencyLabel(req)}` : ""}`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={cn(
            "h-3.5 w-3.5",
            i <= lvl
              ? "fill-amber-400 text-amber-400"
              : req != null && i <= req
                ? "text-rose-400"
                : "text-muted-foreground/30",
          )}
        />
      ))}
    </span>
  );
}

function GapBadge({ skill }: { skill: LocaleEmployeeSkill }) {
  const gap = skillGap(skill);
  const sev = gapSeverity(gap);
  return (
    <Pill className={cn("whitespace-nowrap", GAP_STYLES[sev])}>
      {sev === "met" ? "Meets role" : `Gap −${gap}`}
    </Pill>
  );
}

function SkillTable({
  rows,
  canEdit,
  onEdit,
  onRemove,
  firstColumn,
}: {
  rows: LocaleEmployeeSkill[];
  canEdit: boolean;
  onEdit: (s: LocaleEmployeeSkill) => void;
  onRemove: (s: LocaleEmployeeSkill) => void;
  firstColumn: string;
}) {
  return (
    <DataTable
      columns={[firstColumn, "Category", "Proficiency", "Level", "Role Requires", "Gap", "Assessed", ...(canEdit ? [""] : [])]}
    >
      {rows.map((s) => (
        <Row key={s.id}>
          <Cell className="font-medium">{s.name}</Cell>
          <Cell className="text-muted-foreground">{s.category}</Cell>
          <Cell>
            <ProficiencyStars level={s.level} required={s.requiredLevel} />
          </Cell>
          <Cell>{proficiencyLabel(s.level)}</Cell>
          <Cell className="text-muted-foreground">{proficiencyLabel(s.requiredLevel)}</Cell>
          <Cell>
            <GapBadge skill={s} />
          </Cell>
          <Cell className="whitespace-nowrap text-muted-foreground">
            <p className="text-xs">{s.assessedBy ?? "—"}</p>
            <p className="text-[10px]">{fmtDate(s.lastAssessedAt)}</p>
          </Cell>
          {canEdit && (
            <Cell className="whitespace-nowrap">
              <EditButton onClick={() => onEdit(s)} />
              <button
                type="button"
                onClick={() => onRemove(s)}
                aria-label={`Remove ${s.name}`}
                className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </Cell>
          )}
        </Row>
      ))}
    </DataTable>
  );
}

/**
 * Skills & Competency framework — skill inventory, competency ratings on a
 * 1–5 proficiency scale, gap analysis against what the role requires, and the
 * employee's career aspirations. The foundation for succession planning.
 */
export function SkillsModule({ employeeId }: ModuleProps) {
  const dispatch = useAppDispatch();
  const canEdit = useCanMaintainOwnRecords();
  const { data, loading } = useEmployeeSkills(employeeId);
  const { data: aspirations } = useEmployeeAspirations(employeeId);
  const rfSkill = useRecordForm(COLLECTION_SCHEMAS.employeeSkills, employeeId);
  const rfAsp = useRecordForm(COLLECTION_SCHEMAS.careerAspirations, employeeId);

  const all = React.useMemo(() => data ?? [], [data]);
  const skills = all.filter((s) => s.type !== "competency");
  const competencies = all.filter((s) => s.type === "competency");
  const summary = summariseSkills(all);
  const gaps = [...all]
    .filter((s) => skillGap(s) > 0)
    .sort((a, b) => skillGap(b) - skillGap(a));

  if (loading && !data) return <LoadingPanel />;

  const remove = (key: string, id: string, what: string) => {
    dispatch(removeRecord({ key, id }));
    toast.success(`${what} removed`);
  };

  return (
    <Section
      title="Skills & Competencies"
      description="Skill inventory, competency ratings, proficiency levels, gap analysis and career aspirations."
      action={canEdit ? <AddButton label="Add skill" onClick={rfSkill.openCreate} /> : undefined}
    >
      {rfSkill.node}
      {rfAsp.node}

      {all.length === 0 ? (
        <Empty
          label="No skills assessed yet."
          description="Add skills and competencies with a 1–5 proficiency rating to start the gap analysis."
        />
      ) : (
        <>
          <StatStrip
            items={[
              { label: "Skills", value: skills.length },
              { label: "Competencies", value: competencies.length },
              { label: "Average proficiency", value: `${summary.averageLevel} / 5` },
              {
                label: "Meeting role requirement",
                value: `${summary.meetingRequirement} / ${summary.assessed}`,
                accent: "text-emerald-600",
              },
              {
                label: "Skill gaps",
                value: summary.gaps,
                accent: summary.gaps ? "text-rose-600" : undefined,
              },
            ]}
          />

          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold">Skill Inventory</h3>
            {skills.length === 0 ? (
              <Empty label="No skills recorded." />
            ) : (
              <SkillTable
                rows={skills}
                canEdit={canEdit}
                firstColumn="Skill"
                onEdit={rfSkill.openEdit}
                onRemove={(s) => remove("employeeSkills", s.id, "Skill")}
              />
            )}
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold">Competency Ratings</h3>
            {competencies.length === 0 ? (
              <Empty label="No competencies rated." />
            ) : (
              <SkillTable
                rows={competencies}
                canEdit={canEdit}
                firstColumn="Competency"
                onEdit={rfSkill.openEdit}
                onRemove={(s) => remove("employeeSkills", s.id, "Competency")}
              />
            )}
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Target className="h-4 w-4 text-muted-foreground" />
              Skill-Gap Analysis
            </h3>
            {gaps.length === 0 ? (
              <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-700">
                Every assessed skill meets or exceeds what the role requires.
              </p>
            ) : (
              <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3">
                {gaps.map((s) => {
                  const lvl = toLevel(s.level);
                  const req = toLevel(s.requiredLevel);
                  return (
                    <div key={s.id} className="grid grid-cols-[160px_1fr_90px] items-center gap-3 text-xs">
                      <span className="truncate font-medium">{s.name}</span>
                      <div className="relative h-2 rounded-full bg-muted">
                        <div
                          className="absolute inset-y-0 left-0 rounded-full bg-rose-200 dark:bg-rose-900/60"
                          style={{ width: `${(req / 5) * 100}%` }}
                        />
                        <div
                          className="absolute inset-y-0 left-0 rounded-full bg-amber-400"
                          style={{ width: `${(lvl / 5) * 100}%` }}
                        />
                      </div>
                      <span className="text-right text-muted-foreground">
                        {proficiencyLabel(lvl)} → {proficiencyLabel(req)}
                      </span>
                    </div>
                  );
                })}
                <p className="text-[10px] text-muted-foreground">
                  Amber: current level · Pink: level the role requires. Close the
                  largest gaps first through training or stretch assignments.
                </p>
              </div>
            )}
          </div>
        </>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <Compass className="h-4 w-4 text-muted-foreground" />
            Career Aspirations
          </h3>
          {canEdit && <AddButton label="Add aspiration" onClick={rfAsp.openCreate} />}
        </div>
        {!aspirations?.length ? (
          <Empty label="No career aspirations recorded." />
        ) : (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {aspirations.map((a) => (
              <div key={a.id} className="rounded-xl border border-border bg-card p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{a.aspiration}</p>
                    {a.targetRole && (
                      <p className="text-xs text-muted-foreground">Target role: {a.targetRole}</p>
                    )}
                  </div>
                  {canEdit && (
                    <span className="flex">
                      <EditButton onClick={() => rfAsp.openEdit(a)} />
                      <button
                        type="button"
                        onClick={() => remove("careerAspirations", a.id, "Aspiration")}
                        aria-label="Remove aspiration"
                        className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {a.timeframe && <Pill className="border-border bg-muted text-muted-foreground">{a.timeframe}</Pill>}
                  {a.mobility && <Pill className="border-border bg-muted text-muted-foreground">{a.mobility}</Pill>}
                </div>
                {a.developmentNeeds && (
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Development needs: {a.developmentNeeds}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}
