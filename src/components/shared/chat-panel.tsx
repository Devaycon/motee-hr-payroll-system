"use client";

import { useState, useRef } from "react";
import {
  X,
  ChevronLeft,
  Send,
  Search,
  Paperclip,
  Download,
  FileText,
  FileSpreadsheet,
  File,
  ImageIcon,
  Monitor,
} from "lucide-react";
import { cn } from "@/src/lib/utils";
import type { Message } from "@/src/data/chat-demo";
import { DEMO_CONTACTS, DEMO_MESSAGES } from "@/src/data/chat-demo";
import { ScreenShareModal } from "@/src/components/shared/screen-share-modal";

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  openToName?: string;
}

export function ChatPanel({ isOpen, onClose, openToName }: ChatPanelProps) {
  const resolvedContact = openToName
    ? DEMO_CONTACTS.find(
        (c) => c.name.toLowerCase() === openToName.toLowerCase(),
      )
    : undefined;

  const [view, setView] = useState<"list" | "chat">(
    resolvedContact ? "chat" : "list",
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    resolvedContact?.id ?? null,
  );
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [messages, setMessages] = useState(DEMO_MESSAGES);
  const [input, setInput] = useState("");
  const [screenShareOpen, setScreenShareOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedContact = DEMO_CONTACTS.find((c) => c.id === selectedId);
  const filteredContacts =
    filter === "unread"
      ? DEMO_CONTACTS.filter((c) => c.unread > 0)
      : DEMO_CONTACTS;
  const totalUnread = DEMO_CONTACTS.reduce((sum, c) => sum + c.unread, 0);

  const openChat = (id: string) => {
    setSelectedId(id);
    setView("chat");
  };

  const sendMessage = () => {
    if (!input.trim() || !selectedId) return;
    setMessages((prev) => ({
      ...prev,
      [selectedId]: [
        ...(prev[selectedId] || []),
        {
          id: Date.now().toString(),
          from: "me" as const,
          text: input.trim(),
          time: "Just now",
        },
      ],
    }));
    setInput("");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedId) return;
    const sizeStr =
      file.size < 1024 * 1024
        ? `${(file.size / 1024).toFixed(0)} KB`
        : `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
    const url = URL.createObjectURL(file);
    setMessages((prev) => ({
      ...prev,
      [selectedId]: [
        ...(prev[selectedId] || []),
        {
          id: Date.now().toString(),
          from: "me" as const,
          text: "",
          time: "Just now",
          file: { name: file.name, size: sizeStr, mimeType: file.type, url },
        },
      ],
    }));
    e.target.value = "";
  };

  const downloadFile = (msg: Message) => {
    if (!msg.file) return;
    if (msg.file.url) {
      const a = document.createElement("a");
      a.href = msg.file.url;
      a.download = msg.file.name;
      a.click();
    } else {
      const blob = new Blob([`Demo file: ${msg.file.name}`], {
        type: "text/plain",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = msg.file.name;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/"))
      return <ImageIcon size={13} className="shrink-0" />;
    if (
      mimeType.includes("sheet") ||
      mimeType.includes("excel") ||
      mimeType.includes("csv")
    )
      return <FileSpreadsheet size={13} className="shrink-0" />;
    if (mimeType.includes("word") || mimeType.includes("document"))
      return <FileText size={13} className="shrink-0" />;
    return <File size={13} className="shrink-0" />;
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-55 bg-black/20" onClick={onClose} />
      )}
      <div
        className={cn(
          "fixed top-0 right-0 z-60 flex h-screen w-100 flex-col bg-background border-l border-border shadow-2xl transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        {view === "list" ? (
          <>
            <div className="flex items-center justify-between px-4 py-4 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">
                  Messages
                </span>
                {totalUnread > 0 && (
                  <span className="flex items-center justify-center min-w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold px-1.5">
                    {totalUnread}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex gap-1 px-4 pt-3 pb-2 shrink-0">
              {(["all", "unread"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize",
                    filter === tab
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent",
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="px-4 pb-3 shrink-0">
              <div className="flex items-center gap-2 bg-accent/50 rounded-lg px-3 py-2">
                <Search size={13} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Search messages...
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30">
              {filteredContacts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40">
                  <p className="text-sm text-muted-foreground">
                    No unread messages
                  </p>
                </div>
              ) : (
                filteredContacts.map((contact) => (
                  <button
                    key={contact.id}
                    onClick={() => openChat(contact.id)}
                    className="w-full flex items-start gap-3 px-4 py-3.5 hover:bg-accent/50 transition-colors text-left border-b border-border/40 last:border-0"
                  >
                    <div className="relative shrink-0">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold">
                        {contact.initials}
                      </div>
                      {contact.online && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-background" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-medium text-foreground truncate">
                          {contact.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                          {contact.time}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p
                          className={cn(
                            "text-[11px] truncate",
                            contact.unread > 0
                              ? "text-foreground font-medium"
                              : "text-muted-foreground",
                          )}
                        >
                          {contact.lastMessage}
                        </p>
                        {contact.unread > 0 && (
                          <span className="flex items-center justify-center min-w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold px-1 ml-2 shrink-0">
                            {contact.unread}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {contact.role}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 px-4 py-4 border-b border-border shrink-0">
              <button
                onClick={() => setView("list")}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              {selectedContact && (
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="relative shrink-0">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-semibold">
                      {selectedContact.initials}
                    </div>
                    {selectedContact.online && (
                      <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border-2 border-background" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {selectedContact.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {selectedContact.online ? "Online" : "Offline"}
                    </p>
                  </div>
                </div>
              )}
              <button
                onClick={() => setScreenShareOpen(true)}
                className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
              >
                <Monitor size={16} />
              </button>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30">
              {selectedId &&
                (messages[selectedId] || []).map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex",
                      msg.from === "me" ? "justify-end" : "justify-start",
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[75%] rounded-2xl px-3 py-2",
                        msg.from === "me"
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-accent text-foreground rounded-bl-sm",
                      )}
                    >
                      {msg.text && (
                        <p className="text-xs leading-relaxed whitespace-pre-wrap">
                          {msg.text}
                        </p>
                      )}
                      {msg.file && (
                        <div
                          className={cn(
                            "flex items-center gap-2 rounded-lg px-2 py-1.5",
                            msg.text ? "mt-2" : "",
                            msg.from === "me"
                              ? "bg-white/10"
                              : "bg-background/60",
                          )}
                        >
                          <span
                            className={
                              msg.from === "me"
                                ? "text-primary-foreground/80"
                                : "text-muted-foreground"
                            }
                          >
                            {getFileIcon(msg.file.mimeType)}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-medium truncate">
                              {msg.file.name}
                            </p>
                            <p className="text-[9px] opacity-60">
                              {msg.file.size}
                            </p>
                          </div>
                          <button
                            onClick={() => downloadFile(msg)}
                            className={cn(
                              "shrink-0 hover:opacity-70 transition-opacity",
                              msg.from === "me"
                                ? "text-primary-foreground/80"
                                : "text-muted-foreground",
                            )}
                          >
                            <Download size={12} />
                          </button>
                        </div>
                      )}
                      <p
                        className={cn(
                          "text-[9px] mt-1",
                          msg.from === "me"
                            ? "text-primary-foreground/60"
                            : "text-muted-foreground",
                        )}
                      >
                        {msg.time}
                      </p>
                    </div>
                  </div>
                ))}
            </div>

            <div className="px-4 py-3 border-t border-border shrink-0">
              <div className="flex items-end gap-2 bg-accent/50 rounded-xl px-3 py-2.5">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-muted-foreground hover:text-foreground transition-colors shrink-0 pb-0.5"
                >
                  <Paperclip size={14} />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.txt"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Type a message... (Shift+Enter for new line)"
                  rows={1}
                  className="flex-1 text-xs bg-transparent outline-none text-foreground placeholder:text-muted-foreground resize-none max-h-24 overflow-y-auto leading-relaxed"
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim()}
                  className="text-primary hover:opacity-80 transition-opacity disabled:opacity-30 shrink-0 pb-0.5"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      <ScreenShareModal
        isOpen={screenShareOpen}
        onClose={() => setScreenShareOpen(false)}
        withName={selectedContact?.name}
      />
    </>
  );
}
