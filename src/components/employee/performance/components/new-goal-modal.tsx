"use client";

import { useState } from "react";
import { Target } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { GOAL_CATEGORY_LABELS } from "@/src/data/performance-demo";
import type { GoalCategory } from "@/src/lib/types/performance";
import { CATEGORY_OPTIONS } from "./data";

interface NewGoalModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (data: {
    title: string;
    desc: string;
    category: GoalCategory;
    dueDate: string;
  }) => void;
}

export function NewGoalModal({ open, onClose, onAdd }: NewGoalModalProps) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [cat, setCat] = useState<GoalCategory | "">("");
  const [due, setDue] = useState("");

  function handleAdd() {
    if (!title || !cat || !due) return;
    onAdd({ title, desc, category: cat as GoalCategory, dueDate: due });
    setTitle("");
    setDesc("");
    setCat("");
    setDue("");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-[#4361ee]/10 flex items-center justify-center">
              <Target className="w-4 h-4 text-[#4361ee]" />
            </div>
            <DialogTitle className="text-sm font-semibold">
              Add New Goal
            </DialogTitle>
          </div>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-medium">Goal title</p>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Complete AWS certification"
              className="h-8 text-xs"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-medium">
              Description{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </p>
            <Textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Describe what success looks like…"
              className="text-xs min-h-16 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-medium">Category</p>
              <Select
                value={cat}
                onValueChange={(v) => setCat(v as GoalCategory)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((c) => (
                    <SelectItem key={c} value={c} className="text-xs">
                      {GOAL_CATEGORY_LABELS[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-medium">Target date</p>
              <Input
                type="date"
                value={due}
                onChange={(e) => setDue(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            className="text-xs h-8 bg-[#4361ee] hover:bg-[#3451d1] text-white"
            onClick={handleAdd}
            disabled={!title || !cat || !due}
          >
            Add Goal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

