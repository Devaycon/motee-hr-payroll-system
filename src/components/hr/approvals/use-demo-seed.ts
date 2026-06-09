"use client";

import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { seedRequests } from "@/src/lib/stores/approvals-slice";
import type {
  ApprovalAttachment,
  ApprovalDocumentType,
  ApprovalEvent,
  ApprovalRequest,
  ApprovalSignature,
  ApprovalSignaturePlacement,
  ApprovalStatus,
  ApprovalStepInstance,
} from "@/src/lib/types/approvals";
import { resolveApprover } from "@/src/lib/permissions/approver-resolution";
import type { LocaleBundle, LocaleEmployee } from "@/src/lib/types/locale";

/* ---------- Mock data URLs ---------- */

function svgDataUrl(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const SIGNATURE_VARIANTS: string[] = [
  svgDataUrl(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60"><path d="M10 40 Q 25 18 45 35 T 80 30 Q 95 22 110 38 T 145 32 Q 160 22 180 36" stroke="#111" fill="none" stroke-width="2.4" stroke-linecap="round"/></svg>`,
  ),
  svgDataUrl(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60"><path d="M12 38 C 30 12 50 50 70 30 S 110 12 130 38 S 170 16 192 32" stroke="#111" fill="none" stroke-width="2.4" stroke-linecap="round"/><circle cx="186" cy="32" r="3" fill="#111"/></svg>`,
  ),
  svgDataUrl(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 60"><path d="M14 44 Q 30 14 50 32 Q 70 50 88 26 Q 108 8 124 36 Q 140 56 158 30 Q 178 12 188 38" stroke="#111" fill="none" stroke-width="2.6" stroke-linecap="round"/></svg>`,
  ),
];

function mockAttachment(
  title: string,
  subtitle: string,
  color: string,
): { name: string; mimeType: string; dataUrl: string; sizeBytes: number } {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 800">
  <rect width="600" height="800" fill="#ffffff"/>
  <rect x="0" y="0" width="600" height="120" fill="${color}"/>
  <text x="40" y="80" font-family="sans-serif" font-size="36" font-weight="700" fill="#ffffff">${title}</text>
  <text x="40" y="160" font-family="sans-serif" font-size="18" fill="#374151">${subtitle}</text>
  <line x1="40" y1="200" x2="560" y2="200" stroke="#e5e7eb" stroke-width="2"/>
  <text x="40" y="240" font-family="sans-serif" font-size="14" fill="#6b7280">Reference: DOC-${Math.floor(Math.random() * 90000) + 10000}</text>
  <text x="40" y="270" font-family="sans-serif" font-size="14" fill="#6b7280">Issued: 2026-05-${(Math.floor(Math.random() * 28) + 1).toString().padStart(2, "0")}</text>
  ${Array.from({ length: 12 })
    .map(
      (_, i) =>
        `<line x1="40" y1="${320 + i * 30}" x2="${320 + Math.floor(Math.random() * 240)}" y2="${320 + i * 30}" stroke="#d1d5db" stroke-width="2"/>`,
    )
    .join("")}
  <rect x="40" y="700" width="200" height="60" fill="none" stroke="#9ca3af" stroke-dasharray="4 4"/>
  <text x="50" y="735" font-family="sans-serif" font-size="11" fill="#6b7280">Signature area</text>
</svg>`;
  return {
    name: `${title.toLowerCase().replace(/\s+/g, "_")}.svg`,
    mimeType: "image/svg+xml",
    dataUrl: svgDataUrl(svg),
    sizeBytes: svg.length,
  };
}

const ATT_MEDICAL = () =>
  mockAttachment("Medical Certificate", "Sahel General Hospital", "#0EA5E9");
const ATT_CONTRACT = () =>
  mockAttachment("Employment Contract", "Sahel Fintech HR", "#1E40AF");
const ATT_RECEIPT = () =>
  mockAttachment("Receipt", "RSVP Restaurant", "#16A34A");
const ATT_PROFORMA = () =>
  mockAttachment("Pro-forma Invoice", "A Cloud Guru", "#7C3AED");
const ATT_EXIT_FORM = () =>
  mockAttachment("Exit Checklist", "Sahel Fintech HR", "#DC2626");
const ATT_PURCHASE = () =>
  mockAttachment("Vendor Quote", "Apple Authorised Reseller", "#D97706");

/* ---------- Scenario definitions ---------- */

interface ReviewerSignatureSpec {
  stepIndex: number;
  variantIndex?: number; // which of SIGNATURE_VARIANTS to use
  placement?: ApprovalSignaturePlacement; // optional placement (image only)
}

interface SkippedSpec {
  stepIndex: number;
  reassignedFromName?: string;
  rerouteToManager?: boolean;
}

interface Scenario {
  documentType: ApprovalDocumentType;
  submitterIndex?: number; // pick deterministically into the pool
  title: (e: LocaleEmployee) => string;
  summary: (e: LocaleEmployee) => string;
  payload: (e: LocaleEmployee) => Record<string, unknown>;
  status: ApprovalStatus;
  progressTo?: number; // 0-based count of already-approved steps
  attachments?: Array<ReturnType<typeof mockAttachment>>;
  submitterSignsAt?: number; // SIGNATURE_VARIANTS index, undefined = no signature
  reviewerSignatures?: ReviewerSignatureSpec[];
  skipped?: SkippedSpec[];
  rejectionNote?: string;
  returnNote?: string;
}

const SCENARIOS: Scenario[] = [
  // Leave Requests (4)
  {
    documentType: "leave_request",
    submitterIndex: 0,
    title: () => "Annual leave – 5 days",
    summary: (e) => `${e.fullName} requesting Jun 8–12`,
    payload: () => ({
      leaveType: "Annual",
      startDate: "2026-06-08",
      endDate: "2026-06-12",
      totalDays: 5,
    }),
    status: "in_progress",
  },
  {
    documentType: "leave_request",
    submitterIndex: 1,
    title: () => "Sick leave – 2 days",
    summary: (e) => `${e.fullName} unwell`,
    payload: () => ({
      leaveType: "Sick",
      startDate: "2026-05-28",
      endDate: "2026-05-29",
      totalDays: 2,
    }),
    status: "approved",
    progressTo: 2,
    attachments: [ATT_MEDICAL()],
  },
  {
    documentType: "leave_request",
    submitterIndex: 2,
    title: () => "Compassionate – 3 days",
    summary: (e) => `${e.fullName} bereavement`,
    payload: () => ({
      leaveType: "Compassionate",
      startDate: "2026-06-02",
      endDate: "2026-06-04",
      totalDays: 3,
    }),
    status: "in_progress",
    progressTo: 1,
  },
  {
    documentType: "leave_request",
    submitterIndex: 3,
    title: () => "Study leave – 10 days",
    summary: (e) => `${e.fullName} for AWS exam preparation`,
    payload: () => ({
      leaveType: "Study",
      startDate: "2026-07-15",
      endDate: "2026-07-26",
      totalDays: 10,
    }),
    status: "returned",
    returnNote: "Please attach the exam booking confirmation.",
  },

  // Job Requisitions (3)
  {
    documentType: "job_requisition",
    submitterIndex: 4,
    title: () => "Hire Senior Backend Engineer",
    summary: () => "Replacing departing senior in Engineering",
    payload: () => ({
      positionTitle: "Senior Backend Engineer",
      department: "Engineering",
      openings: 1,
      salaryRange: "₦12–16M",
    }),
    status: "in_progress",
    progressTo: 1,
    skipped: [
      // Pretend step 2 (Finance) is on leave → rerouted to manager
      { stepIndex: 2, reassignedFromName: "Adebayo Finance" },
    ],
  },
  {
    documentType: "job_requisition",
    submitterIndex: 5,
    title: () => "Hire Junior Frontend Engineer",
    summary: () => "Backfill for Q3 roadmap",
    payload: () => ({
      positionTitle: "Junior Frontend Engineer",
      department: "Engineering",
      openings: 2,
      salaryRange: "₦6–9M",
    }),
    status: "approved",
    progressTo: 3,
    reviewerSignatures: [
      { stepIndex: 2, variantIndex: 1 },
    ],
  },
  {
    documentType: "job_requisition",
    submitterIndex: 6,
    title: () => "Hire Marketing Lead",
    summary: () => "Drive growth into 2H",
    payload: () => ({
      positionTitle: "Marketing Lead",
      department: "Growth",
      openings: 1,
      salaryRange: "₦14–18M",
    }),
    status: "rejected",
    progressTo: 1,
    rejectionNote: "Budget freeze until Q4. Reopen after October planning.",
  },

  // Contracts (3)
  {
    documentType: "contract",
    submitterIndex: 7,
    title: (e) => `Employment contract – ${e.fullName}`,
    summary: () => "New hire onboarding contract",
    payload: (e) => ({
      counterparty: e.fullName,
      contractType: "Employment",
      startDate: "2026-06-15",
    }),
    status: "approved",
    progressTo: 2,
    attachments: [ATT_CONTRACT()],
    submitterSignsAt: 0,
    reviewerSignatures: [
      {
        stepIndex: 0,
        variantIndex: 1,
        placement: { attachmentId: "", x: 0.18, y: 0.92, width: 0.22 },
      },
      {
        stepIndex: 1,
        variantIndex: 2,
        placement: { attachmentId: "", x: 0.7, y: 0.92, width: 0.22 },
      },
    ],
  },
  {
    documentType: "contract",
    submitterIndex: 8,
    title: (e) => `NDA – ${e.fullName}`,
    summary: () => "Confidentiality agreement for contractor",
    payload: (e) => ({
      counterparty: e.fullName,
      contractType: "NDA",
      startDate: "2026-06-01",
    }),
    status: "in_progress",
    progressTo: 1,
    attachments: [ATT_CONTRACT()],
    submitterSignsAt: 2,
  },
  {
    documentType: "contract",
    submitterIndex: 9,
    title: (e) => `Contract amendment – ${e.fullName}`,
    summary: () => "Update notice period to 60 days",
    payload: (e) => ({
      counterparty: e.fullName,
      contractType: "Amendment",
      startDate: "2026-06-01",
    }),
    status: "returned",
    attachments: [ATT_CONTRACT()],
    returnNote: "Please attach the signed amendment PDF.",
  },

  // Offboarding Clearance (2)
  {
    documentType: "offboarding_clearance",
    submitterIndex: 10,
    title: (e) => `Offboarding – ${e.fullName}`,
    summary: () => "Final day 2026-06-30, resigned",
    payload: () => ({
      lastDay: "2026-06-30",
      reason: "Resigned",
    }),
    status: "in_progress",
    progressTo: 2,
    attachments: [ATT_EXIT_FORM()],
    submitterSignsAt: 0,
    reviewerSignatures: [{ stepIndex: 0, variantIndex: 0 }],
    skipped: [
      // IT Admin on leave; reroute to manager
      { stepIndex: 1, reassignedFromName: "Tunde IT", rerouteToManager: true },
    ],
  },
  {
    documentType: "offboarding_clearance",
    submitterIndex: 11,
    title: (e) => `Offboarding – ${e.fullName}`,
    summary: () => "Junior dev leaving for further studies",
    payload: () => ({
      lastDay: "2026-07-15",
      reason: "Resigned",
    }),
    status: "approved",
    progressTo: 4,
    attachments: [ATT_EXIT_FORM()],
    submitterSignsAt: 1,
    reviewerSignatures: [
      { stepIndex: 0, variantIndex: 0 },
      { stepIndex: 1, variantIndex: 1 },
      { stepIndex: 2, variantIndex: 2 },
      { stepIndex: 3, variantIndex: 0 },
    ],
  },

  // Promotion / Salary Change (3)
  {
    documentType: "promotion_request",
    submitterIndex: 12,
    title: (e) => `Promote ${e.fullName} to Tech Lead`,
    summary: () => "4y tenure, consistently exceeds expectations",
    payload: () => ({
      newTitle: "Tech Lead",
      newGrade: "L5",
      newSalary: 18000000,
      effectiveDate: "2026-07-01",
    }),
    status: "in_progress",
    progressTo: 1,
    reviewerSignatures: [{ stepIndex: 0, variantIndex: 1 }],
  },
  {
    documentType: "promotion_request",
    submitterIndex: 13,
    title: (e) => `Promote ${e.fullName} to Senior Analyst`,
    summary: () => "Performance review cycle outcome",
    payload: () => ({
      newTitle: "Senior Analyst",
      newGrade: "L4",
      newSalary: 11000000,
      effectiveDate: "2026-08-01",
    }),
    status: "approved",
    progressTo: 3,
    reviewerSignatures: [
      { stepIndex: 0, variantIndex: 0 },
      { stepIndex: 1, variantIndex: 1 },
      { stepIndex: 2, variantIndex: 2 },
    ],
  },
  {
    documentType: "promotion_request",
    submitterIndex: 14,
    title: (e) => `Salary adjustment – ${e.fullName}`,
    summary: () => "Market correction",
    payload: () => ({
      newTitle: "Operations Manager",
      newGrade: "M2",
      newSalary: 14500000,
      effectiveDate: "2026-07-15",
    }),
    status: "returned",
    returnNote:
      "Please attach the benchmarking data referenced in the proposal.",
  },

  // Training (3)
  {
    documentType: "training_request",
    submitterIndex: 15,
    title: (e) => `AWS SA Associate – ${e.fullName}`,
    summary: () => "Self-paced course + exam",
    payload: () => ({
      course: "AWS Solutions Architect Associate",
      provider: "A Cloud Guru",
      cost: 200000,
      startDate: "2026-06-15",
    }),
    status: "approved",
    progressTo: 2,
    attachments: [ATT_PROFORMA()],
  },
  {
    documentType: "training_request",
    submitterIndex: 16,
    title: (e) => `PMP Certification – ${e.fullName}`,
    summary: () => "Project Management Professional",
    payload: () => ({
      course: "PMP Certification",
      provider: "PMI Nigeria",
      cost: 450000,
      startDate: "2026-08-01",
    }),
    status: "in_progress",
    progressTo: 1,
    attachments: [ATT_PROFORMA()],
  },
  {
    documentType: "training_request",
    submitterIndex: 17,
    title: (e) => `DevConf attendance – ${e.fullName}`,
    summary: () => "International conference + travel",
    payload: () => ({
      course: "DevConf 2026",
      provider: "Linux Foundation",
      cost: 1200000,
      startDate: "2026-09-10",
    }),
    status: "rejected",
    progressTo: 1,
    rejectionNote:
      "Travel budget already allocated to AWS Summit. Re-apply in 2027.",
  },

  // Asset Requests (3)
  {
    documentType: "asset_request",
    submitterIndex: 18,
    title: (e) => `MacBook Pro 16" – ${e.fullName}`,
    summary: () => "Current laptop is 4y old",
    payload: () => ({
      assetType: "Laptop",
      model: 'MacBook Pro 16" M3 Max',
      justification: "Performance replacement",
    }),
    status: "in_progress",
    progressTo: 1,
    attachments: [ATT_PURCHASE()],
  },
  {
    documentType: "asset_request",
    submitterIndex: 19,
    title: (e) => `iPhone 15 work device – ${e.fullName}`,
    summary: () => "Company phone for on-call rotation",
    payload: () => ({
      assetType: "Phone",
      model: "iPhone 15",
      justification: "On-call",
    }),
    status: "approved",
    progressTo: 2,
  },
  {
    documentType: "asset_request",
    submitterIndex: 0,
    title: (e) => `External monitor – ${e.fullName}`,
    summary: () => "Dual-screen setup for design work",
    payload: () => ({
      assetType: "Monitor",
      model: "Dell U2723QE 27\"",
      justification: "Design productivity",
    }),
    status: "in_progress",
  },

  // Expense Claims (3)
  {
    documentType: "expense_claim",
    submitterIndex: 1,
    title: (e) => `Client dinner – ${e.fullName}`,
    summary: () => "Q2 quarterly partner dinner",
    payload: () => ({
      category: "Meals & Entertainment",
      amount: 65000,
      incurredOn: "2026-05-22",
      merchant: "RSVP Restaurant",
    }),
    status: "rejected",
    attachments: [ATT_RECEIPT()],
    rejectionNote: "Exceeds policy cap of ₦40k for client meals.",
  },
  {
    documentType: "expense_claim",
    submitterIndex: 2,
    title: (e) => `Travel reimbursement – ${e.fullName}`,
    summary: () => "Client site visit, Abuja",
    payload: () => ({
      category: "Travel",
      amount: 145000,
      incurredOn: "2026-05-15",
      merchant: "Air Peace + Bolt",
    }),
    status: "approved",
    progressTo: 2,
    attachments: [ATT_RECEIPT()],
    reviewerSignatures: [{ stepIndex: 1, variantIndex: 0 }],
  },
  {
    documentType: "expense_claim",
    submitterIndex: 3,
    title: (e) => `Software subscription – ${e.fullName}`,
    summary: () => "Notion team plan, 1 year",
    payload: () => ({
      category: "Software",
      amount: 360000,
      incurredOn: "2026-05-01",
      merchant: "Notion Labs",
    }),
    status: "in_progress",
    progressTo: 1,
    attachments: [ATT_RECEIPT()],
  },
];

/* ---------- Resolution helpers ---------- */

/**
 * Submitters need:
 *   - not on leave (so their resolved Line Manager isn't on leave),
 *   - a real `managerId` (so LINE_MANAGER steps resolve to a person and we
 *     don't end up with `Unassigned · approved` rows in the seed).
 * The C-suite (no manager) is excluded so every seeded chain is internally
 * consistent.
 */
function pickSubmitters(bundle: LocaleBundle): LocaleEmployee[] {
  const strict = bundle.employees.filter(
    (e) => e.status !== "on_leave" && !!e.managerId,
  );
  if (strict.length > 0) return strict;
  const relaxed = bundle.employees.filter((e) => e.status !== "on_leave");
  return relaxed.length > 0 ? relaxed : bundle.employees;
}

const STEP_BLUEPRINTS: Record<
  ApprovalDocumentType,
  { label: string; approver: ApprovalStepInstance["approver"] }[]
> = {
  leave_request: [
    { label: "Line Manager", approver: "LINE_MANAGER" },
    { label: "HR Manager", approver: "ROLE:ROLE-HRMGR" },
  ],
  job_requisition: [
    { label: "Line Manager", approver: "LINE_MANAGER" },
    { label: "HR Manager", approver: "ROLE:ROLE-HRMGR" },
    { label: "Finance", approver: "ROLE:ROLE-FIN" },
  ],
  contract: [
    { label: "HR Manager", approver: "ROLE:ROLE-HRMGR" },
    { label: "HR Admin", approver: "ROLE:ROLE-HRADMIN" },
  ],
  offboarding_clearance: [
    { label: "Line Manager", approver: "LINE_MANAGER" },
    { label: "IT Admin", approver: "ROLE:ROLE-IT" },
    { label: "Finance", approver: "ROLE:ROLE-FIN" },
    { label: "HR Admin", approver: "ROLE:ROLE-HRADMIN" },
  ],
  promotion_request: [
    { label: "Line Manager", approver: "LINE_MANAGER" },
    { label: "HR Admin", approver: "ROLE:ROLE-HRADMIN" },
    { label: "Finance", approver: "ROLE:ROLE-FIN" },
  ],
  training_request: [
    { label: "Line Manager", approver: "LINE_MANAGER" },
    { label: "HR Manager", approver: "ROLE:ROLE-HRMGR" },
  ],
  asset_request: [
    { label: "Line Manager", approver: "LINE_MANAGER" },
    { label: "IT Admin", approver: "ROLE:ROLE-IT" },
  ],
  expense_claim: [
    { label: "Line Manager", approver: "LINE_MANAGER" },
    { label: "Finance", approver: "ROLE:ROLE-FIN" },
  ],
};

function buildStepsForSeed(
  bundle: LocaleBundle,
  documentType: ApprovalDocumentType,
  submitterId: string,
): { templateId: string; steps: ApprovalStepInstance[] } {
  const templateId = `ACT-DEFAULT-${documentType
    .toUpperCase()
    .replace(/_/g, "-")}`;
  const submitter = bundle.employees.find((e) => e.id === submitterId);
  if (!submitter) return { templateId, steps: [] };
  const blueprint = STEP_BLUEPRINTS[documentType];
  const steps: ApprovalStepInstance[] = blueprint.map((b, i) => {
    const resolved = resolveApprover(
      b.approver,
      {
        employeeId: submitter.id,
        name: submitter.fullName,
        initials: submitter.initials,
        departmentName: submitter.departmentName,
      },
      bundle,
    );
    return {
      id: `SEED-STEP-${documentType}-${submitter.id}-${i + 1}`,
      order: i + 1,
      templateStepId: `seed-${i + 1}`,
      label: b.label,
      approver: b.approver,
      resolvedEmployeeId: resolved.employeeId,
      resolvedEmployeeName: resolved.employeeName,
      status: "pending",
    };
  });
  return { templateId, steps };
}

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function attachmentInstance(
  spec: ReturnType<typeof mockAttachment>,
  submitterId: string,
  i: number,
): ApprovalAttachment {
  return {
    id: `SEED-ATT-${submitterId}-${i}-${Math.floor(Math.random() * 9000) + 1000}`,
    name: spec.name,
    mimeType: spec.mimeType,
    sizeBytes: spec.sizeBytes,
    dataUrl: spec.dataUrl,
    uploadedAt: isoDaysAgo(SCENARIOS.length),
    uploadedByEmployeeId: submitterId,
  };
}

function buildSeedRequests(bundle: LocaleBundle): ApprovalRequest[] {
  const pool = pickSubmitters(bundle);
  if (pool.length === 0) return [];

  return SCENARIOS.map((s, idx) => {
    const submitter = pool[(s.submitterIndex ?? idx) % pool.length];
    const { templateId, steps } = buildStepsForSeed(
      bundle,
      s.documentType,
      submitter.id,
    );
    const submittedAt = isoDaysAgo(SCENARIOS.length - idx);
    const submitterInfo = {
      employeeId: submitter.id,
      name: submitter.fullName,
      initials: submitter.initials,
      departmentName: submitter.departmentName,
    };
    const history: ApprovalEvent[] = [
      {
        id: `SEED-EVT-SUB-${s.documentType}-${idx}`,
        at: submittedAt,
        actorEmployeeId: submitter.id,
        actorName: submitter.fullName,
        type: "submitted",
      },
    ];

    // Build attachments (with proper id wiring so signature placements can target)
    const attachments: ApprovalAttachment[] = (s.attachments ?? []).map(
      (a, i) => attachmentInstance(a, submitter.id, i),
    );
    const firstAttachmentId = attachments[0]?.id;

    // Apply skip configuration
    const skipMap = new Map<number, SkippedSpec>(
      (s.skipped ?? []).map((sk) => [sk.stepIndex, sk]),
    );
    skipMap.forEach((spec, stepIndex) => {
      const step = steps[stepIndex];
      if (!step) return;
      if (spec.rerouteToManager) {
        // Find a manager candidate for the on-leave person; fall back to no change
        const onLeaveEmp = bundle.employees.find(
          (e) => e.id === step.resolvedEmployeeId,
        );
        const manager = onLeaveEmp?.managerId
          ? bundle.employees.find((e) => e.id === onLeaveEmp.managerId)
          : null;
        if (manager) {
          step.reassignedFromEmployeeId = step.resolvedEmployeeId ?? undefined;
          step.reassignedFromName =
            spec.reassignedFromName ?? onLeaveEmp?.fullName;
          step.resolvedEmployeeId = manager.id;
          step.resolvedEmployeeName = manager.fullName;
          step.skippedReason = "on_leave";
          return;
        }
      }
      step.status = "skipped";
      step.skippedReason = "on_leave";
      step.decidedAt = submittedAt;
      step.reassignedFromName = spec.reassignedFromName;
    });

    // Apply progressTo (mark first N non-skipped resolved steps as approved).
    // Steps without a resolved approver are left as pending so we never
    // produce "Unassigned · approved" rows.
    let progressed = 0;
    let firstActiveIdx = 0;
    if (s.progressTo && s.progressTo > 0) {
      for (let i = 0; i < steps.length && progressed < s.progressTo; i += 1) {
        if (steps[i].status === "skipped") continue;
        if (!steps[i].resolvedEmployeeId) break;
        steps[i].status = "approved";
        const decidedAt = isoDaysAgo(SCENARIOS.length - idx - 1 + i);
        steps[i].decidedAt = decidedAt;
        history.push({
          id: `SEED-EVT-APP-${s.documentType}-${idx}-${i}`,
          at: decidedAt,
          actorEmployeeId:
            steps[i].resolvedEmployeeId ?? submitter.id,
          actorName: steps[i].resolvedEmployeeName ?? "Approver",
          type: "approved",
          stepOrder: steps[i].order,
        });
        progressed += 1;
      }
    }

    // currentStepIndex = first non-skipped, non-approved step
    let cursor = 0;
    while (
      cursor < steps.length &&
      (steps[cursor].status === "approved" ||
        steps[cursor].status === "skipped")
    ) {
      cursor += 1;
    }
    firstActiveIdx = cursor;

    // Build signatures container
    const signatures: ApprovalSignature[] = [];

    // Submitter signature
    if (s.submitterSignsAt !== undefined) {
      signatures.push({
        id: `SEED-SIG-SUB-${idx}`,
        signerEmployeeId: submitter.id,
        signerName: submitter.fullName,
        dataUrl:
          SIGNATURE_VARIANTS[s.submitterSignsAt % SIGNATURE_VARIANTS.length],
        placement: null,
        signedAt: submittedAt,
        role: "submitter",
      });
    }

    // Reviewer signatures (only attached to steps that have been approved)
    (s.reviewerSignatures ?? []).forEach((spec, k) => {
      const step = steps[spec.stepIndex];
      if (!step || step.status !== "approved") return;
      const placement: ApprovalSignaturePlacement | null = spec.placement
        ? { ...spec.placement, attachmentId: firstAttachmentId ?? "" }
        : null;
      const sigId = `SEED-SIG-REV-${idx}-${k}`;
      signatures.push({
        id: sigId,
        signerEmployeeId: step.resolvedEmployeeId ?? submitter.id,
        signerName: step.resolvedEmployeeName ?? "Approver",
        dataUrl:
          SIGNATURE_VARIANTS[
            (spec.variantIndex ?? k + 1) % SIGNATURE_VARIANTS.length
          ],
        placement,
        signedAt: step.decidedAt ?? submittedAt,
        role: "reviewer",
        stepId: step.id,
      });
      step.signatureId = sigId;
    });

    let status = s.status;

    if (status === "approved") {
      // Force remaining non-skipped resolved steps to approved. If any
      // pending step is unresolved, demote the overall status to
      // in_progress so the queue stays internally consistent.
      let downgrade = false;
      for (let i = 0; i < steps.length; i += 1) {
        if (steps[i].status === "pending") {
          if (!steps[i].resolvedEmployeeId) {
            downgrade = true;
            break;
          }
          steps[i].status = "approved";
          steps[i].decidedAt = submittedAt;
        }
      }
      if (downgrade) {
        status = "in_progress";
        // recompute cursor — first pending non-skipped step
        cursor = 0;
        while (
          cursor < steps.length &&
          (steps[cursor].status === "approved" ||
            steps[cursor].status === "skipped")
        ) {
          cursor += 1;
        }
      } else {
        cursor = steps.length;
      }
    } else if (status === "rejected") {
      // Find first non-skipped pending step and mark rejected
      let target = firstActiveIdx;
      while (target < steps.length && steps[target].status === "skipped") {
        target += 1;
      }
      if (target >= steps.length) {
        target = Math.max(0, steps.length - 1);
      }
      const step = steps[target];
      if (step) {
        step.status = "rejected";
        step.note = s.rejectionNote;
        step.decidedAt = isoDaysAgo(1);
        history.push({
          id: `SEED-EVT-REJ-${idx}`,
          at: step.decidedAt,
          actorEmployeeId: step.resolvedEmployeeId ?? submitter.id,
          actorName: step.resolvedEmployeeName ?? "Reviewer",
          type: "rejected",
          stepOrder: step.order,
          note: s.rejectionNote,
        });
      }
    } else if (status === "returned") {
      let target = firstActiveIdx;
      while (target < steps.length && steps[target].status === "skipped") {
        target += 1;
      }
      if (target >= steps.length) {
        target = Math.max(0, steps.length - 1);
      }
      const step = steps[target];
      if (step) {
        step.status = "returned";
        step.note = s.returnNote;
        step.decidedAt = isoDaysAgo(1);
        history.push({
          id: `SEED-EVT-RET-${idx}`,
          at: step.decidedAt,
          actorEmployeeId: step.resolvedEmployeeId ?? submitter.id,
          actorName: step.resolvedEmployeeName ?? "Reviewer",
          type: "returned",
          stepOrder: step.order,
          note: s.returnNote,
        });
      }
    }

    return {
      id: `SEED-APR-${s.documentType}-${idx}-${submitter.id}`,
      documentType: s.documentType,
      documentId: `SEED-DOC-${s.documentType}-${idx}`,
      documentTitle: s.title(submitter),
      documentSummary: s.summary(submitter),
      payloadSnapshot: s.payload(submitter),
      submittedBy: submitterInfo,
      submittedAt,
      chainTemplateId: templateId,
      currentStepIndex: status === "approved" ? steps.length : cursor,
      status,
      steps,
      history,
      attachments,
      signatures,
    };
  });
}

/* ---------- Hook ---------- */

export function useDemoApprovalSeed(): void {
  const dispatch = useAppDispatch();
  const bundle = useAppSelector((s) => s.locale.data);
  const requestCount = useAppSelector((s) => s.approvals.requests.length);
  const tried = useRef(false);

  useEffect(() => {
    if (tried.current) return;
    if (!bundle) return;
    if (requestCount > 0) {
      tried.current = true;
      return;
    }
    const timer = setTimeout(() => {
      const seeds = buildSeedRequests(bundle);
      if (seeds.length > 0) {
        dispatch(seedRequests(seeds));
      }
      tried.current = true;
    }, 600);
    return () => clearTimeout(timer);
  }, [bundle, requestCount, dispatch]);
}
