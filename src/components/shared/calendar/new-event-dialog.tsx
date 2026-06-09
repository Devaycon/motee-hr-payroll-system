"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import type { CalEvent, EventTypeOption } from "./types";

type NewEventData = Omit<CalEvent, "id">;

interface NewEventDialogProps {
  selectedDay: Date | undefined;
  onConfirm: (event: NewEventData) => void;
  typeOptions: EventTypeOption[];
  defaultType: string;
}

export function NewEventDialog({
  selectedDay,
  onConfirm,
  typeOptions,
  defaultType,
}: NewEventDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<string>(defaultType);
  const [description, setDescription] = useState("");

  function handleCreate() {
    if (!title.trim() || !selectedDay) return;
    onConfirm({
      title: title.trim(),
      date: format(selectedDay, "yyyy-MM-dd"),
      type,
      description: description.trim() || undefined,
    });
    setTitle("");
    setType(defaultType);
    setDescription("");
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-9 text-sm gap-1.5">
          <Plus className="w-3.5 h-3.5" /> New Event
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            Create Event
            {selectedDay ? ` — ${format(selectedDay, "MMMM d, yyyy")}` : ""}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">Event title</label>
            <Input
              placeholder="e.g. Team standup"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">Type</label>
            <Select value={type} onValueChange={(v) => setType(v)}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {typeOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-muted-foreground">
              Description (optional)
            </label>
            <Input
              placeholder="Add a note..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Event will be created on:{" "}
            <strong>
              {selectedDay
                ? format(selectedDay, "MMMM d, yyyy")
                : "No date selected"}
            </strong>
          </p>
        </div>
        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="outline" size="sm" className="h-7 text-xs">
              Cancel
            </Button>
          </DialogClose>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleCreate}
            disabled={!title.trim() || !selectedDay}
          >
            Create Event
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
