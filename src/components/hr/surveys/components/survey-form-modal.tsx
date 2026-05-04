"use client";

import { z } from "zod/v4";
import { useState } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { Switch } from "@/src/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Separator } from "@/src/components/ui/separator";
import { Badge } from "@/src/components/ui/badge";
import {
  SURVEY_TYPE_CONFIG,
  SURVEY_STATUS_CONFIG,
  SURVEY_TYPE_OPTIONS,
  SURVEY_STATUS_OPTIONS,
  AUDIENCE_OPTIONS,
  AUDIENCE_LABEL,
  PULSE_FREQUENCY_OPTIONS,
  PULSE_FREQUENCY_LABEL,
  DEPARTMENTS,
  SURVEY_TEMPLATES,
} from "../data";
import type {
  Survey,
  NewSurvey,
  SurveyType,
  SurveyStatus,
  SurveyAudience,
  PulseFrequency,
  QuestionType,
} from "../types";

const QUESTION_TYPE_OPTIONS: { value: QuestionType; label: string }[] = [
  { value: "multiple_choice", label: "Multiple Choice" },
  { value: "rating", label: "Rating Scale" },
  { value: "likert", label: "Likert Scale" },
  { value: "open_text", label: "Open Text" },
  { value: "nps", label: "NPS (0–10)" },
  { value: "yes_no", label: "Yes / No" },
];

const schema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  description: z
    .string()
    .min(10, { message: "Description must be at least 10 characters" }),
  type: z.string().min(1, { message: "Please select a survey type" }),
  status: z.string().min(1, { message: "Please select a status" }),
  audience: z.string().min(1, { message: "Please select an audience" }),
});

type DraftQuestion = {
  _key: string;
  text: string;
  type: QuestionType;
  required: boolean;
  options: string[];
  newOption: string;
  scaleMin: string;
  scaleMax: string;
};

type FormValues = {
  title: string;
  description: string;
  type: SurveyType | "";
  status: SurveyStatus | "";
  audience: SurveyAudience | "";
  targetDepartments: string[];
  isAnonymous: boolean;
  sendReminder: boolean;
  startDate: string;
  endDate: string;
  pulseFrequency: PulseFrequency | "";
  totalTargeted: string;
};

function getDefaults(): FormValues {
  return {
    title: "",
    description: "",
    type: "",
    status: "draft",
    audience: "all_staff",
    targetDepartments: [],
    isAnonymous: true,
    sendReminder: true,
    startDate: "",
    endDate: "",
    pulseFrequency: "",
    totalTargeted: "120",
  };
}

function questionDefaults(type: QuestionType = "open_text"): DraftQuestion {
  return {
    _key: `q-${Date.now()}-${Math.random()}`,
    text: "",
    type,
    required: true,
    options:
      type === "likert"
        ? [
            "Strongly Agree",
            "Agree",
            "Neutral",
            "Disagree",
            "Strongly Disagree",
          ]
        : [],
    newOption: "",
    scaleMin: type === "nps" ? "0" : "1",
    scaleMax: type === "nps" ? "10" : "5",
  };
}

interface SurveyFormModalProps {
  open: boolean;
  survey?: Survey | null;
  onClose: () => void;
  onSave: (data: NewSurvey) => void;
}

export function SurveyFormModal({
  open,
  survey,
  onClose,
  onSave,
}: SurveyFormModalProps) {
  const [prevOpen, setPrevOpen] = useState(false);
  const [form, setForm] = useState<FormValues>(getDefaults);
  const [questions, setQuestions] = useState<DraftQuestion[]>([]);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [templateOpen, setTemplateOpen] = useState(false);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      if (survey) {
        setForm({
          title: survey.title,
          description: survey.description,
          type: survey.type,
          status: survey.status,
          audience: survey.audience,
          targetDepartments: survey.targetDepartments ?? [],
          isAnonymous: survey.isAnonymous,
          sendReminder: survey.sendReminder,
          startDate: survey.startDate ?? "",
          endDate: survey.endDate ?? "",
          pulseFrequency: survey.pulseFrequency ?? "",
          totalTargeted: String(survey.totalTargeted),
        });
        setQuestions(
          survey.questions.map((q) => ({
            _key: q.id,
            text: q.text,
            type: q.type,
            required: q.required,
            options: q.options ?? [],
            newOption: "",
            scaleMin: String(q.scaleMin ?? (q.type === "nps" ? 0 : 1)),
            scaleMax: String(q.scaleMax ?? (q.type === "nps" ? 10 : 5)),
          })),
        );
      } else {
        setForm(getDefaults());
        setQuestions([]);
      }
      setErrors({});
      setTemplateOpen(false);
    }
  }

  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function applyTemplate(templateId: string) {
    const tmpl = SURVEY_TEMPLATES.find((t) => t.id === templateId);
    if (!tmpl) return;
    setForm((prev) => ({
      ...prev,
      title: tmpl.name,
      description: tmpl.description,
      type: tmpl.type,
    }));
    setQuestions(
      tmpl.questions.map((q) => ({
        _key: `q-${Date.now()}-${Math.random()}`,
        text: q.text,
        type: q.type,
        required: q.required,
        options: q.options ?? [],
        newOption: "",
        scaleMin: String(q.scaleMin ?? 1),
        scaleMax: String(q.scaleMax ?? (q.type === "nps" ? 10 : 5)),
      })),
    );
    setTemplateOpen(false);
  }

  function addQuestion() {
    setQuestions((prev) => [...prev, questionDefaults("open_text")]);
  }

  function removeQuestion(key: string) {
    setQuestions((prev) => prev.filter((q) => q._key !== key));
  }

  function updateQuestion<K extends keyof DraftQuestion>(
    key: string,
    field: K,
    value: DraftQuestion[K],
  ) {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q._key !== key) return q;
        const updated = { ...q, [field]: value };
        if (field === "type") {
          const t = value as QuestionType;
          updated.options =
            t === "likert"
              ? [
                  "Strongly Agree",
                  "Agree",
                  "Neutral",
                  "Disagree",
                  "Strongly Disagree",
                ]
              : [];
          updated.scaleMin = t === "nps" ? "0" : "1";
          updated.scaleMax = t === "nps" ? "10" : "5";
        }
        return updated;
      }),
    );
  }

  function addOption(qKey: string) {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q._key !== qKey || q.newOption.trim() === "") return q;
        return {
          ...q,
          options: [...q.options, q.newOption.trim()],
          newOption: "",
        };
      }),
    );
  }

  function removeOption(qKey: string, opt: string) {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q._key !== qKey) return q;
        return { ...q, options: q.options.filter((o) => o !== opt) };
      }),
    );
  }

  function toggleDepartment(dept: string) {
    setForm((prev) => {
      const exists = prev.targetDepartments.includes(dept);
      return {
        ...prev,
        targetDepartments: exists
          ? prev.targetDepartments.filter((d) => d !== dept)
          : [...prev.targetDepartments, dept],
      };
    });
  }

  function handleSave() {
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => {
        const path = i.path[0];
        if (path) errs[String(path)] = i.message;
      });
      setErrors(errs);
      return;
    }
    if (questions.some((q) => q.text.trim() === "")) {
      setErrors((prev) => ({
        ...prev,
        questions: "All question texts are required",
      }));
      return;
    }
    const data: NewSurvey = {
      title: form.title,
      description: form.description,
      type: form.type as SurveyType,
      status: form.status as SurveyStatus,
      audience: form.audience as SurveyAudience,
      targetDepartments:
        form.targetDepartments.length > 0 ? form.targetDepartments : undefined,
      isAnonymous: form.isAnonymous,
      sendReminder: form.sendReminder,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      pulseFrequency: form.pulseFrequency
        ? (form.pulseFrequency as PulseFrequency)
        : undefined,
      totalTargeted: parseInt(form.totalTargeted, 10) || 0,
      questions: questions.map((q) => ({
        text: q.text,
        type: q.type,
        required: q.required,
        options: q.options.length > 0 ? q.options : undefined,
        scaleMin: q.scaleMin ? parseInt(q.scaleMin, 10) : undefined,
        scaleMax: q.scaleMax ? parseInt(q.scaleMax, 10) : undefined,
      })),
    };
    onSave(data);
  }

  const isPulse = form.type === "pulse";

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="shrink-0 px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle>{survey ? "Edit Survey" : "Create Survey"}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5 space-y-5">
          {!survey && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Start from a template (optional)
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => setTemplateOpen((v) => !v)}
                >
                  {templateOpen ? "Hide" : "Browse Templates"}
                </Button>
              </div>
              {templateOpen && (
                <div className="grid grid-cols-1 gap-2">
                  {SURVEY_TEMPLATES.map((tmpl) => {
                    const tc = SURVEY_TYPE_CONFIG[tmpl.type];
                    return (
                      <button
                        key={tmpl.id}
                        type="button"
                        onClick={() => applyTemplate(tmpl.id)}
                        className="text-left bg-card border border-border rounded-lg p-3 hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-medium">
                            {tmpl.name}
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-xs ${tc.color} ${tc.bg} ${tc.border}`}
                          >
                            {tc.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {tmpl.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <Separator />

          <div className="space-y-1.5">
            <Label className="text-xs">
              Survey Title <span className="text-destructive">*</span>
            </Label>
            <Input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Q3 Engagement Pulse"
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Brief description of this survey..."
              rows={2}
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">
                Survey Type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.type}
                onValueChange={(v) => set("type", v as SurveyType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {SURVEY_TYPE_OPTIONS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {SURVEY_TYPE_CONFIG[t].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-xs text-destructive">{errors.type}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">
                Status <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.status}
                onValueChange={(v) => set("status", v as SurveyStatus)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {SURVEY_STATUS_OPTIONS.filter((s) => s !== "archived").map(
                    (s) => (
                      <SelectItem key={s} value={s}>
                        {SURVEY_STATUS_CONFIG[s].label}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="text-xs text-destructive">{errors.status}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">
              Target Audience <span className="text-destructive">*</span>
            </Label>
            <Select
              value={form.audience}
              onValueChange={(v) => set("audience", v as SurveyAudience)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select audience" />
              </SelectTrigger>
              <SelectContent>
                {AUDIENCE_OPTIONS.map((a) => (
                  <SelectItem key={a} value={a}>
                    {AUDIENCE_LABEL[a]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.audience && (
              <p className="text-xs text-destructive">{errors.audience}</p>
            )}
          </div>

          {form.audience === "department" && (
            <div className="space-y-1.5">
              <Label className="text-xs">Select Departments</Label>
              <div className="flex flex-wrap gap-2">
                {DEPARTMENTS.map((dept) => {
                  const selected = form.targetDepartments.includes(dept);
                  return (
                    <button
                      key={dept}
                      type="button"
                      onClick={() => toggleDepartment(dept)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                        selected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground hover:border-primary/40"
                      }`}
                    >
                      {dept}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Start Date</Label>
              <Input
                type="date"
                value={form.startDate}
                onChange={(e) => set("startDate", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">End Date</Label>
              <Input
                type="date"
                value={form.endDate}
                onChange={(e) => set("endDate", e.target.value)}
              />
            </div>
          </div>

          {isPulse && (
            <div className="space-y-1.5">
              <Label className="text-xs">Pulse Frequency</Label>
              <Select
                value={form.pulseFrequency}
                onValueChange={(v) =>
                  set("pulseFrequency", v as PulseFrequency)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  {PULSE_FREQUENCY_OPTIONS.map((f) => (
                    <SelectItem key={f} value={f}>
                      {PULSE_FREQUENCY_LABEL[f]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs">Total Targeted Employees</Label>
            <Input
              type="number"
              min={1}
              value={form.totalTargeted}
              onChange={(e) => set("totalTargeted", e.target.value)}
              className="w-32"
            />
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch
                id="anon"
                checked={form.isAnonymous}
                onCheckedChange={(v) => set("isAnonymous", v)}
              />
              <Label htmlFor="anon" className="text-xs cursor-pointer">
                Anonymous responses
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="reminder"
                checked={form.sendReminder}
                onCheckedChange={(v) => set("sendReminder", v)}
              />
              <Label htmlFor="reminder" className="text-xs cursor-pointer">
                Send reminders
              </Label>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">
                Questions ({questions.length})
              </p>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs h-7"
                onClick={addQuestion}
              >
                <Plus className="w-3.5 h-3.5" />
                Add Question
              </Button>
            </div>

            {errors.questions && (
              <p className="text-xs text-destructive">{errors.questions}</p>
            )}

            {questions.length === 0 && (
              <p className="text-xs text-muted-foreground italic text-center py-4">
                No questions yet. Add a question or use a template to get
                started.
              </p>
            )}

            {questions.map((q, idx) => (
              <div
                key={q._key}
                className="bg-card border border-border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start gap-2">
                  <GripVertical className="w-4 h-4 text-muted-foreground/50 mt-2 shrink-0" />
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-medium w-5">
                        Q{idx + 1}
                      </span>
                      <Select
                        value={q.type}
                        onValueChange={(v) =>
                          updateQuestion(q._key, "type", v as QuestionType)
                        }
                      >
                        <SelectTrigger className="h-7 text-xs w-44">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {QUESTION_TYPE_OPTIONS.map((o) => (
                            <SelectItem
                              key={o.value}
                              value={o.value}
                              className="text-xs"
                            >
                              {o.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex items-center gap-1.5 ml-auto">
                        <Switch
                          id={`req-${q._key}`}
                          checked={q.required}
                          onCheckedChange={(v) =>
                            updateQuestion(q._key, "required", v)
                          }
                          className="scale-75"
                        />
                        <Label
                          htmlFor={`req-${q._key}`}
                          className="text-xs text-muted-foreground cursor-pointer"
                        >
                          Required
                        </Label>
                      </div>
                    </div>

                    <Input
                      value={q.text}
                      onChange={(e) =>
                        updateQuestion(q._key, "text", e.target.value)
                      }
                      placeholder="Question text..."
                      className="text-sm"
                    />

                    {(q.type === "multiple_choice" || q.type === "likert") && (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">Options</p>
                        <div className="flex flex-wrap gap-1.5">
                          {q.options.map((opt) => (
                            <span
                              key={opt}
                              className="inline-flex items-center gap-1 text-xs bg-muted rounded-md px-2 py-0.5"
                            >
                              {opt}
                              {q.type !== "likert" && (
                                <button
                                  type="button"
                                  onClick={() => removeOption(q._key, opt)}
                                  className="text-muted-foreground hover:text-destructive"
                                >
                                  ×
                                </button>
                              )}
                            </span>
                          ))}
                        </div>
                        {q.type === "multiple_choice" && (
                          <div className="flex gap-2">
                            <Input
                              value={q.newOption}
                              onChange={(e) =>
                                updateQuestion(
                                  q._key,
                                  "newOption",
                                  e.target.value,
                                )
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  addOption(q._key);
                                }
                              }}
                              placeholder="Add option..."
                              className="text-xs h-7 flex-1"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs px-2"
                              onClick={() => addOption(q._key)}
                            >
                              Add
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {(q.type === "rating" || q.type === "nps") && (
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-muted-foreground">Scale:</span>
                        <Input
                          type="number"
                          value={q.scaleMin}
                          onChange={(e) =>
                            updateQuestion(q._key, "scaleMin", e.target.value)
                          }
                          className="w-16 h-7 text-xs"
                        />
                        <span className="text-muted-foreground">to</span>
                        <Input
                          type="number"
                          value={q.scaleMax}
                          onChange={(e) =>
                            updateQuestion(q._key, "scaleMax", e.target.value)
                          }
                          className="w-16 h-7 text-xs"
                        />
                      </div>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => removeQuestion(q._key)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="shrink-0 px-6 py-4 border-t border-border flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {survey ? "Save Changes" : "Create Survey"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
