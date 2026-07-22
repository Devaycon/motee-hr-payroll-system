"use client";

import * as React from "react";
import { toast } from "sonner";
import { MoreHorizontal, Download, Mail, Trash2, Pencil } from "lucide-react";
import { Tabs, TabsContent } from "@/src/components/ui/tabs";
import { OverflowTabsList } from "@/src/components/shared/overflow-tabs";
import { Button } from "@/src/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { useAppDispatch } from "@/src/lib/stores/hooks";
import { removeRecord } from "@/src/lib/stores/collection-edits-slice";
import { ContactReferenceModal } from "./contact-reference-modal";
import {
  Section,
  StatStrip,
  Empty,
  LoadingPanel,
  StatusBadge,
  Pill,
  DataTable,
  Row,
  Cell,
  fmtDate,
  titleCase,
  daysUntil,
} from "./ui";
import { useEmployeeDocuments, type RawDocument } from "./hooks";
import type { ModuleProps } from "./modules";
import { useCan } from "@/src/lib/permissions/use-can";
import { COLLECTION_SCHEMAS } from "@/src/lib/profile/collections";
import {
  useRecordForm,
  AddButton,
} from "@/src/components/shared/profile-fields/record-form";
import { ProfileFieldsEditor } from "@/src/components/shared/profile-fields";

// Identifier-key → friendly label (NG + UK).
const ID_LABELS: Record<string, string> = {
  nin: "National ID (NIN)",
  bvn: "Bank Verification Number (BVN)",
  tin: "Tax Identification (TIN)",
  pensionId: "Pension ID (PFA)",
  nhfNumber: "National Housing Fund (NHF)",
  passport: "International Passport",
  driversLicense: "Driver's Licence",
  drivingLicense: "Driving Licence",
  drivingLicence: "Driving Licence",
  nationalInsuranceNumber: "National Insurance No.",
  nationalInsurance: "National Insurance No.",
  ni: "National Insurance No.",
  nino: "National Insurance No.",
  utr: "Unique Taxpayer Ref (UTR)",
  taxCode: "Tax Code",
};

const DOC_CATEGORY_LABELS: Record<string, string> = {
  identity: "Identity",
  right_to_work: "Right to Work",
  proof_of_address: "Proof of Address",
  tax: "Tax",
  banking: "Banking",
  pension: "Pension",
  education: "Education",
  employment: "Employment",
  medical: "Medical",
  reference: "References",
  photo: "Photo",
  dbs: "DBS / Background",
};
const DOC_CATEGORY_ORDER = [
  "identity",
  "right_to_work",
  "proof_of_address",
  "photo",
  "banking",
  "tax",
  "pension",
  "education",
  "employment",
  "dbs",
  "medical",
  "reference",
];
const docTitle = (name: string) =>
  name.includes("—") ? name.split("—").pop()!.trim() : name;

export function EmployeeDocumentsModule({ employeeId, employee }: ModuleProps) {
  const { data, loading } = useEmployeeDocuments(employeeId);
  const canEdit = useCan("organization.employees", "edit");
  const rf = useRecordForm(COLLECTION_SCHEMAS.documents, employeeId);
  const dispatch = useAppDispatch();
  const ids = Object.entries(employee.identifiers ?? {}).filter(([, v]) => v);
  const [tab, setTab] = React.useState("id-numbers");
  const [contactDoc, setContactDoc] = React.useState<RawDocument | null>(null);

  function handleDownload(d: RawDocument) {
    const url = d.fileUrl;
    if (!url || url === "#") {
      toast.info("File not available in this demo.");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function handleDelete(d: RawDocument) {
    dispatch(removeRecord({ key: "documents", id: d.id }));
    toast.success("Document removed");
  }

  if (loading && !data) return <LoadingPanel />;
  const docs = data ?? [];

  const kyc = docs.filter((d) => d.kyc);
  const verified = docs.filter((d) => d.status === "verified").length;
  const pending = docs.filter((d) => d.status === "pending").length;
  const expiringSoon = docs.filter((d) => {
    const n = daysUntil(d.expiresAt);
    return n != null && n >= 0 && n <= 60;
  }).length;
  const expired = docs.filter((d) => {
    const n = daysUntil(d.expiresAt);
    return n != null && n < 0;
  }).length;

  const groups = new Map<string, typeof docs>();
  for (const d of docs) {
    const arr = groups.get(d.category) ?? [];
    arr.push(d);
    groups.set(d.category, arr);
  }
  const orderedCats = [
    ...DOC_CATEGORY_ORDER.filter((c) => groups.has(c)),
    ...[...groups.keys()].filter((c) => !DOC_CATEGORY_ORDER.includes(c)),
  ];

  return (
    <Section
      title="Employee Documents"
      description="Manage employee identification, compliance and employment documents."
      action={canEdit ? <AddButton label="Add document" onClick={rf.openCreate} /> : undefined}
    >
      {rf.node}
      <StatStrip
        items={[
          { label: "ID numbers", value: ids.length },
          { label: "Documents", value: docs.length },
          { label: "KYC docs", value: kyc.length },
          { label: "Verified", value: verified, accent: "text-emerald-600" },
          { label: "Pending", value: pending, accent: pending ? "text-amber-600" : undefined },
          { label: "Expiring ≤60d", value: expiringSoon, accent: expiringSoon ? "text-amber-600" : undefined },
          { label: "Expired", value: expired, accent: expired ? "text-rose-600" : undefined },
        ]}
      />

      <Tabs value={tab} onValueChange={setTab}>
        <OverflowTabsList
          value={tab}
          onValueChange={setTab}
          tabs={[
            { value: "id-numbers", label: "ID Numbers" },
            ...orderedCats.map((cat) => ({
              value: cat,
              label: DOC_CATEGORY_LABELS[cat] ?? titleCase(cat),
            })),
          ]}
        />

        {/* ID numbers (from employee.identifiers) — editable */}
        <TabsContent value="id-numbers" className="mt-4">
          {canEdit ? (
            <ProfileFieldsEditor
              employee={employee}
              employeeId={employeeId}
              mode="edit"
              groups={["identity"]}
            />
          ) : ids.length === 0 ? (
            <Empty label="No identity numbers on file." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
              {ids.map(([k, v]) => (
                <div
                  key={k}
                  className="flex items-center gap-3 py-2.5 border-b border-border/50"
                >
                  <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-[9px] font-bold text-primary uppercase">ID</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground">
                      {ID_LABELS[k] ?? titleCase(k)}
                    </p>
                    <p className="text-[11px] text-muted-foreground font-mono">{v}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* One tab per document category */}
        {orderedCats.map((cat) => (
          <TabsContent key={cat} value={cat} className="mt-4">
            <DataTable columns={["Document", "KYC", "Issuer", "Uploaded", "Expires", "Status", ""]}>
              {groups.get(cat)!.map((d) => {
                const n = daysUntil(d.expiresAt);
                const due = n != null && n >= 0 && n <= 60;
                return (
                  <Row key={d.id}>
                    <Cell>{docTitle(d.name)}</Cell>
                    <Cell>
                      {d.kyc ? (
                        <Pill className="border-primary/30 bg-primary/10 text-primary">KYC</Pill>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </Cell>
                    <Cell>{d.issuer ?? "—"}</Cell>
                    <Cell>{fmtDate(d.uploadedAt)}</Cell>
                    <Cell>
                      {fmtDate(d.expiresAt)}
                      {due && (
                        <Pill className="ml-1 border-rose-500/30 bg-rose-500/10 text-rose-600">
                          {n}d
                        </Pill>
                      )}
                    </Cell>
                    <Cell><StatusBadge status={d.status} /></Cell>
                    <Cell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => handleDownload(d)}>
                            <Download className="h-3.5 w-3.5" /> Download
                          </DropdownMenuItem>
                          {d.category === "reference" && (
                            <DropdownMenuItem onClick={() => setContactDoc(d)}>
                              <Mail className="h-3.5 w-3.5" /> Contact reference
                            </DropdownMenuItem>
                          )}
                          {canEdit && (
                            <>
                              <DropdownMenuItem onClick={() => rf.openEdit(d)}>
                                <Pencil className="h-3.5 w-3.5" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => handleDelete(d)}
                              >
                                <Trash2 className="h-3.5 w-3.5" /> Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </Cell>
                  </Row>
                );
              })}
            </DataTable>
          </TabsContent>
        ))}
      </Tabs>

      <ContactReferenceModal
        open={contactDoc !== null}
        onClose={() => setContactDoc(null)}
        employeeName={employee.fullName}
        referenceName={contactDoc?.issuer ?? undefined}
      />
    </Section>
  );
}
