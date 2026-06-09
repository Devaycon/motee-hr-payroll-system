"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { z } from "zod";
import { CheckCircle2, Circle, Search, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { PersonAvatar } from "@/src/components/shared/person-avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { cn } from "@/src/lib/utils";
import { useEmployees } from "@/src/components/hr/employees/hooks";
import {
  EXIT_REASON_LABELS,
  OFFBOARDING_STATUS_LABELS,
  OFFBOARDING_STATUS_STYLES,
  EXIT_REASON_STYLES,
} from "../data";
import type {
  OffboardingRecord,
  NewOffboardingRecord,
  ExitReason,
  ClearanceItem,
} from "../types";
import type { EmployeeRow } from "@/src/lib/types/employees";

const formSchema = z.object({
  employeeName: z.string().min(2, "Select an employee"),
  employeeInitials: z.string().min(1),
  department: z.string().min(1),
  jobTitle: z.string().min(1),
  lastWorkingDate: z.string().min(1, "Last working date is required"),
  exitReason: z.enum(
    [
      "resignation",
      "termination",
      "retirement",
      "contract_end",
      "redundancy",
      "other",
    ],
    { message: "Exit reason is required" },
  ),
  exitInterviewNotes: z.string(),
});

type FormFields = z.infer<typeof formSchema>;
type TouchedFields = Partial<Record<keyof FormFields, boolean>>;

const EMPTY: FormFields = {
  employeeName: "",
  employeeInitials: "",
  department: "",
  jobTitle: "",
  lastWorkingDate: "",
  exitReason: "resignation",
  exitInterviewNotes: "",
};

interface OffboardingModalProps {
  open: boolean;
  onClose: () => void;
  viewingRecord: OffboardingRecord | null;
  onSave: (data: NewOffboardingRecord) => void;
  onToggleClearance: (recordId: string, itemId: string) => void;
  onUpdateExitInterview: (
    recordId: string,
    notes: string,
    completed: boolean,
  ) => void;
}

export function OffboardingModal({
  open,
  onClose,
  viewingRecord,
  onSave,
  onToggleClearance,
  onUpdateExitInterview,
}: OffboardingModalProps) {
  const { data: employees } = useEmployees();
  const allEmployees = useMemo(() => employees ?? [], [employees]);

  const [fields, setFields] = useState<FormFields>(EMPTY);
  const [touched, setTouched] = useState<TouchedFields>({});
  const [interviewNotes, setInterviewNotes] = useState("");
  const [interviewCompleted, setInterviewCompleted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeRow | null>(
    null,
  );
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      if (viewingRecord) {
        setInterviewNotes(viewingRecord.exitInterviewNotes ?? "");
        setInterviewCompleted(viewingRecord.exitInterviewCompleted);
      } else {
        setFields(EMPTY);
        setTouched({});
        setSearchQuery("");
        setSelectedEmployee(null);
        setDropdownOpen(false);
      }
    }
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const searchResults =
    searchQuery.trim().length > 0
      ? allEmployees.filter(
          (e) =>
            e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.department.toLowerCase().includes(searchQuery.toLowerCase()),
        ).slice(0, 6)
      : [];

  function selectEmployee(emp: EmployeeRow) {
    setSelectedEmployee(emp);
    setFields((p) => ({
      ...p,
      employeeName: emp.name,
      employeeInitials: emp.initials,
      department: emp.department,
      jobTitle: emp.jobTitle,
    }));
    setSearchQuery(emp.name);
    setDropdownOpen(false);
  }

  function clearEmployee() {
    setSelectedEmployee(null);
    setSearchQuery("");
    setFields((p) => ({
      ...p,
      employeeName: "",
      employeeInitials: "",
      department: "",
      jobTitle: "",
    }));
  }

  const result = formSchema.safeParse(fields);

  const fieldError = (key: keyof FormFields) => {
    if (!touched[key] || result.success) return null;
    const issue = result.error.issues.find((i) => i.path[0] === key);
    return issue?.message ?? null;
  };

  const touch = (key: keyof FormFields) =>
    setTouched((p) => ({ ...p, [key]: true }));

  const set = <K extends keyof FormFields>(key: K, value: FormFields[K]) =>
    setFields((p) => ({ ...p, [key]: value }));

  const handleSave = () => {
    const allTouched = Object.fromEntries(
      Object.keys(EMPTY).map((k) => [k, true]),
    ) as TouchedFields;
    setTouched(allTouched);
    if (!result.success) return;
    onSave({ ...result.data });
  };

  const handleSaveExitInterview = () => {
    if (!viewingRecord) return;
    onUpdateExitInterview(viewingRecord.id, interviewNotes, interviewCompleted);
  };

  const isViewing = !!viewingRecord;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg p-0 gap-0 flex flex-col max-h-[90vh] overflowy-scroll">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <DialogTitle className="text-base font-semibold">
            {isViewing
              ? `${viewingRecord.employeeName} — Offboarding`
              : "Initiate Offboarding"}
          </DialogTitle>
          {isViewing && (
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span
                className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                  EXIT_REASON_STYLES[viewingRecord.exitReason],
                )}
              >
                {EXIT_REASON_LABELS[viewingRecord.exitReason]}
              </span>
              <span
                className={cn(
                  "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                  OFFBOARDING_STATUS_STYLES[viewingRecord.status],
                )}
              >
                {OFFBOARDING_STATUS_LABELS[viewingRecord.status]}
              </span>
              <span className="text-xs text-muted-foreground ml-auto">
                Last day: {viewingRecord.lastWorkingDate}
              </span>
            </div>
          )}
        </DialogHeader>

        {isViewing ? (
          <Tabs
            defaultValue="clearance"
            className="flex flex-col min-h-0 flex-1"
          >
            <div className="px-6 pt-4 shrink-0">
              <TabsList className="w-full">
                <TabsTrigger value="clearance" className="flex-1 text-xs">
                  Clearance Checklist
                </TabsTrigger>
                <TabsTrigger value="interview" className="flex-1 text-xs">
                  Exit Interview
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent
              value="clearance"
              className="mt-0 flex flex-col min-h-0 flex-1"
            >
              <ScrollArea className="flex-1 min-h-0 max-h-[50vh]">
                <div className="px-6 py-4 flex flex-col gap-2">
                  <p className="text-xs text-muted-foreground mb-1">
                    All items must be confirmed before offboarding can be marked
                    complete.
                  </p>
                  {viewingRecord.clearanceItems.map((item: ClearanceItem) => (
                    <button
                      key={item.id}
                      type="button"
                      className="flex items-center gap-3 py-2.5 border-b border-border last:border-0 w-full text-left"
                      onClick={() =>
                        onToggleClearance(viewingRecord.id, item.id)
                      }
                    >
                      {item.completed ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Circle className="w-4 h-4 shrink-0 text-muted-foreground" />
                      )}
                      <span
                        className={cn(
                          "text-sm",
                          item.completed
                            ? "line-through text-muted-foreground"
                            : "text-foreground",
                        )}
                      >
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>
              </ScrollArea>
              <div className="px-6 py-4 border-t border-border shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={onClose}
                >
                  Close
                </Button>
              </div>
            </TabsContent>

            <TabsContent
              value="interview"
              className="mt-0 flex flex-col min-h-0 flex-1"
            >
              <ScrollArea className="flex-1 min-h-0 max-h-[50vh]">
                <div className="px-6 py-4 flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-medium">
                      Interview Notes
                    </Label>
                    <Textarea
                      placeholder="Record the employee's feedback and key points from the exit interview..."
                      value={interviewNotes}
                      onChange={(e) => setInterviewNotes(e.target.value)}
                      rows={6}
                      className="text-sm resize-none"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setInterviewCompleted((p) => !p)}
                      className="shrink-0"
                    >
                      {interviewCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Circle className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>
                    <span className="text-sm text-foreground">
                      Mark exit interview as completed
                    </span>
                  </div>
                </div>
              </ScrollArea>
              <div className="px-6 py-4 border-t border-border flex justify-between gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={onClose}
                >
                  Close
                </Button>
                <Button
                  size="sm"
                  className="h-8 text-xs"
                  onClick={handleSaveExitInterview}
                >
                  Save Interview
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <>
            <ScrollArea className="flex-1 min-h-0">
              <div className="px-6 py-5 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5" ref={searchRef}>
                  <Label className="text-xs font-medium">
                    Search Employee <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                    <Input
                      placeholder="Search by name, job title or department..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setDropdownOpen(true);
                        if (!e.target.value) clearEmployee();
                      }}
                      onFocus={() => setDropdownOpen(true)}
                      className="h-9 text-sm pl-8 pr-8"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        onClick={clearEmployee}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  {dropdownOpen && searchResults.length > 0 && (
                    <div className="border border-border rounded-md overflow-y-auto max-h-48 bg-popover shadow-sm">
                      {searchResults.map((emp) => (
                        <button
                          key={emp.id}
                          type="button"
                          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted text-left transition-colors border-b border-border last:border-0"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            selectEmployee(emp);
                          }}
                        >
                          <PersonAvatar
                            name={emp.name}
                            initials={emp.initials}
                            gender={emp.gender}
                            className="w-7 h-7 shrink-0"
                            fallbackClassName="text-xs bg-primary/10 text-primary"
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium text-foreground truncate">
                              {emp.name}
                            </span>
                            <span className="text-xs text-muted-foreground truncate">
                              {emp.jobTitle} · {emp.department}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {dropdownOpen &&
                    searchQuery.trim().length > 0 &&
                    searchResults.length === 0 && (
                      <div className="border border-border rounded-md bg-popover px-3 py-3">
                        <p className="text-xs text-muted-foreground">
                          No employees found
                        </p>
                      </div>
                    )}
                  {touched.employeeName && !selectedEmployee && (
                    <p className="text-xs text-destructive">
                      Please select an employee
                    </p>
                  )}
                </div>

                {selectedEmployee && (
                  <div className="rounded-lg border border-border bg-muted/40 p-3 flex items-start gap-3">
                    <PersonAvatar
                      name={selectedEmployee.name}
                      initials={selectedEmployee.initials}
                      gender={selectedEmployee.gender}
                      className="w-10 h-10 shrink-0"
                      fallbackClassName="text-sm font-semibold bg-primary/10 text-primary"
                    />
                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        {selectedEmployee.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {selectedEmployee.jobTitle} ·{" "}
                        {selectedEmployee.department}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {selectedEmployee.email}
                      </p>
                      <div className="flex gap-3 mt-1">
                        <span className="text-xs text-muted-foreground">
                          📞 {selectedEmployee.phone}
                        </span>
                        <span className="text-xs text-muted-foreground capitalize">
                          🏢 {selectedEmployee.workMode}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-medium">
                      Last Working Date{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="date"
                      value={fields.lastWorkingDate}
                      onChange={(e) => set("lastWorkingDate", e.target.value)}
                      onBlur={() => touch("lastWorkingDate")}
                      className="h-8 text-sm"
                    />
                    {fieldError("lastWorkingDate") && (
                      <p className="text-xs text-destructive">
                        {fieldError("lastWorkingDate")}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-medium">Exit Reason</Label>
                    <Select
                      value={fields.exitReason}
                      onValueChange={(v) => {
                        set("exitReason", v as ExitReason);
                        touch("exitReason");
                      }}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(EXIT_REASON_LABELS) as ExitReason[]).map(
                          (k) => (
                            <SelectItem key={k} value={k} className="text-sm">
                              {EXIT_REASON_LABELS[k]}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </ScrollArea>

            <DialogFooter className="px-6 py-4 border-t border-border gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button size="sm" className="h-8 text-xs" onClick={handleSave}>
                Initiate Offboarding
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
