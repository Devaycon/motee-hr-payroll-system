import { describe, expect, it } from "vitest";
import {
  BUILTIN_CATEGORY_IDS,
  type ApprovalChainTemplate,
} from "@/src/lib/types/approvals";
import { DEFAULT_APPROVAL_TEMPLATES } from "@/src/lib/permissions/approval-seeds";
import approvalsReducer, {
  createTemplate,
  deleteTemplate,
} from "@/src/lib/stores/approvals-slice";
import {
  APPROVAL_CHAIN_MODULES,
  canSubmitFromPortal,
  moduleForDocumentType,
} from "./config";

const STEPS = [
  { label: "Approve", approver: "LINE_MANAGER" as const, required: true, onLeaveAction: { kind: "skip" as const } },
];

/** The same test the module tabs use to decide whether to appear. */
function hasChainTab(templates: ApprovalChainTemplate[], documentType: string) {
  return templates.some((t) => t.documentType === documentType && t.kind === "custom");
}

describe("submission types per portal", () => {
  it("gives every built-in submission type to exactly one portal", () => {
    for (const id of BUILTIN_CATEGORY_IDS) {
      const inAdmin = canSubmitFromPortal(id, "admin");
      const inSelfService = canSubmitFromPortal(id, "self_service");
      expect(inAdmin !== inSelfService, `${id} must belong to exactly one portal`).toBe(true);
    }
  });

  it("keeps the two portals' lists different", () => {
    const admin = BUILTIN_CATEGORY_IDS.filter((id) => canSubmitFromPortal(id, "admin"));
    const selfService = BUILTIN_CATEGORY_IDS.filter((id) => canSubmitFromPortal(id, "self_service"));
    expect(admin.length).toBeGreaterThan(0);
    expect(selfService.length).toBeGreaterThan(0);
    expect(admin.filter((id) => selfService.includes(id))).toEqual([]);
  });

  it("puts organisation-level work in admin and personal requests in self-service", () => {
    expect(canSubmitFromPortal("workforce_request", "admin")).toBe(true);
    expect(canSubmitFromPortal("contract", "admin")).toBe(true);
    expect(canSubmitFromPortal("leave_request", "self_service")).toBe(true);
    expect(canSubmitFromPortal("expense_claim", "self_service")).toBe(true);
    expect(canSubmitFromPortal("leave_request", "admin")).toBe(false);
    expect(canSubmitFromPortal("workforce_request", "self_service")).toBe(false);
  });

  it("sends an unknown (custom) type to the admin portal only", () => {
    expect(canSubmitFromPortal("CAT-123", "admin")).toBe(true);
    expect(canSubmitFromPortal("CAT-123", "self_service")).toBe(false);
  });
});

describe("approval chain modules", () => {
  it("lists each module once, each backed by a real category and a seeded chain", () => {
    const ids = APPROVAL_CHAIN_MODULES.map((m) => m.documentType);
    expect(new Set(ids).size).toBe(ids.length);
    for (const m of APPROVAL_CHAIN_MODULES) {
      expect(BUILTIN_CATEGORY_IDS as readonly string[]).toContain(m.documentType);
      expect(DEFAULT_APPROVAL_TEMPLATES.some((t) => t.documentType === m.documentType)).toBe(true);
      expect(m.href.startsWith("/")).toBe(true);
      expect(moduleForDocumentType(m.documentType)).toBe(m);
    }
  });
});

describe("creating an approval chain", () => {
  const initial = approvalsReducer(undefined, { type: "@@init" });

  it("starts with no module showing a chain tab — the seeded chains are system chains", () => {
    for (const m of APPROVAL_CHAIN_MODULES) {
      expect(hasChainTab(initial.templates, m.documentType)).toBe(false);
    }
  });

  it("adds the tab for the chosen module only", () => {
    const next = approvalsReducer(
      initial,
      createTemplate({ documentType: "asset_request", name: "Fast track", steps: STEPS, actorName: "Admin" }),
    );
    expect(hasChainTab(next.templates, "asset_request")).toBe(true);
    for (const m of APPROVAL_CHAIN_MODULES.filter((x) => x.documentType !== "asset_request")) {
      expect(hasChainTab(next.templates, m.documentType)).toBe(false);
    }
  });

  it("removes the tab again once the last custom chain is deleted", () => {
    const created = approvalsReducer(
      initial,
      createTemplate({ documentType: "leave_request", name: "Leave fast", steps: STEPS, actorName: "Admin" }),
    );
    const custom = created.templates.find((t) => t.kind === "custom")!;
    const after = approvalsReducer(created, deleteTemplate(custom.id));
    expect(hasChainTab(after.templates, "leave_request")).toBe(false);
  });

  it("makeActive makes the new chain the only active one for its module", () => {
    const next = approvalsReducer(
      initial,
      createTemplate({ documentType: "contract", name: "Contract fast", steps: STEPS, makeActive: true, actorName: "Admin" }),
    );
    const contract = next.templates.filter((t) => t.documentType === "contract");
    expect(contract.filter((t) => t.isDefault)).toHaveLength(1);
    expect(contract.find((t) => t.isDefault)?.name).toBe("Contract fast");
    // Other modules keep their own active chain.
    const leave = next.templates.filter((t) => t.documentType === "leave_request");
    expect(leave.filter((t) => t.isDefault)).toHaveLength(1);
  });

  it("without makeActive the existing active chain is left alone", () => {
    const next = approvalsReducer(
      initial,
      createTemplate({ documentType: "contract", name: "Contract draft", steps: STEPS, actorName: "Admin" }),
    );
    const active = next.templates.filter((t) => t.documentType === "contract" && t.isDefault);
    expect(active).toHaveLength(1);
    expect(active[0].kind).toBe("system");
  });

  it("stores the attachment and signature rules it is given", () => {
    const next = approvalsReducer(
      initial,
      createTemplate({
        documentType: "expense_claim",
        name: "Strict expenses",
        steps: STEPS,
        attachments: { allowed: true, required: true },
        signatures: { submitterSigns: true, reviewerSigns: false, placeOnDocument: false },
        actorName: "Admin",
      }),
    );
    const chain = next.templates.find((t) => t.name === "Strict expenses")!;
    expect(chain.attachments).toEqual({ allowed: true, required: true });
    expect(chain.signatures.submitterSigns).toBe(true);
    expect(chain.kind).toBe("custom");
  });
});
