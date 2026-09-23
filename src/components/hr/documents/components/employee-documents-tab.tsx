"use client";

import { useState } from "react";
import { formatDate } from "@/src/lib/utils/format-date";
import { FileStack, FolderOpen, Eye, Share2, Archive, Trash2, PenLine, FileText } from "lucide-react";
import {
  EmployeePicker,
  type PickedEmployee,
} from "@/src/components/shared/employee-picker";
import { PersonAvatar } from "@/src/components/shared/person-avatar";
import { Card, CardContent } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import type { DocumentCategory, HRDocument } from "../types";

/**
 * §8.2 (Correction 2 feedback) — "Employee Documents — search-first, then
 * categorised." HR searches/selects an employee first, then sees that
 * employee's documents grouped, rather than every employee's documents
 * shown together. Deliberately a lighter list than the folder-tree
 * DocumentGrid (which brings its own breadcrumb/search/filter chrome) —
 * five of those stacked per employee would be far busier than the client's
 * "feels quite busy" complaint this redesign is meant to fix.
 */
const GROUPS: { label: string; categories: DocumentCategory[] }[] = [
  { label: "Personal Documents", categories: ["id_card"] },
  { label: "Right to Work", categories: ["right_to_work"] },
  { label: "Employment Documents", categories: ["contract"] },
  { label: "Qualifications / Certificates", categories: ["certificate"] },
  { label: "Other Documents", categories: ["policy", "report", "other"] },
];

interface EmployeeDocumentsTabProps {
  documents: HRDocument[];
  onView: (doc: HRDocument) => void;
  onShare: (doc: HRDocument) => void;
  onSign: (doc: HRDocument) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}

function DocRow({
  doc,
  onView,
  onShare,
  onSign,
  onArchive,
  onDelete,
}: {
  doc: HRDocument;
  onView: (doc: HRDocument) => void;
  onShare: (doc: HRDocument) => void;
  onSign: (doc: HRDocument) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/60 px-3 py-2 last:border-0">
      <button
        className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
        onClick={() => onView(doc)}
      >
        <FileText className="size-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-foreground">{doc.name}</p>
          <p className="text-[11px] text-muted-foreground">
            Uploaded {formatDate(doc.uploadedAt)}
            {doc.expiryDate && ` · Expires ${formatDate(doc.expiryDate)}`}
          </p>
        </div>
      </button>
      <div className="flex shrink-0 items-center gap-1">
        <Button variant="ghost" size="icon" className="size-7" onClick={() => onView(doc)} title="View">
          <Eye className="size-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="size-7" onClick={() => onShare(doc)} title="Share">
          <Share2 className="size-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="size-7" onClick={() => onSign(doc)} title="Sign">
          <PenLine className="size-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="size-7" onClick={() => onArchive(doc.id)} title="Archive">
          <Archive className="size-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-7 text-destructive hover:text-destructive"
          onClick={() => onDelete(doc.id)}
          title="Delete"
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

export function EmployeeDocumentsTab({
  documents,
  onView,
  onShare,
  onSign,
  onArchive,
  onDelete,
}: EmployeeDocumentsTabProps) {
  const [employee, setEmployee] = useState<PickedEmployee | null>(null);

  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/60 py-20 text-center">
        <FileStack className="size-8 text-muted-foreground/40" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            Search for an employee to see their documents
          </p>
          <p className="text-xs text-muted-foreground">
            Grouped into Personal, Right to Work, Employment, Qualifications and Other.
          </p>
        </div>
        <div className="w-full max-w-sm">
          <EmployeePicker value={undefined} onChange={setEmployee} />
        </div>
      </div>
    );
  }

  const folderId = `emp-${employee.id}`;
  const employeeDocs = documents.filter((d) => d.folderId === folderId && !d.isTrashed);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card/50 p-3">
        <div className="flex items-center gap-3">
          <PersonAvatar name={employee.name} initials={employee.initials} className="size-9" />
          <div>
            <p className="text-sm font-semibold text-foreground">{employee.name}</p>
            <p className="text-xs text-muted-foreground">
              {employee.jobTitle} · {employee.department}
            </p>
          </div>
        </div>
        <div className="w-full max-w-xs">
          <EmployeePicker value={employee.id} onChange={setEmployee} />
        </div>
      </div>

      {employeeDocs.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border/60 py-16 text-center">
          <FolderOpen className="size-6 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No documents on file for {employee.name} yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {GROUPS.map((group) => {
            const docs = employeeDocs.filter((d) => group.categories.includes(d.category));
            if (docs.length === 0) return null;
            return (
              <Card key={group.label}>
                <CardContent className="p-0">
                  <div className="flex items-center gap-2 border-b border-border/60 px-3 py-2.5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {group.label}
                    </p>
                    <Badge variant="secondary" className="text-[10px]">
                      {docs.length}
                    </Badge>
                  </div>
                  {docs.map((doc) => (
                    <DocRow
                      key={doc.id}
                      doc={doc}
                      onView={onView}
                      onShare={onShare}
                      onSign={onSign}
                      onArchive={onArchive}
                      onDelete={onDelete}
                    />
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

