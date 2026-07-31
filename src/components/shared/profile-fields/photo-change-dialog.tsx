"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ImageUp, RotateCcw, RotateCw, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Label } from "@/src/components/ui/label";
import { Slider } from "@/src/components/ui/slider";
import { Progress } from "@/src/components/ui/progress";
import { Textarea } from "@/src/components/ui/textarea";
import { cn } from "@/src/lib/utils";

/** Accepted upload formats and ceiling — enforced before anything is read. */
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ACCEPTED_LABEL = "JPG, PNG or WebP";
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
/** Edge length of the square image written back, in px. */
const OUTPUT_SIZE = 512;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export interface PhotoChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** "edit" applies immediately; "request" routes through HR approval. */
  mode: "edit" | "request";
  /** Receives the cropped square image as a data URL, plus the typed reason. */
  onSubmit: (dataUrl: string, reason: string) => void;
}

/**
 * Profile-photo upload with preview, zoom/pan crop, rotation, type and size
 * validation, and (in request mode) a mandatory reason — client feedback
 * round 2 §B3. Shared by the HR employee file and the self-service profile so
 * both enforce the same rules.
 */
export function PhotoChangeDialog({
  open,
  onOpenChange,
  mode,
  onSubmit,
}: PhotoChangeDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [reason, setReason] = useState("");
  const [dragging, setDragging] = useState(false);
  const [prevOpen, setPrevOpen] = useState(false);

  // Clear the previous selection whenever the dialog reopens. The image itself
  // lives in a ref, so the reset runs in an effect rather than during render.
  useEffect(() => {
    if (open === prevOpen) return;
    setPrevOpen(open);
    if (!open) return;
    imageRef.current = null;
    setFileName("");
    setFileSize(0);
    setProgress(0);
    setLoaded(false);
    setRotation(0);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setReason("");
  }, [open, prevOpen]);

  /** Paint the current image at the current rotation/zoom/pan into the canvas. */
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    ctx.clearRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    ctx.save();
    ctx.translate(OUTPUT_SIZE / 2 + offset.x, OUTPUT_SIZE / 2 + offset.y);
    ctx.rotate((rotation * Math.PI) / 180);

    // Cover the square, then apply the zoom multiplier.
    const scale = (OUTPUT_SIZE / Math.min(img.width, img.height)) * zoom;
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    ctx.restore();
  }, [offset.x, offset.y, rotation, zoom]);

  useEffect(() => {
    if (loaded) draw();
  }, [loaded, draw]);

  const handleFile = (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error(`Unsupported file type. Please upload a ${ACCEPTED_LABEL} image.`);
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error(
        `That image is ${formatBytes(file.size)}. The maximum is ${formatBytes(MAX_BYTES)}.`,
      );
      return;
    }

    setFileName(file.name);
    setFileSize(file.size);
    setLoaded(false);
    setProgress(0);
    setRotation(0);
    setZoom(1);
    setOffset({ x: 0, y: 0 });

    const reader = new FileReader();
    reader.onprogress = (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
    };
    reader.onerror = () => toast.error("That image could not be read. Please try another file.");
    reader.onload = () => {
      setProgress(100);
      const img = new Image();
      img.onload = () => {
        imageRef.current = img;
        setLoaded(true);
      };
      img.onerror = () => toast.error("That image could not be opened. Please try another file.");
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!loaded || !canvasRef.current) {
      toast.error("Please choose an image first.");
      return;
    }
    if (mode === "request" && reason.trim().length < 3) {
      toast.error("Please give a brief reason for the change.");
      return;
    }
    onSubmit(canvasRef.current.toDataURL("image/jpeg", 0.9), reason.trim());
    onOpenChange(false);
  };

  // Drag to reposition the crop.
  const dragState = useRef<{ x: number; y: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!loaded) return;
    dragState.current = { x: e.clientX - offset.x, y: e.clientY - offset.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const start = dragState.current;
    if (!start) return;
    setOffset({ x: e.clientX - start.x, y: e.clientY - start.y });
  };
  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    dragState.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            {mode === "edit" ? "Change profile photo" : "Request a profile photo change"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {mode === "edit"
              ? `Upload a ${ACCEPTED_LABEL} image up to ${formatBytes(MAX_BYTES)}.`
              : `Upload a ${ACCEPTED_LABEL} image up to ${formatBytes(MAX_BYTES)}. Your current photo stays in place until HR approves the change.`}
          </DialogDescription>
        </DialogHeader>

        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = ""; // allow re-selecting the same file
            if (file) handleFile(file);
          }}
        />

        {!loaded ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) handleFile(file);
            }}
            className={cn(
              "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
              dragging
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50 hover:bg-muted/40",
            )}
          >
            <Upload className="w-6 h-6 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
              Drop an image here, or click to browse
            </span>
            <span className="text-xs text-muted-foreground">
              {ACCEPTED_LABEL} · up to {formatBytes(MAX_BYTES)}
            </span>
            {progress > 0 && progress < 100 && (
              <Progress value={progress} className="mt-2 h-1.5 w-full" />
            )}
          </button>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col items-center gap-2">
              <canvas
                ref={canvasRef}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                className="h-52 w-52 cursor-grab touch-none rounded-2xl border border-border bg-muted object-cover active:cursor-grabbing"
                aria-label="Profile photo preview — drag to reposition"
              />
              <p className="text-[11px] text-muted-foreground">
                Drag the image to reposition it inside the frame.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Zoom</Label>
              <Slider
                value={[zoom]}
                min={1}
                max={3}
                step={0.05}
                onValueChange={([v]) => setZoom(v)}
              />
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                  onClick={() => setRotation((r) => (r - 90 + 360) % 360)}
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Rotate left
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 text-xs"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                >
                  <RotateCw className="w-3.5 h-3.5" /> Rotate right
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageUp className="w-3.5 h-3.5" /> Change file
              </Button>
            </div>

            <p className="truncate text-[11px] text-muted-foreground">
              {fileName} · {formatBytes(fileSize)}
            </p>

            {mode === "request" && (
              <div className="space-y-1.5">
                <Label className="text-xs">Reason</Label>
                <Textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Why are you updating your photo?"
                  className="text-sm"
                />
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!loaded}>
            {mode === "edit" ? "Save photo" : "Submit request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
