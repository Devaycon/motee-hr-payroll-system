"use client";

import { useEffect, useRef, useState } from "react";
import {
  Monitor,
  MonitorOff,
  X,
  Maximize2,
  Minimize2,
  Check,
  Users,
  Eye,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import { DEMO_CONTACTS } from "@/src/data/chat-demo";

interface ScreenShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  withName?: string;
}

export function ScreenShareModal({
  isOpen,
  onClose,
  withName,
}: ScreenShareModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const initialIds = withName
    ? DEMO_CONTACTS.filter((c) => c.name === withName).map((c) => c.id)
    : DEMO_CONTACTS.filter((c) => c.online).map((c) => c.id);

  const [status, setStatus] = useState<"requesting" | "sharing" | "error">(
    "requesting",
  );
  const [errorMsg, setErrorMsg] = useState("");
  const [isMaximized, setIsMaximized] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>(initialIds);

  const toggleParticipant = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    if (!navigator.mediaDevices?.getDisplayMedia) {
      const timer = setTimeout(() => {
        if (!cancelled) {
          setStatus("error");
          setErrorMsg(
            "Screen sharing is not supported in this browser or requires HTTPS.",
          );
        }
      }, 0);
      return () => {
        cancelled = true;
        clearTimeout(timer);
      };
    }

    navigator.mediaDevices
      .getDisplayMedia({ video: true, audio: false })
      .then((mediaStream) => {
        if (cancelled) {
          mediaStream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = mediaStream;
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setStatus("sharing");
        mediaStream.getVideoTracks()[0].onended = () => {
          streamRef.current = null;
          if (!cancelled) onCloseRef.current();
        };
      })
      .catch(() => {
        if (!cancelled) {
          setStatus("error");
          setErrorMsg("Permission was denied or screen sharing was cancelled.");
        }
      });

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [isOpen, retryKey]);

  const handleClose = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    onClose();
  };

  if (!isOpen) return null;

  const viewingContacts = DEMO_CONTACTS.filter((c) =>
    selectedIds.includes(c.id),
  );

  return (
    <div className="fixed inset-0 z-70 flex flex-col bg-background">
      <div className="flex items-center justify-between px-5 py-3 bg-sidebar border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10">
            <Monitor size={14} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground leading-none">
              {status === "sharing"
                ? "Sharing your screen"
                : status === "requesting"
                  ? "Requesting screen access..."
                  : "Screen share unavailable"}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {selectedIds.length === 0
                ? "No participants selected"
                : selectedIds.length === 1
                  ? `with ${viewingContacts[0]?.name ?? ""}`
                  : `with ${selectedIds.length} participants`}
            </p>
          </div>
          {status === "sharing" && (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] font-semibold text-red-500 tracking-wide">
                LIVE
              </span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {status === "sharing" && (
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent hover:bg-accent/70 text-muted-foreground hover:text-foreground transition-colors"
            >
              {isMaximized ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </button>
          )}

          <button
            onClick={handleClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/10 hover:bg-destructive/20 border border-destructive/20 text-destructive text-xs font-medium transition-colors"
          >
            <MonitorOff size={12} />
            Stop Sharing
          </button>

          <button
            onClick={handleClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent hover:bg-accent/70 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div
          className={cn(
            "flex-1 flex items-center justify-center p-6 bg-muted/30",
            isMaximized && "p-0",
          )}
        >
          {status === "sharing" && (
            <div
              className={cn(
                "relative rounded-xl overflow-hidden ring-1 ring-border shadow-xl bg-background",
                isMaximized ? "w-full h-full rounded-none" : "max-w-4xl w-full",
              )}
            >
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-contain"
              />
            </div>
          )}

          {status === "requesting" && (
            <div className="flex flex-col items-center gap-5 text-center">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Monitor size={32} className="text-primary animate-pulse" />
              </div>
              <div>
                <p className="text-foreground font-semibold text-sm">
                  Select a screen or window to share
                </p>
                <p className="text-muted-foreground text-xs mt-1.5 max-w-xs">
                  A browser prompt will appear asking you to choose what to
                  share. Select your screen or a specific application window.
                </p>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center gap-5 text-center">
              <div className="w-20 h-20 rounded-2xl bg-destructive/10 flex items-center justify-center">
                <MonitorOff size={32} className="text-destructive" />
              </div>
              <div>
                <p className="text-foreground font-semibold text-sm">
                  Could not start screen share
                </p>
                <p className="text-muted-foreground text-xs mt-1.5 max-w-xs">
                  {errorMsg}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setStatus("requesting");
                    setErrorMsg("");
                    setRetryKey((k) => k + 1);
                  }}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity"
                >
                  Try Again
                </button>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 rounded-lg bg-accent border border-border text-muted-foreground text-xs font-medium hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {!isMaximized && (
          <aside className="w-72 flex flex-col bg-sidebar border-l border-border shrink-0">
            <div className="flex items-center gap-2 px-4 py-3.5 border-b border-border shrink-0">
              <Users size={13} className="text-muted-foreground" />
              <span className="text-xs font-semibold text-foreground flex-1">
                Participants
              </span>
              {selectedIds.length > 0 && (
                <span className="flex items-center justify-center min-w-5 h-5 rounded-full bg-primary text-primary-foreground text-[9px] font-bold px-1.5">
                  {selectedIds.length}
                </span>
              )}
            </div>

            <p className="px-4 pt-3 pb-2 text-[10px] text-muted-foreground">
              Select who can view your shared screen
            </p>

            <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30">
              {DEMO_CONTACTS.map((contact) => {
                const isSelected = selectedIds.includes(contact.id);
                return (
                  <button
                    key={contact.id}
                    onClick={() => toggleParticipant(contact.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-border/40 last:border-0",
                      isSelected
                        ? "bg-primary/5 hover:bg-primary/8"
                        : "hover:bg-accent/50",
                    )}
                  >
                    <div className="relative shrink-0">
                      <div
                        className={cn(
                          "w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold transition-colors",
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "bg-primary/10 text-primary",
                        )}
                      >
                        {contact.initials}
                      </div>
                      {contact.online && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-sidebar" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "text-xs font-medium truncate",
                          isSelected ? "text-foreground" : "text-foreground/80",
                        )}
                      >
                        {contact.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {contact.role}
                      </p>
                      {isSelected && status === "sharing" && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Eye size={9} className="text-primary" />
                          <span className="text-[9px] text-primary font-medium">
                            Viewing
                          </span>
                        </div>
                      )}
                    </div>

                    <div
                      className={cn(
                        "flex items-center justify-center w-5 h-5 rounded-full border-2 shrink-0 transition-colors",
                        isSelected
                          ? "bg-primary border-primary"
                          : "border-border bg-transparent",
                      )}
                    >
                      {isSelected && (
                        <Check size={10} className="text-primary-foreground" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedIds.length > 0 && (
              <div className="px-4 py-3 border-t border-border shrink-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-muted-foreground font-medium">
                    Sharing with
                  </span>
                  <button
                    onClick={() => setSelectedIds([])}
                    className="text-[10px] text-destructive hover:opacity-70 transition-opacity"
                  >
                    Remove all
                  </button>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {viewingContacts.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20"
                    >
                      <span className="text-[9px] font-medium text-primary">
                        {c.initials}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedIds.length === 0 && (
              <div className="px-4 py-3 border-t border-border">
                <p className="text-[10px] text-muted-foreground text-center">
                  No participants selected
                </p>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
