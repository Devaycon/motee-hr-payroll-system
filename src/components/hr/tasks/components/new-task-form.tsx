"use client";

import type { Dispatch, SetStateAction } from "react";
import { Plus } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
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
import { Separator } from "@/src/components/ui/separator";
import type { Priority } from "../types";

interface NewTaskFormProps {
  newLabel: string;
  setNewLabel: Dispatch<SetStateAction<string>>;
  newDescription: string;
  setNewDescription: Dispatch<SetStateAction<string>>;
  newPriority: Priority;
  setNewPriority: Dispatch<SetStateAction<Priority>>;
  newDue: string;
  setNewDue: Dispatch<SetStateAction<string>>;
  onAdd: () => void;
}

export function NewTaskForm({
  newLabel,
  setNewLabel,
  newDescription,
  setNewDescription,
  newPriority,
  setNewPriority,
  newDue,
  setNewDue,
  onAdd,
}: NewTaskFormProps) {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="px-5">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          Add a Task
        </CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="px-5 pb-5 pt-4 flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">
            Task description
          </label>
          <Input
            placeholder="e.g. Review payroll for April..."
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            className="h-8 text-sm"
            onKeyDown={(e) => e.key === "Enter" && onAdd()}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">
            Additional notes
          </label>
          <Textarea
            placeholder="Add more context or details about this task..."
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            className="text-sm min-h-18 resize-none"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">Priority</label>
          <Select
            value={newPriority}
            onValueChange={(v) => setNewPriority(v as Priority)}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">Due date</label>
          <Input
            type="date"
            value={newDue}
            onChange={(e) => setNewDue(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <Button size="sm" className="w-full mt-1 h-8 text-xs" onClick={onAdd}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Add Task
        </Button>
      </CardContent>
    </Card>
  );
}
