"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { z } from "zod/v4";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Textarea } from "@/src/components/ui/textarea";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { POST_TYPE_OPTIONS } from "../data";
import type { CelebrationKind, NewPost, PostType } from "../types";

const postSchema = z.object({
  type: z.enum(["update", "shoutout", "event", "poll", "milestone"], {
    message: "Select a post type",
  }),
  content: z
    .string({ message: "Content is required" })
    .min(10, { message: "Content must be at least 10 characters" })
    .max(2000, { message: "Content cannot exceed 2000 characters" }),
  eventDate: z.string().optional(),
  eventLocation: z.string().optional(),
  pollQuestion: z.string().optional(),
  pollOptions: z.array(z.string()).optional(),
  celebrationKind: z.string().optional(),
  celebrationPerson: z.string().optional(),
  celebrationDetail: z.string().optional(),
});

interface PostFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (post: NewPost) => void;
}

export function PostFormModal({
  open,
  onOpenChange,
  onSubmit,
}: PostFormModalProps) {
  const [prevOpen, setPrevOpen] = useState(false);
  const [type, setType] = useState<PostType>("update");
  const [content, setContent] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventLocation, setEventLocation] = useState("");
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [celebrationKind, setCelebrationKind] = useState("");
  const [celebrationPerson, setCelebrationPerson] = useState("");
  const [celebrationDetail, setCelebrationDetail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setType("update");
      setContent("");
      setEventDate("");
      setEventLocation("");
      setPollQuestion("");
      setPollOptions(["", ""]);
      setCelebrationKind("");
      setCelebrationPerson("");
      setCelebrationDetail("");
      setErrors({});
    }
  }

  const addPollOption = () => {
    if (pollOptions.length < 6) {
      setPollOptions([...pollOptions, ""]);
    }
  };

  const removePollOption = (idx: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== idx));
    }
  };

  const updatePollOption = (idx: number, val: string) => {
    const next = [...pollOptions];
    next[idx] = val;
    setPollOptions(next);
  };

  const handleSubmit = () => {
    const payload: Record<string, unknown> = {
      type,
      content,
    };

    if (type === "event") {
      payload.eventDate = eventDate;
      payload.eventLocation = eventLocation;
    }
    if (type === "poll") {
      payload.pollQuestion = pollQuestion;
      payload.pollOptions = pollOptions.filter((o) => o.trim() !== "");
    }
    if (type === "milestone") {
      payload.celebrationKind = celebrationKind;
      payload.celebrationPerson = celebrationPerson;
      payload.celebrationDetail = celebrationDetail;
    }

    const result = postSchema.safeParse(payload);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as string;
        fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    const validPollOptions =
      type === "poll" ? pollOptions.filter((o) => o.trim() !== "") : undefined;

    if (type === "poll" && (!validPollOptions || validPollOptions.length < 2)) {
      setErrors({ pollOptions: "Add at least 2 poll options" });
      return;
    }

    onSubmit({
      type,
      content,
      eventDate: type === "event" ? eventDate : undefined,
      eventLocation: type === "event" ? eventLocation : undefined,
      pollQuestion: type === "poll" ? pollQuestion : undefined,
      pollOptions: type === "poll" ? validPollOptions : undefined,
      celebrationKind:
        type === "milestone"
          ? (celebrationKind as CelebrationKind) || undefined
          : undefined,
      celebrationPerson: type === "milestone" ? celebrationPerson : undefined,
      celebrationDetail: type === "milestone" ? celebrationDetail : undefined,
    });

    toast.success("Post created successfully");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0 flex flex-col max-h-[90vh]">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border pr-14">
          <DialogTitle>New Post</DialogTitle>
        </DialogHeader>

        <div
          id="post-form"
          className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-4"
        >
          <div className="space-y-1.5">
            <Label>Post Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as PostType)}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {POST_TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.type && (
              <p className="text-xs text-destructive">{errors.type}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Content</Label>
              <span
                className={`text-xs ${
                  content.length > 1900
                    ? "text-destructive"
                    : "text-muted-foreground"
                }`}
              >
                {content.length}/2000
              </span>
            </div>
            <Textarea
              placeholder="What do you want to share with the team?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              maxLength={2000}
            />
            {errors.content && (
              <p className="text-xs text-destructive">{errors.content}</p>
            )}
          </div>

          {type === "event" && (
            <div className="space-y-3 rounded-lg border border-violet-200 bg-violet-50/50 p-3 dark:border-violet-800/40 dark:bg-violet-950/20">
              <p className="text-xs font-medium text-violet-700 dark:text-violet-300">
                Event Details
              </p>
              <div className="space-y-1.5">
                <Label>Event Date</Label>
                <Input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Location</Label>
                <Input
                  placeholder="e.g., HQ Conference Room B"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                />
              </div>
            </div>
          )}

          {type === "poll" && (
            <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-800/40 dark:bg-amber-950/20">
              <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
                Poll Details
              </p>
              <div className="space-y-1.5">
                <Label>Question</Label>
                <Input
                  placeholder="Ask your team something..."
                  value={pollQuestion}
                  onChange={(e) => setPollQuestion(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Options</Label>
                {pollOptions.map((opt, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input
                      placeholder={`Option ${idx + 1}`}
                      value={opt}
                      onChange={(e) => updatePollOption(idx, e.target.value)}
                    />
                    {pollOptions.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0"
                        onClick={() => removePollOption(idx)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                {errors.pollOptions && (
                  <p className="text-xs text-destructive">
                    {errors.pollOptions}
                  </p>
                )}
                {pollOptions.length < 6 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addPollOption}
                    className="mt-1 w-full text-xs"
                  >
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Add Option
                  </Button>
                )}
              </div>
            </div>
          )}

          {type === "milestone" && (
            <div className="space-y-3 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-800/40 dark:bg-emerald-950/20">
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                Milestone Details
              </p>
              <div className="space-y-1.5">
                <Label>Kind</Label>
                <Select
                  value={celebrationKind}
                  onValueChange={setCelebrationKind}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select kind" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="birthday">Birthday ðŸŽ‚</SelectItem>
                    <SelectItem value="anniversary">
                      Work Anniversary ðŸŽ‰
                    </SelectItem>
                    <SelectItem value="new_hire">New Hire ðŸ‘‹</SelectItem>
                    <SelectItem value="promotion">Promotion ðŸš€</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Person&apos;s Name</Label>
                <Input
                  placeholder="e.g., Priya Sharma"
                  value={celebrationPerson}
                  onChange={(e) => setCelebrationPerson(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Detail</Label>
                <Input
                  placeholder="e.g., 5-year anniversary, promoted to Senior Designer"
                  value={celebrationDetail}
                  onChange={(e) => setCelebrationDetail(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Post</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
