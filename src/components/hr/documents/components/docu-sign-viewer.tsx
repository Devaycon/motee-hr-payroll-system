"use client";

import { useRef, useState, useEffect } from "react";
import { toast } from "sonner";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  Trash2,
  Type,
  PenLine,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { cn } from "@/src/lib/utils";

export interface DocSignInfo {
  name: string;
  description?: string;
  category?: string;
  fileType?: string;
}

interface Annotation {
  id: string;
  type: "signature" | "text";
  x: number;
  y: number;
  dataUrl?: string;
  text?: string;
}

const INK_COLORS = [
  "#1a1a2e",
  "#16213e",
  "#c62a88",
  "#e63946",
  "#4361ee",
  "#2dc653",
  "#7b2d8b",
  "#d62828",
  "#f77f00",
  "#0096c7",
];

function SignatureModal({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (dataUrl: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [inkColor, setInkColor] = useState(INK_COLORS[0]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    lastPos.current = null;
  }, [open]);

  function getPos(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  function startDraw(e: React.MouseEvent<HTMLCanvasElement>) {
    setIsDrawing(true);
    lastPos.current = getPos(e);
  }

  function draw(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawing) return;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const pos = getPos(e);
    if (lastPos.current) {
      ctx.beginPath();
      ctx.strokeStyle = inkColor;
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      setHasDrawn(true);
    }
    lastPos.current = pos;
  }

  function stopDraw() {
    setIsDrawing(false);
    lastPos.current = null;
  }

  function handleClear() {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  }

  function handleAdd() {
    if (!hasDrawn) {
      toast.error("Please draw your signature first.");
      return;
    }
    const canvas = canvasRef.current!;
    onAdd(canvas.toDataURL("image/png"));
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-lg p-0 gap-0 z-60"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-base font-semibold">
                Draw Your Signature
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Sign in the area below
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-5 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Ink Color
            </p>
            <div className="flex items-center gap-1.5 flex-wrap">
              {INK_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setInkColor(c)}
                  className={cn(
                    "w-7 h-7 rounded-full border-2 transition-all",
                    inkColor === c
                      ? "border-foreground scale-110"
                      : "border-transparent",
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
              <label className="flex items-center gap-1 cursor-pointer rounded-full border border-border px-2 h-7 text-xs text-muted-foreground hover:text-foreground">
                <span className="text-base leading-none">+</span>
                <span>Custom</span>
                <input
                  type="color"
                  className="w-0 h-0 opacity-0 absolute"
                  onChange={(e) => setInkColor(e.target.value)}
                />
              </label>
            </div>
          </div>

          <div className="relative rounded-lg border border-border bg-white overflow-hidden">
            {!hasDrawn && (
              <p className="absolute inset-0 flex items-center justify-center text-sm text-gray-300 pointer-events-none select-none">
                Sign here...
              </p>
            )}
            <canvas
              ref={canvasRef}
              width={480}
              height={180}
              className="w-full"
              style={{ cursor: "crosshair", touchAction: "none" }}
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={stopDraw}
              onMouseLeave={stopDraw}
            />
          </div>

          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-muted-foreground"
              onClick={handleClear}
            >
              Clear
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs bg-[#4361ee] hover:bg-[#4361ee]/90 text-white"
                onClick={handleAdd}
              >
                Add to Document
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DefaultDocContent({
  doc,
  zoom,
  docH,
}: {
  doc: DocSignInfo;
  zoom: number;
  docH: number;
}) {
  const ft = doc.fileType?.toLowerCase();

  if (ft === "pdf") {
    return (
      <iframe
        src="/sample/sample.pdf"
        className="w-full border-0"
        style={{ minHeight: `${docH}px` }}
        title={doc.name}
      />
    );
  }

  if (ft === "png") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/sample/sample.png"
        alt={doc.name}
        className="w-full object-contain"
      />
    );
  }

  if (ft === "jpg" || ft === "jpeg") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/sample/sample.jpg"
        alt={doc.name}
        className="w-full object-contain"
      />
    );
  }

  if (ft === "doc" || ft === "docx") {
    const pad = Math.max(32, (56 * zoom) / 100);
    const h1 = Math.max(16, (26 * zoom) / 100);
    const h2 = Math.max(12, (18 * zoom) / 100);
    const body = Math.max(8, (12 * zoom) / 100);
    const lineH = Math.max(5, (9 * zoom) / 100);
    const gap = Math.max(3, (5 * zoom) / 100);
    return (
      <div
        className="absolute inset-0 font-sans text-gray-800"
        style={{ padding: `${pad}px` }}
      >
        <p
          className="font-bold text-gray-900 mb-1"
          style={{ fontSize: `${h1}px` }}
        >
          {doc.name}
        </p>
        <p
          className="text-gray-500 mb-4 italic"
          style={{ fontSize: `${h2}px` }}
        >
          {doc.description ?? doc.category ?? "Microsoft Word Document"}
        </p>
        <div className="flex flex-col" style={{ gap: `${gap}px` }}>
          {[
            "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Phasellus facilisis odio sed mi.",
            "Curabitur suscipit. Nullam vel nisi. Etiam semper ipsum ut lectus.",
            "",
            "Proin aliquam, erat eget pharetra commodo, eros mi condimentum quam, sed commodo justo quam ut velit.",
            "Integer a erat. Cras laoreet ligula cursus enim.",
            "",
            "Aenean scelerisque velit et tellus. Vestibulum dictum aliquet sem.",
            "Nulla facilisi. Vestibulum accumsan ante vitae elit.",
          ].map((line, i) =>
            line === "" ? (
              <div key={i} style={{ height: `${lineH}px` }} />
            ) : (
              <p
                key={i}
                className="text-gray-700 leading-relaxed"
                style={{ fontSize: `${body}px` }}
              >
                {line}
              </p>
            ),
          )}
        </div>
      </div>
    );
  }

  return null;
}

interface DocuSignViewerProps {
  open: boolean;
  document: DocSignInfo | null;
  onClose: () => void;
}

export function DocuSignViewer({
  open,
  document: doc,
  onClose,
}: DocuSignViewerProps) {
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [signatureOpen, setSignatureOpen] = useState(false);
  const [textMode, setTextMode] = useState(false);
  const [zoom, setZoom] = useState(70);
  const [page, setPage] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setUploadedFile(null);
      setAnnotations([]);
      setSelectedId(null);
      setTextMode(false);
      setZoom(70);
      setPage(1);
    }
  }, [open]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setUploadedFile(ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function handleDocClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!textMode) {
      setSelectedId(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const id = `ann-${Date.now()}`;
    setAnnotations((prev) => [
      ...prev,
      { id, type: "text", x, y, text: "Text" },
    ]);
    setSelectedId(id);
    setTextMode(false);
  }

  function addSignature(dataUrl: string) {
    const id = `ann-${Date.now()}`;
    setAnnotations((prev) => [
      ...prev,
      { id, type: "signature", x: 30, y: 65, dataUrl },
    ]);
    setSelectedId(id);
    toast.success("Signature added — drag to reposition");
  }

  function deleteSelected() {
    if (!selectedId) return;
    setAnnotations((prev) => prev.filter((a) => a.id !== selectedId));
    setSelectedId(null);
  }

  if (!open || !doc) return null;

  const docW = (595 * zoom) / 100;
  const docH = (842 * zoom) / 100;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        <div className="flex flex-1 overflow-hidden">
          {/* ── Left Sidebar ── */}
          <div className="w-48 shrink-0 border-r border-border bg-card flex flex-col overflow-y-auto">
            <div className="px-4 pt-5 pb-4 border-b border-border">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                Document
              </p>
              {!uploadedFile ? (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full rounded-lg border-2 border-dashed border-border/60 bg-muted/30 hover:bg-muted/60 transition-colors p-4 flex flex-col items-center gap-1.5"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg border border-border bg-background">
                    <span className="text-xl leading-none text-muted-foreground font-light">
                      +
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-muted-foreground text-center leading-tight">
                    Upload PDF or Image
                  </span>
                  <span className="text-[9px] text-muted-foreground/60">
                    .pdf, .jpg, .png, .webp
                  </span>
                </button>
              ) : (
                <button
                  onClick={() => setUploadedFile(null)}
                  className="w-full rounded-lg border border-red-500/30 bg-red-500/10 text-red-600 text-xs py-2 flex items-center justify-center gap-1.5 hover:bg-red-500/20 transition-colors"
                >
                  <X className="w-3 h-3" />
                  Remove Document
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            <div className="px-4 py-4 border-b border-border flex flex-col gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                Annotations
              </p>
              <button
                onClick={() => setSignatureOpen(true)}
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-muted/60 transition-colors text-left"
              >
                <PenLine className="w-3.5 h-3.5 text-primary shrink-0" />
                Draw Signature
              </button>
              <button
                onClick={() => setTextMode((v) => !v)}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors text-left",
                  textMode
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:bg-muted/60",
                )}
              >
                <Type className="w-3.5 h-3.5 shrink-0" />
                Add Text
              </button>
              {selectedId && (
                <button
                  onClick={deleteSelected}
                  className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-500/20 transition-colors text-left"
                >
                  <Trash2 className="w-3.5 h-3.5 shrink-0" />
                  Delete Selected
                </button>
              )}
            </div>

            <div className="px-4 py-4 flex flex-col gap-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                Tips
              </p>
              {[
                { color: "#4361ee", text: "Click elements to select" },
                { color: "#f77f00", text: "Drag to reposition" },
                { color: "#2dc653", text: "Use handles to resize" },
                { color: "#6b7280", text: "Select then delete" },
              ].map((tip) => (
                <div key={tip.text} className="flex items-start gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-sm shrink-0 mt-0.5"
                    style={{ backgroundColor: tip.color }}
                  />
                  <span className="text-[10px] text-muted-foreground leading-tight">
                    {tip.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Main Area ── */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Top Bar */}
            <div className="flex items-center justify-between px-5 py-2.5 border-b border-border bg-card shrink-0">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage(1)}
                  className={cn(
                    "w-6 h-6 rounded text-xs font-medium transition-colors",
                    page === 1
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted text-muted-foreground",
                  )}
                >
                  1
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(p + 1, 1))}
                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <span className="text-xs text-muted-foreground ml-1">
                  {page} / 1
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setZoom((z) => Math.max(z - 10, 30))}
                    className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-medium w-10 text-center tabular-nums">
                    {zoom}%
                  </span>
                  <button
                    onClick={() => setZoom((z) => Math.min(z + 10, 200))}
                    className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setZoom(100)}
                    className="px-2 py-0.5 rounded text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    100%
                  </button>
                  <button
                    onClick={() => setZoom(70)}
                    className="px-2 py-0.5 rounded text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    Fit
                  </button>
                </div>
                <Button
                  size="sm"
                  className="h-8 text-xs gap-1.5"
                  onClick={() => {
                    toast.success("Document signed and saved.");
                    onClose();
                  }}
                >
                  Save & Sign
                </Button>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Document Viewport */}
            <div
              className="flex-1 overflow-auto bg-muted/30 flex items-start justify-center py-8 px-4"
              onClick={(e) => {
                if (e.target === e.currentTarget) setSelectedId(null);
              }}
            >
              <div
                className="relative bg-white shadow-lg"
                style={{
                  width: `${docW}px`,
                  minHeight: `${docH}px`,
                  cursor: textMode ? "crosshair" : "default",
                }}
                onClick={handleDocClick}
              >
                {uploadedFile ? (
                  uploadedFile.startsWith("data:image") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={uploadedFile}
                      alt="Document"
                      className="w-full object-contain"
                    />
                  ) : (
                    <iframe
                      src={uploadedFile}
                      className="w-full border-0"
                      style={{ minHeight: `${docH}px` }}
                      title="Document"
                    />
                  )
                ) : (
                  <DefaultDocContent doc={doc} zoom={zoom} docH={docH} />
                )}

                {annotations.map((ann) => (
                  <div
                    key={ann.id}
                    className={cn(
                      "absolute cursor-move select-none",
                      selectedId === ann.id &&
                        "ring-2 ring-primary ring-offset-2",
                    )}
                    style={{
                      left: `${ann.x}%`,
                      top: `${ann.y}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedId(ann.id);
                      setTextMode(false);
                    }}
                  >
                    {ann.type === "signature" && ann.dataUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={ann.dataUrl}
                        alt="Signature"
                        style={{
                          width: `${(160 * zoom) / 100}px`,
                          height: `${(60 * zoom) / 100}px`,
                          objectFit: "contain",
                        }}
                        draggable={false}
                      />
                    )}
                    {ann.type === "text" && (
                      <span
                        className="border border-primary/50 px-1.5 py-0.5 text-primary bg-primary/5 rounded cursor-text"
                        style={{
                          fontSize: `${Math.max(8, (13 * zoom) / 100)}px`,
                        }}
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => {
                          const text = e.currentTarget.textContent ?? "";
                          setAnnotations((prev) =>
                            prev.map((a) =>
                              a.id === ann.id ? { ...a, text } : a,
                            ),
                          );
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {ann.text}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <SignatureModal
        open={signatureOpen}
        onClose={() => setSignatureOpen(false)}
        onAdd={addSignature}
      />
    </>
  );
}
