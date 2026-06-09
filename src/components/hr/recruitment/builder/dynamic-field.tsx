"use client";

import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/src/components/ui/radio-group";
import { Checkbox } from "@/src/components/ui/checkbox";
import { FileDropzone } from "@/src/components/shared/file-dropzone";
import type { ApplicationFormField } from "@/src/lib/types/recruitment";

/** A read-only live preview of how an application-form field will render. */
export function DynamicFieldPreview({
  field,
}: {
  field: ApplicationFormField;
}) {
  const opts = field.constraints?.allowedValues?.length
    ? field.constraints.allowedValues
    : (field.options ?? []);

  return (
    <div className="space-y-1.5">
      <Label className="text-xs">
        {field.label || "Untitled field"}
        {field.required && <span className="text-red-500"> *</span>}
      </Label>
      {field.type === "long_text" ? (
        <Textarea rows={2} disabled placeholder="Applicant answer…" />
      ) : field.type === "dropdown" ? (
        <Select disabled>
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Select…" />
          </SelectTrigger>
          <SelectContent>
            {opts.map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : field.type === "radio" ? (
        <RadioGroup className="gap-1.5">
          {opts.map((o) => (
            <label
              key={o}
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <RadioGroupItem value={o} disabled />
              {o}
            </label>
          ))}
        </RadioGroup>
      ) : field.type === "checkboxes" ? (
        <div className="space-y-1.5">
          {opts.map((o) => (
            <label
              key={o}
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <Checkbox disabled />
              {o}
            </label>
          ))}
        </div>
      ) : field.type === "yes_no" ? (
        <RadioGroup className="flex flex-row gap-4">
          {["Yes", "No"].map((o) => (
            <label
              key={o}
              className="flex items-center gap-2 text-sm text-muted-foreground"
            >
              <RadioGroupItem value={o} disabled />
              {o}
            </label>
          ))}
        </RadioGroup>
      ) : field.type === "file" ? (
        <FileDropzone disabled hint="PDF, images or documents" />
      ) : (
        <Input
          disabled
          type={
            field.type === "email"
              ? "email"
              : field.type === "phone"
                ? "tel"
                : field.type === "number"
                  ? "number"
                  : field.type === "date"
                    ? "date"
                    : "text"
          }
          placeholder="Applicant answer…"
        />
      )}
    </div>
  );
}
