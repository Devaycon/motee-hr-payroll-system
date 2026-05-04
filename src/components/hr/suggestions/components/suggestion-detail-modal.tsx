"use client";

import { useState } from "react";
import {
  ChevronUp,
  ShieldCheck,
  Star,
  MessageCircle,
  Send,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Textarea } from "@/src/components/ui/textarea";
import { Label } from "@/src/components/ui/label";
import { Switch } from "@/src/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Avatar, AvatarFallback } from "@/src/components/ui/avatar";
import { Separator } from "@/src/components/ui/separator";
import {
  SUGGESTION_STATUS_CONFIG,
  SUGGESTION_CATEGORY_CONFIG,
  SUGGESTION_PRIORITY_CONFIG,
  SUGGESTION_STATUS_OPTIONS,
  SUGGESTION_PRIORITY_OPTIONS,
} from "../data";
import type {
  Suggestion,
  SuggestionStatus,
  SuggestionPriority,
} from "../types";

const STATUS_STEPS: SuggestionStatus[] = [
  "submitted",
  "under_review",
  "accepted",
  "in_progress",
  "implemented",
];

interface SuggestionDetailModalProps {
  suggestion: Suggestion | null;
  open: boolean;
  onClose: () => void;
  onUpdateStatus: (id: string, status: SuggestionStatus) => void;
  onUpdatePriority: (id: string, priority: SuggestionPriority) => void;
  onSaveAdminResponse: (id: string, response: string) => void;
  onSaveImplementationNotes: (id: string, notes: string) => void;
  onToggleFeatured: (id: string) => void;
  onAddComment: (id: string, message: string) => void;
}

export function SuggestionDetailModal({
  suggestion,
  open,
  onClose,
  onUpdateStatus,
  onUpdatePriority,
  onSaveAdminResponse,
  onSaveImplementationNotes,
  onToggleFeatured,
  onAddComment,
}: SuggestionDetailModalProps) {
  const [prevSuggestionId, setPrevSuggestionId] = useState<string | null>(null);
  const [adminResponse, setAdminResponse] = useState("");
  const [implementationNotes, setImplementationNotes] = useState("");
  const [newComment, setNewComment] = useState("");

  if (suggestion && suggestion.id !== prevSuggestionId) {
    setPrevSuggestionId(suggestion.id);
    setAdminResponse(suggestion.adminResponse ?? "");
    setImplementationNotes(suggestion.implementationNotes ?? "");
    setNewComment("");
  }

  if (!suggestion) return null;

  const catConfig = SUGGESTION_CATEGORY_CONFIG[suggestion.category];
  const statusConfig = SUGGESTION_STATUS_CONFIG[suggestion.status];
  const priorityConfig = SUGGESTION_PRIORITY_CONFIG[suggestion.priority];
  const isDeclined = suggestion.status === "declined";
  const currentStep = isDeclined ? -1 : STATUS_STEPS.indexOf(suggestion.status);

  function handleStatusChange(status: SuggestionStatus) {
    onUpdateStatus(suggestion!.id, status);
    toast.success(
      `Status updated to ${SUGGESTION_STATUS_CONFIG[status].label}`,
    );
  }

  function handlePriorityChange(priority: SuggestionPriority) {
    onUpdatePriority(suggestion!.id, priority);
    toast.success(
      `Priority updated to ${SUGGESTION_PRIORITY_CONFIG[priority].label}`,
    );
  }

  function handleSaveAdminResponse() {
    onSaveAdminResponse(suggestion!.id, adminResponse);
    toast.success("Response saved and visible to submitter");
  }

  function handleSaveImplementationNotes() {
    onSaveImplementationNotes(suggestion!.id, implementationNotes);
    toast.success("Implementation notes saved");
  }

  function handleAddComment() {
    if (!newComment.trim()) return;
    onAddComment(suggestion!.id, newComment.trim());
    setNewComment("");
    toast.success("Comment added");
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        <div className="px-6 pt-6 pb-4 pr-14 border-b border-border/60">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                className={`text-xs ${catConfig.color} ${catConfig.bg} ${catConfig.border}`}
              >
                {catConfig.label}
              </Badge>
              <Badge
                variant="outline"
                className={`text-xs ${statusConfig.color} ${statusConfig.bg} ${statusConfig.border}`}
              >
                {statusConfig.label}
              </Badge>
              <Badge
                variant="outline"
                className={`text-xs ${priorityConfig.color} ${priorityConfig.bg} ${priorityConfig.border}`}
              >
                {priorityConfig.label}
              </Badge>
              {suggestion.isFeatured && (
                <Badge
                  variant="outline"
                  className="text-xs text-amber-600 bg-amber-500/10 border-amber-500/30 gap-1"
                >
                  <Star className="w-2.5 h-2.5 fill-amber-500" />
                  Featured
                </Badge>
              )}
            </div>
            <p className="text-base font-semibold leading-snug text-foreground">
              {suggestion.title}
            </p>
            <div className="flex items-center gap-1 text-muted-foreground">
              <ChevronUp className="w-4 h-4" />
              <span className="text-sm font-semibold text-foreground">
                {suggestion.upvotes}
              </span>
              <span className="text-xs text-muted-foreground">upvotes</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {!isDeclined && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Progress
              </p>
              <div className="relative flex items-center">
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-border/60" />
                <div className="relative flex items-center justify-between w-full">
                  {STATUS_STEPS.map((step, i) => {
                    const stepConfig = SUGGESTION_STATUS_CONFIG[step];
                    const isDone = i <= currentStep;
                    const isCurrent = i === currentStep;
                    return (
                      <div
                        key={step}
                        className="flex flex-col items-center gap-1.5 z-10"
                      >
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                            isDone
                              ? "bg-primary border-primary text-primary-foreground"
                              : "bg-background border-border/60 text-muted-foreground"
                          } ${isCurrent ? "ring-2 ring-primary/30 ring-offset-1 ring-offset-background" : ""}`}
                        >
                          {isDone && !isCurrent ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <span className="text-[9px] font-bold">
                              {i + 1}
                            </span>
                          )}
                        </div>
                        <span
                          className={`text-[10px] font-medium whitespace-nowrap ${
                            isCurrent
                              ? "text-primary"
                              : isDone
                                ? "text-foreground"
                                : "text-muted-foreground"
                          }`}
                        >
                          {stepConfig.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {isDeclined && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/30">
              <X className="w-3.5 h-3.5 text-destructive" />
              <p className="text-xs text-destructive font-medium">
                This suggestion has been declined.
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Description
            </p>
            <p className="text-sm text-foreground leading-relaxed">
              {suggestion.description}
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Submitted {suggestion.createdAt}</span>
            {suggestion.updatedAt !== suggestion.createdAt && (
              <span>Updated {suggestion.updatedAt}</span>
            )}
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Submitter
            </p>
            {suggestion.isAnonymous ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-sm">Anonymous submission</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Avatar className="w-7 h-7">
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {suggestion.submitterInitials}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-foreground leading-none">
                    {suggestion.submitterName}
                  </p>
                  {suggestion.submitterDept && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {suggestion.submitterDept}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {suggestion.adminResponse && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg px-3 py-3 space-y-1">
              <p className="text-xs font-medium text-primary">HR Response</p>
              <p className="text-sm text-foreground">
                {suggestion.adminResponse}
              </p>
            </div>
          )}

          <Separator />

          <div className="space-y-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Admin Actions
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Update Status</Label>
                <Select
                  value={suggestion.status}
                  onValueChange={(v) =>
                    handleStatusChange(v as SuggestionStatus)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUGGESTION_STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {SUGGESTION_STATUS_CONFIG[s].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Priority</Label>
                <Select
                  value={suggestion.priority}
                  onValueChange={(v) =>
                    handlePriorityChange(v as SuggestionPriority)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUGGESTION_PRIORITY_OPTIONS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {SUGGESTION_PRIORITY_CONFIG[p].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-xs font-medium">Featured</Label>
                <p className="text-xs text-muted-foreground">
                  Pin to the top of the community board
                </p>
              </div>
              <Switch
                checked={suggestion.isFeatured}
                onCheckedChange={() => onToggleFeatured(suggestion.id)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium">Admin Response</Label>
              <Textarea
                value={adminResponse}
                onChange={(e) => setAdminResponse(e.target.value)}
                placeholder="Write a response visible to the submitter and community..."
                className="min-h-20 resize-none text-sm"
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={handleSaveAdminResponse}
                  disabled={adminResponse === (suggestion.adminResponse ?? "")}
                >
                  Save Response
                </Button>
              </div>
            </div>

            {suggestion.status === "implemented" && (
              <div className="space-y-2">
                <Label className="text-xs font-medium">
                  Implementation Notes
                </Label>
                <Textarea
                  value={implementationNotes}
                  onChange={(e) => setImplementationNotes(e.target.value)}
                  placeholder="Internal notes on how this was implemented..."
                  className="min-h-20 resize-none text-sm"
                />
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSaveImplementationNotes}
                    disabled={
                      implementationNotes ===
                      (suggestion.implementationNotes ?? "")
                    }
                  >
                    Save Notes
                  </Button>
                </div>
              </div>
            )}
          </div>

          {suggestion.comments.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-3.5 h-3.5 text-muted-foreground" />
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Comments ({suggestion.comments.length})
                  </p>
                </div>
                <div className="space-y-3">
                  {suggestion.comments.map((c) => (
                    <div key={c.id} className="flex items-start gap-2.5">
                      <Avatar className="w-6 h-6 shrink-0">
                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                          {c.authorInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-foreground">
                            {c.authorName}
                          </span>
                          {c.isAdmin && (
                            <Badge
                              variant="outline"
                              className="text-[10px] text-primary bg-primary/10 border-primary/30 py-0 px-1"
                            >
                              HR
                            </Badge>
                          )}
                          <span className="text-[10px] text-muted-foreground">
                            {c.createdAt}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {c.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <Separator />

          <div className="space-y-2">
            <Label className="text-xs font-medium">Add Comment</Label>
            <div className="flex gap-2">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Leave a comment..."
                className="min-h-16 resize-none text-sm flex-1"
              />
            </div>
            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={handleAddComment}
                disabled={!newComment.trim()}
              >
                <Send className="w-3.5 h-3.5 mr-1.5" />
                Comment
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
