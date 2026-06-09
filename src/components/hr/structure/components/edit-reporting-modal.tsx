"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/src/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { PersonAvatar } from "@/src/components/shared/person-avatar";
import { Label } from "@/src/components/ui/label";
import { Button } from "@/src/components/ui/button";
import { DEPT_OPTIONS } from "../data";
import type { HierarchyNode } from "../types";

interface EditReportingModalProps {
  open: boolean;
  onClose: () => void;
  node: HierarchyNode | null;
  allNodes: HierarchyNode[];
  onSave: (nodeId: string, newManagerId: string | null) => void;
}

export function EditReportingModal({
  open,
  onClose,
  node,
  allNodes,
  onSave,
}: EditReportingModalProps) {
  const [selectedManagerId, setSelectedManagerId] = useState<string>(
    node?.managerId ?? "__none__",
  );

  function handleOpenChange(v: boolean) {
    if (!v) onClose();
  }

  function handleOpen() {
    setSelectedManagerId(node?.managerId ?? "__none__");
  }

  function handleSave() {
    if (!node) return;
    const newManagerId =
      selectedManagerId === "__none__" ? null : selectedManagerId;
    onSave(node.id, newManagerId);
    onClose();
  }

  const depts = DEPT_OPTIONS.filter((d) => d !== "all");

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm" onOpenAutoFocus={handleOpen}>
        <DialogHeader>
          <DialogTitle>Change Reporting Line</DialogTitle>
          <DialogDescription>
            Update who this employee reports to.
          </DialogDescription>
        </DialogHeader>

        {node && (
          <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
            <PersonAvatar
              name={node.name}
              initials={node.initials}
              gender={node.gender}
              className="size-9 shrink-0"
              fallbackClassName="bg-primary/10 text-primary text-xs font-semibold"
            />
            <div>
              <p className="text-sm font-medium text-foreground">{node.name}</p>
              <p className="text-xs text-muted-foreground">{node.jobTitle}</p>
              <p className="text-xs text-muted-foreground">{node.department}</p>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs font-medium">Reports To</Label>
          <Select
            value={selectedManagerId}
            onValueChange={setSelectedManagerId}
          >
            <SelectTrigger className="h-8 text-sm w-full">
              <SelectValue placeholder="Select manager..." />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="__none__" className="text-xs italic">
                  No manager (Top level)
                </SelectItem>
              </SelectGroup>
              <SelectSeparator />
              {depts.map((dept) => {
                const deptNodes = allNodes.filter(
                  (n) => n.department === dept && n.id !== node?.id,
                );
                if (deptNodes.length === 0) return null;
                return (
                  <SelectGroup key={dept}>
                    <SelectLabel className="text-xs">{dept}</SelectLabel>
                    {deptNodes.map((n) => (
                      <SelectItem key={n.id} value={n.id} className="text-xs">
                        {n.name} — {n.jobTitle}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter className="flex-row gap-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button size="sm" className="h-8 text-xs" onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
