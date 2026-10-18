"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { CalendarDays, Clock, Trash2, User, Users } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Switch } from "@/src/components/ui/switch";
import { Checkbox } from "@/src/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { cn } from "@/src/lib/utils";
import type { LocaleEmployee } from "@/src/lib/types/locale";
import { metaFor, timeLabel, type CalItem } from "./model";
import type { StoredEvent } from "./use-calendar-data";

/** Details for one item, with delete for things the viewer created. */
export function EventDetails({ item, onClose, onDelete }: { item: CalItem | null; onClose: () => void; onDelete: (i: CalItem) => void }) {
  if (!item) return null;
  const meta = metaFor(item.category);
  const multi = item.endDate && item.endDate !== item.date;
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <span className={cn("mt-1.5 h-3 w-3 shrink-0 rounded-sm", meta.swatch)} />
            <div className="min-w-0">
              <DialogTitle className="text-lg leading-snug">{item.title}</DialogTitle>
              <DialogDescription className="text-xs">{meta.label}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="space-y-2.5 pl-6 text-sm">
          <p className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            {format(parseISO(item.date), "EEEE d MMMM yyyy")}
            {multi && ` – ${format(parseISO(item.endDate!), "EEEE d MMMM yyyy")}`}
          </p>
          <p className="flex items-center gap-2"><Clock className="h-4 w-4 text-muted-foreground" />{timeLabel(item)}</p>
          {item.personName && <p className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" />{item.personName}</p>}
          {item.description && <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">{item.description}</p>}
          {item.category === "sickness" && <p className="text-xs text-muted-foreground">Medical details are kept confidential and are not shown in calendars.</p>}
        </div>
        {item.deletable && (
          <div className="flex justify-end border-t border-border pt-3">
            <Button variant="ghost" size="sm" className="gap-1.5 text-destructive" onClick={() => { onDelete(item); onClose(); toast.success("Event deleted"); }}>
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export interface CreateDraft {
  date: string;
  startTime?: string;
}

/**
 * One Create dialog for everything: a company-wide event (HR) or an event on
 * people's own schedules — yours, or your team's.
 */
export function CreateEventDialog({
  draft,
  onClose,
  canCreateCompany,
  companyTypes,
  people,
  me,
  onCreateCompany,
  onCreatePersonal,
}: {
  draft: CreateDraft | null;
  onClose: () => void;
  canCreateCompany: boolean;
  companyTypes: { value: string; label: string }[];
  people: LocaleEmployee[];
  me?: string;
  onCreateCompany: (e: Omit<StoredEvent, "id">) => void;
  onCreatePersonal: (e: Omit<StoredEvent, "id" | "category">[]) => void;
}) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(draft?.date ?? "");
  const [allDay, setAllDay] = useState(false);
  const [start, setStart] = useState(draft?.startTime ?? "09:00");
  const [end, setEnd] = useState("10:00");
  const [description, setDescription] = useState("");
  const [target, setTarget] = useState<"people" | "company">("people");
  const [type, setType] = useState(companyTypes[0]?.value ?? "meeting");
  const [who, setWho] = useState<string[]>(me ? [me] : []);
  const [prev, setPrev] = useState(draft);
  if (prev !== draft) {
    setPrev(draft);
    if (draft) {
      setTitle("");
      setDate(draft.date);
      setStart(draft.startTime ?? "09:00");
      const h = Number((draft.startTime ?? "09:00").slice(0, 2));
      setEnd(`${String(Math.min(23, h + 1)).padStart(2, "0")}:${(draft.startTime ?? "09:00").slice(3)}`);
      setAllDay(false);
      setDescription("");
      setWho(me ? [me] : []);
    }
  }
  if (!draft) return null;

  const timeOk = allDay || !start || !end || end > start;
  const valid = title.trim().length > 1 && date && timeOk && (target === "company" || who.length > 0);

  function save() {
    if (!valid) return;
    const base = {
      title: title.trim(),
      date,
      allDay,
      startTime: allDay ? undefined : start,
      endTime: allDay ? undefined : end,
      description: description.trim() || undefined,
    };
    if (target === "company") {
      onCreateCompany({ ...base, category: type });
      toast.success("Added to the company calendar");
    } else {
      onCreatePersonal(who.map((employeeId) => ({ ...base, employeeId })));
      toast.success(who.length === 1 && who[0] === me ? "Added to your calendar" : `Added for ${who.length} ${who.length === 1 ? "person" : "people"}`);
    }
    onClose();
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">New event</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Add title" className="h-11 border-0 border-b border-border px-0 text-lg shadow-none focus-visible:ring-0" />

          {canCreateCompany && (
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ["people", User, "People's calendars", "You or your team"],
                  ["company", Users, "Company calendar", "Everyone sees it"],
                ] as const
              ).map(([v, Icon, label, hint]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setTarget(v)}
                  className={cn("flex items-start gap-2 rounded-lg border px-3 py-2 text-left transition-colors", target === v ? "border-primary bg-[color-mix(in_oklab,var(--primary)_6%,var(--card))]" : "border-border hover:bg-muted")}
                >
                  <Icon className="mt-0.5 h-4 w-4 text-primary" />
                  <span>
                    <span className="block text-sm font-medium">{label}</span>
                    <span className="block text-[11px] text-muted-foreground">{hint}</span>
                  </span>
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-[1fr_auto] items-end gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-9" />
            </div>
            <label className="flex h-9 items-center gap-2 text-xs">
              <Switch checked={allDay} onCheckedChange={setAllDay} /> All day
            </label>
          </div>
          {!allDay && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs">Starts</Label><Input type="time" value={start} onChange={(e) => setStart(e.target.value)} className="h-9" /></div>
              <div className="space-y-1.5"><Label className="text-xs">Ends</Label><Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className="h-9" /></div>
              {!timeOk && <p className="col-span-2 text-xs text-destructive">The end time must be after the start time.</p>}
            </div>
          )}

          {target === "company" ? (
            <div className="space-y-1.5">
              <Label className="text-xs">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="h-9 w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {companyTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      <span className="flex items-center gap-2"><span className={cn("h-2.5 w-2.5 rounded-sm", metaFor(t.value).swatch)} />{t.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            people.length > 1 && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Add to</Label>
                  <button type="button" className="text-[11px] font-medium text-primary hover:underline" onClick={() => setWho(who.length === people.length ? (me ? [me] : []) : people.map((p) => p.id))}>
                    {who.length === people.length ? "Just me" : "Everyone in view"}
                  </button>
                </div>
                <div className="max-h-36 space-y-1 overflow-y-auto rounded-md border border-border p-2">
                  {people.map((p) => (
                    <label key={p.id} className="flex cursor-pointer items-center gap-2 text-xs">
                      <Checkbox checked={who.includes(p.id)} onCheckedChange={(c) => setWho((x) => (c ? [...x, p.id] : x.filter((y) => y !== p.id)))} className="h-3.5 w-3.5" />
                      {p.fullName}{p.id === me ? " (you)" : ""}
                    </label>
                  ))}
                </div>
              </div>
            )
          )}

          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Add description" className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm" />
        </div>
        <div className="flex justify-end gap-2 border-t border-border pt-3">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" disabled={!valid} onClick={save}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
