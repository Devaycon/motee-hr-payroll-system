"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";

export interface NewPersonalTask {
  label: string;
  priority: string;
  due: string;
  category: string;
  notes?: string;
}

interface AddTaskFormProps {
  onAdd: (task: NewPersonalTask) => void;
}

export function AddTaskForm({ onAdd }: AddTaskFormProps) {
  const [label, setLabel] = useState("");
  const [priority, setPriority] = useState("medium");
  const [due, setDue] = useState("");
  const [category, setCategory] = useState("Personal");
  const [notes, setNotes] = useState("");

  function handleAdd() {
    if (!label.trim() || !due) return;
    onAdd({
      label: label.trim(),
      priority,
      due,
      category,
      notes: notes.trim() || undefined,
    });
    setLabel("");
    setPriority("medium");
    setDue("");
    setCategory("Personal");
    setNotes("");
  }

  return (
    <Card>
      <CardHeader className="px-5 pt-4 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" /> New Task
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5 space-y-3">
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Description</label>
          <Input
            placeholder="What needs to be done?"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Notes</label>
          <Input
            placeholder="Optional notes…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Priority</label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Category</label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["Training", "Performance", "HR", "Personal"].map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs text-muted-foreground">Due Date</label>
          <Input
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            className="text-sm"
          />
        </div>
        <Button
          className="w-full bg-[#4361ee] hover:bg-[#3451d1] text-white"
          onClick={handleAdd}
          disabled={!label.trim() || !due}
        >
          Add Task
        </Button>
      </CardContent>
    </Card>
  );
}
