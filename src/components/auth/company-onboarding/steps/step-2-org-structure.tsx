"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "@/src/components/ui/label";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/src/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/src/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/src/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Info, Eye } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { updateOrganizationConfig, markStepComplete, setCurrentStep } from "@/src/lib/stores/onboarding-slice";

const MANAGER_TITLES = ["Line Manager", "Team leader", "Reporting Manager", "Supervisor", "Custom"];
const DEPARTMENT_LABELS = ["Department", "Teams", "Unit", "Division", "Custom"];

type StructureType = "hierarchical" | "flat" | "matrix";

const STRUCTURE_OPTIONS: {
  value: StructureType;
  label: string;
  desc: string;
  tooltip: string;
}[] = [
  {
    value: "hierarchical",
    label: "Hierarchical Structure",
    desc: "Recommended for traditional organisations — a traditional reporting structure where authority flows from the top down.",
    tooltip:
      "Each employee reports to exactly one manager above them, and authority flows downward through clearly defined levels — from the CEO to department heads to individual staff. The most common structure for established organisations with a clear chain of command.",
  },
  {
    value: "flat",
    label: "Flat Structure",
    desc: "Recommended for startups and small businesses — a structure with very few management layers (minimal hierarchy, everyone reports to a central point).",
    tooltip:
      "Most employees report directly to a single central point — often the CEO or founder — with very few, if any, layers of management in between. Common for early-stage startups and small teams that prioritise speed and direct communication.",
  },
  {
    value: "matrix",
    label: "Matrix Structure",
    desc: "Recommended for enterprise and project-based organisations.",
    tooltip:
      "An employee reports to more than one manager. Instead of a single reporting line, employees typically have: 1. A Functional Manager (their department manager) 2. A Project Manager (the manager for a specific project).",
  },
];

function InfoTooltip({ text }: { text: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            aria-label="More information"
          >
            <Info size={13} />
          </button>
        </TooltipTrigger>
        <TooltipContent>{text}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/** A single labelled box in a structure diagram. */
function DiagramBox({
  x,
  y,
  w,
  h,
  label,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
}) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={8} className="fill-card stroke-border" strokeWidth={1.5} />
      <text
        x={x + w / 2}
        y={y + h / 2}
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-foreground text-[12px] font-medium"
      >
        {label}
      </text>
    </g>
  );
}

/** CEO → Manager → Staff, one line straight down each level. */
function HierarchicalDiagram() {
  const w = 140;
  const h = 42;
  const cx = 160;
  return (
    <svg viewBox="0 0 320 230" className="h-auto w-full">
      <defs>
        <marker id="org-diagram-arrow-h" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" className="fill-muted-foreground" />
        </marker>
      </defs>
      <DiagramBox x={cx - w / 2} y={10} w={w} h={h} label="CEO" />
      <line x1={cx} y1={52} x2={cx} y2={83} className="stroke-muted-foreground" strokeWidth={1.5} markerEnd="url(#org-diagram-arrow-h)" />
      <DiagramBox x={cx - w / 2} y={94} w={w} h={h} label="Manager" />
      <line x1={cx} y1={136} x2={cx} y2={167} className="stroke-muted-foreground" strokeWidth={1.5} markerEnd="url(#org-diagram-arrow-h)" />
      <DiagramBox x={cx - w / 2} y={178} w={w} h={h} label="Staff" />
    </svg>
  );
}

/** CEO at the top, everyone else reporting straight to it — no middle layer. */
function FlatDiagram() {
  const boxW = 88;
  const boxH = 38;
  const ceoX = 160 - boxW / 2;
  const staffY = 130;
  const staffXs = [26, 160 - boxW / 2, 294 - boxW];
  return (
    <svg viewBox="0 0 320 190" className="h-auto w-full">
      <DiagramBox x={ceoX} y={10} w={boxW} h={boxH} label="CEO" />
      {staffXs.map((x, i) => (
        <line
          key={i}
          x1={160}
          y1={48}
          x2={x + boxW / 2}
          y2={staffY}
          className="stroke-muted-foreground"
          strokeWidth={1.5}
        />
      ))}
      {staffXs.map((x, i) => (
        <DiagramBox key={i} x={x} y={staffY} w={boxW} h={boxH} label="Staff" />
      ))}
    </svg>
  );
}

/** Two managers, one dual-reporting employee — the defining feature of a matrix. */
function MatrixDiagram() {
  const boxW = 128;
  const boxH = 42;
  const employeeW = 150;
  return (
    <svg viewBox="0 0 320 200" className="h-auto w-full">
      <DiagramBox x={8} y={10} w={boxW} h={boxH} label="Functional Manager" />
      <DiagramBox x={320 - boxW - 8} y={10} w={boxW} h={boxH} label="Project Manager" />
      <line
        x1={8 + boxW / 2}
        y1={52}
        x2={160}
        y2={140}
        className="stroke-primary"
        strokeWidth={1.5}
        strokeDasharray="4 3"
      />
      <line
        x1={320 - boxW / 2 - 8}
        y1={52}
        x2={160}
        y2={140}
        className="stroke-primary"
        strokeWidth={1.5}
        strokeDasharray="4 3"
      />
      <DiagramBox x={160 - employeeW / 2} y={140} w={employeeW} h={boxH} label="Employee" />
    </svg>
  );
}

const STRUCTURE_DIAGRAMS: Record<StructureType, () => React.JSX.Element> = {
  hierarchical: HierarchicalDiagram,
  flat: FlatDiagram,
  matrix: MatrixDiagram,
};

/** The "View Diagram" popup — a proper visual aid instead of the small ASCII sketch that used to sit on the card. */
function StructurePreviewModal({
  option,
  onClose,
}: {
  option: (typeof STRUCTURE_OPTIONS)[number] | null;
  onClose: () => void;
}) {
  const Diagram = option ? STRUCTURE_DIAGRAMS[option.value] : null;
  return (
    <Dialog open={option !== null} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        {option && Diagram && (
          <>
            <DialogHeader>
              <DialogTitle>{option.label}</DialogTitle>
              <DialogDescription>{option.desc}</DialogDescription>
            </DialogHeader>
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <Diagram />
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">{option.tooltip}</p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

const schema = z.object({
  managerTitle: z.string().min(1, "Required"),
  customManagerTitle: z.string().optional(),
  departmentLabel: z.string().min(1, "Required"),
  customDepartmentLabel: z.string().optional(),
  structureType: z.enum(["hierarchical", "flat", "matrix"]),
});

type FormValues = z.infer<typeof schema>;

export function Step2OrgStructure() {
  const dispatch = useAppDispatch();
  const config = useAppSelector((s) => s.onboarding.companySetup.organizationConfig);
  const [previewType, setPreviewType] = useState<StructureType | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      managerTitle: config.managerTitle,
      departmentLabel: config.departmentLabel,
      structureType: config.structureType,
    },
  });

  useEffect(() => {
    setValue("managerTitle", config.managerTitle);
    setValue("departmentLabel", config.departmentLabel);
    setValue("structureType", config.structureType);
  }, [config, setValue]);

  const managerTitle = watch("managerTitle");
  const departmentLabel = watch("departmentLabel");
  const previewOption = STRUCTURE_OPTIONS.find((o) => o.value === previewType) ?? null;

  const onSubmit = (data: FormValues) => {
    const finalTitle = data.managerTitle === "Custom" ? (data.customManagerTitle || "Manager") : data.managerTitle;
    const finalDepartmentLabel = data.departmentLabel === "Custom" ? (data.customDepartmentLabel || "Department") : data.departmentLabel;
    dispatch(updateOrganizationConfig({
      managerTitle: finalTitle,
      departmentLabel: finalDepartmentLabel,
      structureType: data.structureType,
    }));
    dispatch(markStepComplete(2));
    dispatch(setCurrentStep(3));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5">
          <Label>What do you call your supervisor?</Label>
          <InfoTooltip text="This label is used throughout the platform wherever a line manager or supervisor is referenced." />
        </div>
        <Select
          defaultValue={config.managerTitle}
          onValueChange={(v) => setValue("managerTitle", v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select title" />
          </SelectTrigger>
          <SelectContent>
            {MANAGER_TITLES.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.managerTitle && <span className="text-xs text-destructive">{errors.managerTitle.message}</span>}

        {managerTitle === "Custom" && (
          <div className="mt-2">
            <Input placeholder="Enter custom title" {...register("customManagerTitle")} />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5">
          <Label>What do you call a department/team in your organisation?</Label>
          <InfoTooltip text="This label is used throughout the platform wherever an organisational grouping (department, team, unit) is referenced." />
        </div>
        <Select
          defaultValue={config.departmentLabel}
          onValueChange={(v) => setValue("departmentLabel", v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select label" />
          </SelectTrigger>
          <SelectContent>
            {DEPARTMENT_LABELS.map((d) => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.departmentLabel && <span className="text-xs text-destructive">{errors.departmentLabel.message}</span>}

        {departmentLabel === "Custom" && (
          <div className="mt-2">
            <Input placeholder="Enter custom label" {...register("customDepartmentLabel")} />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <Label>Organisational Structure Type</Label>
          <InfoTooltip text="This determines how reporting lines and approval chains are modelled across the platform." />
        </div>
        <RadioGroup
          defaultValue={config.structureType}
          onValueChange={(v) => setValue("structureType", v as StructureType)}
          className="flex flex-col gap-3 mt-1"
        >
          {STRUCTURE_OPTIONS.map(({ value, label, desc, tooltip }) => (
            <div
              key={value}
              className="flex items-start gap-3 rounded-lg border border-border p-4 cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <RadioGroupItem value={value} id={value} className="mt-0.5" />
              <div className="flex flex-1 flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <label htmlFor={value} className="text-sm font-medium text-foreground cursor-pointer">
                      {label}
                    </label>
                    <InfoTooltip text={tooltip} />
                  </div>
                  <span className="text-xs text-muted-foreground">{desc}</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 gap-1.5 self-start text-xs"
                  onClick={() => setPreviewType(value)}
                >
                  <Eye className="size-3.5" />
                  View Diagram
                </Button>
              </div>
            </div>
          ))}
        </RadioGroup>
        {errors.structureType && <span className="text-xs text-destructive">{errors.structureType.message}</span>}
      </div>

      <div className="flex justify-between pt-2">
        <Button type="button" variant="outline" onClick={() => dispatch(setCurrentStep(1))}>
          Back
        </Button>
        <Button type="submit" style={{ backgroundColor: "#D85A30", borderColor: "#D85A30" }}>
          Continue
        </Button>
      </div>

      <StructurePreviewModal option={previewOption} onClose={() => setPreviewType(null)} />
    </form>
  );
}
