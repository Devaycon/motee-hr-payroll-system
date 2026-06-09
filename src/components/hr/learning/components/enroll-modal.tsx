"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Clock, Monitor, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Checkbox } from "@/src/components/ui/checkbox";
import { ScrollArea } from "@/src/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Separator } from "@/src/components/ui/separator";
import {
  COURSE_CATEGORY_LABELS,
  DELIVERY_MODE_LABELS,
} from "../data";
import type { Course } from "../types";

export interface AssignTrainee {
  employeeName: string;
  employeeInitials: string;
  employeeDept: string;
}

interface EnrollModalProps {
  open: boolean;
  onClose: () => void;
  courses: Course[];
  employees: { id: string; fullName: string; initials: string; departmentName: string }[];
  onAssign: (input: { courseId: string; dueDate: string; trainees: AssignTrainee[] }) => void;
}

export function EnrollModal({
  open,
  onClose,
  courses,
  employees,
  onAssign,
}: EnrollModalProps) {
  const [prevOpen, setPrevOpen] = useState(open);
  const [courseId, setCourseId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  if (prevOpen !== open) {
    setPrevOpen(open);
    if (open) {
      setCourseId("");
      setDueDate("");
      setSelected(new Set());
      setSearch("");
    }
  }

  const activeCourses = courses.filter((c) => c.status === "active");
  const selectedCourse = activeCourses.find((c) => c.id === courseId);

  const filteredEmployees = useMemo(() => {
    const q = search.toLowerCase();
    return employees.filter(
      (e) =>
        !q ||
        e.fullName.toLowerCase().includes(q) ||
        e.departmentName.toLowerCase().includes(q),
    );
  }, [employees, search]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleAssign() {
    if (!courseId) {
      toast.error("Select a course.");
      return;
    }
    if (selected.size === 0) {
      toast.error("Select at least one trainee.");
      return;
    }
    const trainees: AssignTrainee[] = employees
      .filter((e) => selected.has(e.id))
      .map((e) => ({
        employeeName: e.fullName,
        employeeInitials: e.initials,
        employeeDept: e.departmentName,
      }));
    onAssign({ courseId, dueDate, trainees });
    toast.success(
      `Assigned to ${trainees.length} trainee${trainees.length === 1 ? "" : "s"} · notification sent`,
    );
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">Assign Training</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">
                Course <span className="text-destructive">*</span>
              </Label>
              <Select value={courseId} onValueChange={setCourseId}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {activeCourses.length === 0 ? (
                    <div className="px-2 py-3 text-xs text-muted-foreground text-center">
                      No active courses
                    </div>
                  ) : (
                    activeCourses.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-xs">
                        {c.title}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Due date</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs">
                Trainees <span className="text-destructive">*</span>
              </Label>
              <span className="text-[10px] text-muted-foreground">
                {selected.size} selected
              </span>
            </div>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Search employees…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 text-xs pl-7"
              />
            </div>
            <ScrollArea className="h-48 rounded-md border border-border/60">
              <div className="p-1">
                {filteredEmployees.length === 0 ? (
                  <p className="px-2 py-4 text-center text-xs text-muted-foreground">
                    No employees found.
                  </p>
                ) : (
                  filteredEmployees.map((e) => (
                    <label
                      key={e.id}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 cursor-pointer"
                    >
                      <Checkbox
                        checked={selected.has(e.id)}
                        onCheckedChange={() => toggle(e.id)}
                      />
                      <span className="text-xs text-foreground flex-1">{e.fullName}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {e.departmentName}
                      </span>
                    </label>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {selectedCourse && (
            <>
              <Separator />
              <div className="p-3 rounded-lg bg-muted/40 space-y-2">
                <p className="text-xs font-medium">{selectedCourse.title}</p>
                <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full font-medium">
                    {COURSE_CATEGORY_LABELS[selectedCourse.category]}
                  </span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {selectedCourse.durationHours}h
                  </div>
                  <div className="flex items-center gap-1">
                    <Monitor className="w-3 h-3" />
                    {DELIVERY_MODE_LABELS[selectedCourse.deliveryMode]}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" className="text-xs" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" className="text-xs" onClick={handleAssign}>
            Assign Training
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
