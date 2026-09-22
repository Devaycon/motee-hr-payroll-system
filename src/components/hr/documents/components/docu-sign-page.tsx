"use client";

import { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { toast } from "sonner";
import type SignatureCanvasType from "react-signature-canvas";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
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
  Upload,
  FileUp,
  Download,
  FolderInput,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { cn } from "@/src/lib/utils";
import { useAppDispatch } from "@/src/lib/stores/hooks";
import { queueSignedDocument } from "@/src/lib/stores/docu-sign-slice";
import { recordOfferSigned } from "@/src/lib/stores/recruitment-slice";
import { pushNotification } from "@/src/lib/stores/notifications-slice";
import { offerSigned } from "@/src/lib/notifications/recruitment";

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

/** Reference size the on-screen document canvas is laid out at (A4 @ ~72dpi). */
const DOC_W = 595;
const DOC_H = 842;

const ACCEPTED_MIME_TYPES = ["application/pdf", "image/png", "image/jpeg"];

interface Annotation {
  id: string;
  type: "signature" | "text";
  x: number;
  y: number;
  dataUrl?: string;
  text?: string;
}

interface UploadedFile {
  name: string;
  mimeType: string;
  dataUrl: string;
  bytes: Uint8Array;
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(",")[1] ?? "";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function signedFileName(originalName: string, ext: string): string {
  const base = originalName.replace(/\.[^./]+$/, "");
  return `${base}-signed.${ext}`;
}

interface SignedFile {
  blob: Blob;
  fileName: string;
  fileType: "pdf" | "png" | "jpg";
}

/** Flattens the annotation overlay into the uploaded file itself. PDFs only get
 * annotations burned onto their first page — the editor doesn't track which
 * page an annotation belongs to. */
async function buildSignedFile(
  file: UploadedFile,
  annotations: Annotation[],
): Promise<SignedFile> {
  if (file.mimeType === "application/pdf") {
    const pdfDoc = await PDFDocument.load(file.bytes);
    const page = pdfDoc.getPage(0);
    const { width: pw, height: ph } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    for (const ann of annotations) {
      const px = (ann.x / DOC_W) * pw;
      const pyTop = (ann.y / DOC_H) * ph;
      if (ann.type === "signature" && ann.dataUrl) {
        const png = await pdfDoc.embedPng(dataUrlToBytes(ann.dataUrl));
        const w = (160 / DOC_W) * pw;
        const h = (60 / DOC_H) * ph;
        page.drawImage(png, { x: px, y: ph - pyTop - h, width: w, height: h });
      } else if (ann.type === "text" && ann.text) {
        const size = (14 / DOC_H) * ph;
        page.drawText(ann.text, {
          x: px,
          y: ph - pyTop - size,
          size,
          font,
          color: rgb(0.14, 0.2, 0.85),
        });
      }
    }

    const bytes = await pdfDoc.save();
    return {
      blob: new Blob([bytes as BlobPart], { type: "application/pdf" }),
      fileName: signedFileName(file.name, "pdf"),
      fileType: "pdf",
    };
  }

  // Image (PNG/JPG) — composite the annotations onto a canvas.
  const baseImg = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = file.dataUrl;
  });

  const canvas = document.createElement("canvas");
  canvas.width = baseImg.naturalWidth;
  canvas.height = baseImg.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported in this browser.");
  ctx.drawImage(baseImg, 0, 0);

  const scaleX = baseImg.naturalWidth / DOC_W;
  const scaleY = baseImg.naturalHeight / DOC_H;

  for (const ann of annotations) {
    if (ann.type === "signature" && ann.dataUrl) {
      const sigImg = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = ann.dataUrl!;
      });
      ctx.drawImage(
        sigImg,
        ann.x * scaleX,
        ann.y * scaleY,
        160 * scaleX,
        60 * scaleY,
      );
    } else if (ann.type === "text" && ann.text) {
      ctx.fillStyle = "#2141d1";
      ctx.font = `${14 * scaleY}px sans-serif`;
      ctx.fillText(ann.text, ann.x * scaleX, ann.y * scaleY + 14 * scaleY);
    }
  }

  const mime = file.mimeType === "image/png" ? "image/png" : "image/jpeg";
  const ext = mime === "image/png" ? "png" : "jpg";
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Failed to export image."))),
      mime,
      0.92,
    );
  });

  return { blob, fileName: signedFileName(file.name, ext), fileType: ext };
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

function UploadedDocContent({ file }: { file: UploadedFile }) {
  if (file.mimeType === "application/pdf") {
    return (
      <iframe
        src={file.dataUrl}
        title={file.name}
        className="absolute inset-0 w-full h-full border-0"
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={file.dataUrl}
      alt={file.name}
      className="absolute inset-0 w-full h-full object-contain bg-white"
    />
  );
}

function EmptyDocPlaceholder({ onUploadClick }: { onUploadClick: () => void }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center px-8">
      <Upload className="w-10 h-10 text-muted-foreground/40" />
      <p className="text-sm font-medium text-foreground">
        No document uploaded
      </p>
      <p className="text-xs text-muted-foreground max-w-[220px]">
        Upload a PDF, PNG, or JPG to start signing.
      </p>
      <Button
        size="sm"
        variant="outline"
        className="h-8 text-xs mt-1"
        onClick={onUploadClick}
      >
        <Upload className="mr-1.5 w-3.5 h-3.5" />
        Upload Document
      </Button>
    </div>
  );
}

export function DocuSignPageContent() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const existingName = searchParams.get("name");
  const fileType = searchParams.get("fileType") ?? "pdf";
  const back = searchParams.get("back") ?? "/operations/documents";
  // §15.2 — present when this sign link was generated for a recruitment
  // offer letter, so completing the signature can be captured back onto
  // that candidate's record rather than just downloaded and forgotten.
  const offerCandidateId = searchParams.get("offerCandidateId");
  const offerCountry = searchParams.get("offerCountry");
  const offerCandidateName = searchParams.get("offerCandidateName") ?? "The candidate";
  const offerRoleTitle = searchParams.get("offerRoleTitle") ?? "the role";

  // Opened from the sidebar with no document context — starts empty and lets
  // the user upload their own file. Opened from an existing document's "Sign"
  // action instead, `name` is present and uploading is locked to avoid
  // clobbering the document already loaded here.
  const isStandalone = !existingName;

  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const docName = uploadedFile?.name ?? existingName ?? "Untitled Document";
  const hasContent = isStandalone ? Boolean(uploadedFile) : true;

  const docW = (DOC_W * zoom) / 100;
  const docH = (DOC_H * zoom) / 100;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
      toast.error("Only PDF, PNG, or JPG files are supported.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast.error("File is too large (max 15MB).");
      return;
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    const dataUrl = await blobToDataUrl(file);
    setUploadedFile({ name: file.name, mimeType: file.type, dataUrl, bytes });
    setAnnotations([]);
    setSelectedId(null);
  }

  function removeUploadedFile() {
    setUploadedFile(null);
    setAnnotations([]);
    setSelectedId(null);
  }

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
      { id, type: "signature", x: DOC_W * 0.3, y: DOC_H * 0.65, dataUrl },
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

  function triggerDownload(blob: Blob, fileName: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function handleDownload() {
    if (!uploadedFile) return;
    setBusy(true);
    try {
      const signed = await buildSignedFile(uploadedFile, annotations);
      triggerDownload(signed.blob, signed.fileName);
      toast.success("Signed document downloaded.");
    } catch {
      toast.error("Could not generate the signed document.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveToCompliance() {
    if (!uploadedFile) return;
    setBusy(true);
    try {
      const signed = await buildSignedFile(uploadedFile, annotations);
      const dataUrl = await blobToDataUrl(signed.blob);
      dispatch(
        queueSignedDocument({
          id: `DSF-${Date.now()}`,
          name: signed.fileName,
          fileType: signed.fileType,
          fileSize: signed.blob.size,
          fileUrl: dataUrl,
          createdAt: new Date().toISOString(),
          createdBy: "HR Admin",
        }),
      );
      toast.success('Saved to Documents & Compliance → "docu-sign file"');
      router.push("/operations/documents");
    } catch {
      toast.error("Could not save the signed document.");
    } finally {
      setBusy(false);
    }
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
          {docName}
        </p>
        {isStandalone ? (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1.5"
              disabled={!uploadedFile || busy}
              onClick={handleDownload}
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </Button>
            <Button
              size="sm"
              className="h-8 text-xs gap-1.5"
              disabled={!uploadedFile || busy}
              onClick={handleSaveToCompliance}
            >
              <FolderInput className="w-3.5 h-3.5" />
              Save to Compliance
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => {
              // §15.2 — an offer-letter sign link captures the signature
              // back onto the candidate's record and files it into
              // Documents & Compliance, instead of the signing happening
              // somewhere outside the system.
              if (offerCandidateId && offerCountry) {
                dispatch(
                  recordOfferSigned({
                    country: offerCountry,
                    candidateId: offerCandidateId,
                  }),
                );
                dispatch(
                  queueSignedDocument({
                    id: `DSF-${Date.now()}`,
                    name: docName,
                    fileType: (fileType as "pdf" | "png" | "jpg") ?? "pdf",
                    fileSize: 0,
                    fileUrl: "",
                    createdAt: new Date().toISOString(),
                    createdBy: offerCandidateName,
                  }),
                );
                dispatch(
                  pushNotification(offerSigned(offerCandidateName, offerRoleTitle)),
                );
                toast.success("Offer letter signed and filed into Documents & Compliance.");
              } else {
                toast.success("Document signed and saved.");
              }
              router.push(back);
            }}
          >
            Save &amp; Sign
          </Button>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left Sidebar ── */}
        <div className="w-48 shrink-0 border-r border-border bg-card flex flex-col overflow-y-auto">
          {/* DOCUMENT */}
          <div className="px-4 pt-4 pb-4 border-b border-border flex flex-col gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
              Document
            </p>
            {isStandalone ? (
              uploadedFile ? (
                <button
                  onClick={removeUploadedFile}
                  className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-500/20 transition-colors text-left"
                >
                  <X className="w-3.5 h-3.5 shrink-0" />
                  Remove Document
                </button>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-muted/60 transition-colors text-left"
                >
                  <FileUp className="w-3.5 h-3.5 text-primary shrink-0" />
                  Upload PDF or Image
                </button>
              )
            ) : (
              <button
                disabled
                title="Upload is disabled while editing an existing document"
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foreground opacity-50 cursor-not-allowed text-left"
              >
                <FileUp className="w-3.5 h-3.5 shrink-0" />
                Upload PDF or Image
              </button>
            )}
            {isStandalone && (
              <p className="text-[10px] text-muted-foreground leading-tight">
                PDF, PNG, or JPG only.
              </p>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* ANNOTATIONS */}
          <div className="px-4 py-4 border-b border-border flex flex-col gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
              Annotations
            </p>
            <button
              onClick={() => setSignatureOpen(true)}
              disabled={!hasContent}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-muted/60 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            >
              <PenLine className="w-3.5 h-3.5 text-primary shrink-0" />
              Draw Signature
            </button>
            <button
              onClick={() => setTextMode((v) => !v)}
              disabled={!hasContent}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed",
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
            {isStandalone ? (
              <span className="text-xs text-muted-foreground tabular-nums">
                Page 1
              </span>
            ) : (
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
            )}

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
                    width: `${DOC_W}px`,
                    minHeight: `${DOC_H}px`,
                    transform: `scale(${zoom / 100})`,
                    cursor: textMode ? "crosshair" : "default",
                  }}
                  onClick={handleDocClick}
                >
                  {isStandalone ? (
                    uploadedFile ? (
                      <UploadedDocContent file={uploadedFile} />
                    ) : (
                      <EmptyDocPlaceholder
                        onUploadClick={() => fileInputRef.current?.click()}
                      />
                    )
                  ) : (
                    <DocContent fileType={fileType} name={docName} />
                  )}

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
