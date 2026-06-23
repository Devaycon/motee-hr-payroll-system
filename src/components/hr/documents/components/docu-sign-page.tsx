"use client";

import { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import type SignatureCanvasType from "react-signature-canvas";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  PenLine,
  Type,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { cn } from "@/src/lib/utils";

const SignatureCanvas = dynamic(() => import("react-signature-canvas"), {
  ssr: false,
}) as unknown as typeof SignatureCanvasType;

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

interface Annotation {
  id: string;
  type: "signature" | "text";
  x: number;
  y: number;
  dataUrl?: string;
  text?: string;
}

function SignatureModal({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (dataUrl: string) => void;
}) {
  const sigRef = useRef<SignatureCanvasType>(null);
  const [inkColor, setInkColor] = useState(INK_COLORS[0]);

  function handleClear() {
    sigRef.current?.clear();
  }

  function handleAdd() {
    if (!sigRef.current || sigRef.current.isEmpty()) {
      toast.error("Please draw your signature first.");
      return;
    }
    onAdd(sigRef.current.toDataURL("image/png"));
    sigRef.current.clear();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg p-0 gap-0">
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
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
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
                  onClick={() => {
                    setInkColor(c);
                    (
                      sigRef.current as unknown as { penColor: string }
                    ).penColor = c;
                  }}
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
                <span className="text-base leading-none font-light">+</span>
                <span>Custom</span>
                <input
                  type="color"
                  className="w-0 h-0 opacity-0 absolute"
                  onChange={(e) => {
                    setInkColor(e.target.value);
                    (
                      sigRef.current as unknown as { penColor: string }
                    ).penColor = e.target.value;
                  }}
                />
              </label>
            </div>
          </div>

          <div className="relative rounded-lg border border-border bg-white overflow-hidden">
            <SignatureCanvas
              ref={sigRef}
              penColor={inkColor}
              canvasProps={{
                width: 480,
                height: 180,
                className: "w-full",
                style: { cursor: "crosshair" },
              }}
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

function DocContent({ fileType, name }: { fileType: string; name: string }) {
  const ft = fileType.toLowerCase();

  if (ft === "pdf") {
    return (
      <div className="absolute inset-0 font-sans overflow-hidden p-14">
        <h1 className="text-[26px] font-normal text-gray-400 mb-1">
          Sample PDF
        </h1>
        <p className="italic text-gray-600 mb-5 text-sm">
          This is a simple PDF file. Fun fun fun.
        </p>
        <p className="text-[11px] leading-relaxed text-gray-700 mb-4">
          <span className="text-red-600">Lorem ipsum</span> dolor sit amet,
          consectetuer adipiscing elit.{" "}
          <span className="text-blue-600">Phasellus facilisis</span> odio sed
          mi. Curabitur suscipit. Nullam vel nisi. Etiam semper ipsum ut lectus.{" "}
          <span className="text-orange-500">Proin aliquam</span>, erat eget
          pharetra commodo, eros mi condimentum quam, sed commodo justo quam ut
          velit. Integer a erat. Cras laoreet ligula cursus enim. Aenean
          scelerisque velit et tellus. Vestibulum dictum aliquet sem. Nulla
          facilisi. Vestibulum accumsan ante vitae elit. Nulla erat dolor,
          blandit in, rutrum quis, semper pulvinar, enim. Nullam varius congue
          risus.
        </p>
        <p className="text-[11px] leading-relaxed text-gray-700 mb-4">
          <span className="text-blue-700">Vivamus sollicitudin</span>, metus ut
          interdum eleifend, nisi tellus pellentesque elit, tristique accumsan
          eros quam et risus. Suspendisse libero odio, mattis sit amet, aliquet
          eget, hendrerit vel, nulla. Sed vitae augue. Aliquam erat volutpat.
          Aliquam feugiat vulputate nisl. Suspendisse quis nulla pretium ante
          pretium mollis. Proin velit ligula, sagittis at, egestas a, pulvinar
          quis, nisl.
        </p>
        <p className="text-[11px] leading-relaxed text-gray-700">
          <span className="text-green-700">Pellentesque</span> sit amet lectus.
          Praesent pulvinar, nunc quis iaculis sagittis, justo quam lobortis
          tortor, sed vestibulum dui metus venenatis est. Nunc cursus ligula.
          Nulla facilisi. Phasellus ullamcorper consectetuer ante. Duis
          tincidunt, urna id condimentum luctus, nibh ante vulputate sapien, id
          sagittis massa orci ut enim.
        </p>
      </div>
    );
  }
  if (ft === "png") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/sample/sample.png"
        alt={name}
        className="w-full object-contain"
      />
    );
  }
  if (ft === "jpg" || ft === "jpeg") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/sample/sample.jpg"
        alt={name}
        className="w-full object-contain"
      />
    );
  }

  return (
    <div className="absolute inset-0 font-sans text-gray-800 p-14">
      <p className="font-bold text-gray-900 text-2xl mb-1">{name}</p>
      <p className="text-gray-500 mb-6 italic text-sm">
        Microsoft Word Document
      </p>
      <div className="flex flex-col gap-2">
        {[
          "Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Phasellus facilisis odio sed mi.",
          "Curabitur suscipit. Nullam vel nisi. Etiam semper ipsum ut lectus.",
          "",
          "Proin aliquam, erat eget pharetra commodo, eros mi condimentum quam, sed commodo justo quam ut velit.",
          "Integer a erat. Cras laoreet ligula cursus enim. Aenean scelerisque velit et tellus.",
          "",
          "Vestibulum dictum aliquet sem. Nulla facilisi. Vestibulum accumsan ante vitae elit.",
          "Nulla erat dolor, blandit in, rutrum quis, semper pulvinar, enim.",
        ].map((line, i) =>
          line === "" ? (
            <div key={i} className="h-3" />
          ) : (
            <p key={i} className="text-gray-700 leading-relaxed text-sm">
              {line}
            </p>
          ),
        )}
      </div>
    </div>
  );
}

export function DocuSignPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const name = searchParams.get("name") ?? "Document";
  const fileType = searchParams.get("fileType") ?? "pdf";
  const back = searchParams.get("back") ?? "/operations/documents";

  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [signatureOpen, setSignatureOpen] = useState(false);
  const [textMode, setTextMode] = useState(false);
  const [zoom, setZoom] = useState(70);
  const [page, setPage] = useState(1);
  const docAreaRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{
    annId: string;
    startMouseX: number;
    startMouseY: number;
    startAnnX: number;
    startAnnY: number;
  } | null>(null);

  const docW = (595 * zoom) / 100;
  const docH = (842 * zoom) / 100;

  function handleDocClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!textMode) return;
    const scale = zoom / 100;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
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
      { id, type: "signature", x: 595 * 0.3, y: 842 * 0.65, dataUrl },
    ]);
    setSelectedId(id);
    toast.success("Signature added — drag to reposition");
  }

  function deleteSelected() {
    if (!selectedId) return;
    setAnnotations((prev) => prev.filter((a) => a.id !== selectedId));
    setSelectedId(null);
  }

  function onAnnMouseDown(e: React.MouseEvent, annId: string) {
    e.stopPropagation();
    e.preventDefault();
    setSelectedId(annId);
    const ann = annotations.find((a) => a.id === annId);
    if (!ann) return;
    dragState.current = {
      annId,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startAnnX: ann.x,
      startAnnY: ann.y,
    };
  }

  function onDocMouseMove(e: React.MouseEvent) {
    if (!dragState.current) return;
    const scale = zoom / 100;
    const { annId, startMouseX, startMouseY, startAnnX, startAnnY } =
      dragState.current;
    const dx = (e.clientX - startMouseX) / scale;
    const dy = (e.clientY - startMouseY) / scale;
    setAnnotations((prev) =>
      prev.map((a) =>
        a.id === annId ? { ...a, x: startAnnX + dx, y: startAnnY + dy } : a,
      ),
    );
  }

  function onDocMouseUp() {
    dragState.current = null;
  }

  return (
    <div className="fixed inset-0 bg-background flex flex-col overflow-hidden">
      {/* ── Top Nav ── */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-card shrink-0">
        <button
          onClick={() => router.push(back)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <p className="text-sm font-medium text-foreground truncate max-w-xs">
          {name}
        </p>
        <Button
          size="sm"
          className="h-8 text-xs gap-1.5"
          onClick={() => {
            toast.success("Document signed and saved.");
            router.push(back);
          }}
        >
          Save &amp; Sign
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left Sidebar ── */}
        <div className="w-48 shrink-0 border-r border-border bg-card flex flex-col overflow-y-auto">
          {/* ANNOTATIONS */}
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

          {/* TIPS */}
          <div className="px-4 py-4 bg-amber-50 dark:bg-amber-950/20 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-400 mb-2">
              Tips
            </p>
            {[
              { color: "#4361ee", text: "Click elements to select" },
              { color: "#f77f00", text: "Drag to reposition" },
              { color: "#2dc653", text: "Use handles to resize" },
              { color: "#6b7280", text: "Select then delete" },
            ].map((tip) => (
              <div key={tip.text} className="flex items-start gap-2 mb-1.5">
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
          {/* Page Nav + Zoom */}
          <div className="flex items-center justify-between px-5 py-2 border-b border-border bg-card shrink-0">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {[1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={cn(
                    "w-6 h-6 rounded text-xs font-medium transition-colors",
                    page === n
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted text-muted-foreground",
                  )}
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(p + 1, 4))}
                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <span className="text-xs text-muted-foreground ml-1 tabular-nums">
                {page} / 4
              </span>
            </div>

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
          </div>

          {/* Document Viewport */}
          <div
            className="flex-1 overflow-auto bg-[#525659]"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setSelectedId(null);
                setTextMode(false);
              }
            }}
            onMouseMove={onDocMouseMove}
            onMouseUp={onDocMouseUp}
          >
            <div
              className="flex items-start justify-center py-8 px-4"
              style={{ minWidth: `${docW + 64}px` }}
            >
              <div
                style={{
                  width: `${docW}px`,
                  height: `${docH}px`,
                  flexShrink: 0,
                }}
              >
                <div
                  ref={docAreaRef}
                  className="relative bg-white shadow-2xl select-none origin-top-left"
                  style={{
                    width: "595px",
                    minHeight: "842px",
                    transform: `scale(${zoom / 100})`,
                    cursor: textMode ? "crosshair" : "default",
                  }}
                  onClick={handleDocClick}
                >
                  <DocContent fileType={fileType} name={name} />

                  {annotations.map((ann) => (
                    <div
                      key={ann.id}
                      className={cn(
                        "absolute cursor-move select-none",
                        selectedId === ann.id &&
                          "ring-2 ring-primary ring-offset-1",
                      )}
                      style={{ left: `${ann.x}px`, top: `${ann.y}px` }}
                      onMouseDown={(e) => onAnnMouseDown(e, ann.id)}
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
                            width: "160px",
                            height: "60px",
                            objectFit: "contain",
                          }}
                          draggable={false}
                        />
                      )}
                      {ann.type === "text" && (
                        <span
                          className="border border-primary/50 px-1.5 py-0.5 text-primary bg-primary/5 rounded cursor-text text-sm"
                          contentEditable
                          suppressContentEditableWarning
                          onClick={(e) => e.stopPropagation()}
                          onBlur={(e) => {
                            const text = e.currentTarget.textContent ?? "";
                            setAnnotations((prev) =>
                              prev.map((a) =>
                                a.id === ann.id ? { ...a, text } : a,
                              ),
                            );
                          }}
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
      </div>

      <SignatureModal
        open={signatureOpen}
        onClose={() => setSignatureOpen(false)}
        onAdd={addSignature}
      />
    </div>
  );
}
