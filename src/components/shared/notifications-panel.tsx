"use client";

import { useState } from "react";
import {
  X,
  Bell,
  CheckCheck,
  Calendar,
  FileText,
  TrendingUp,
  AlertCircle,
  Info,
  ChevronLeft,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/src/lib/utils";
import type { Notification, NotifType } from "@/src/data/notifications-demo";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import {
  markAllRead as markAllReadAction,
  markRead as markReadAction,
} from "@/src/lib/stores/notifications-slice";

const typeConfig: Record<
  NotifType,
  { Icon: LucideIcon; color: string; bg: string }
> = {
  success: {
    Icon: CheckCheck,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  info: { Icon: Info, color: "text-blue-500", bg: "bg-blue-500/10" },
  warning: {
    Icon: AlertCircle,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  calendar: {
    Icon: Calendar,
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  file: { Icon: FileText, color: "text-primary", bg: "bg-primary/10" },
  trending: { Icon: TrendingUp, color: "text-teal-500", bg: "bg-teal-500/10" },
};

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationsPanel({
  isOpen,
  onClose,
}: NotificationsPanelProps) {
  // Backed by the store so features can raise notifications (§F11, §B7).
  const dispatch = useAppDispatch();
  const notifications = useAppSelector((s) => s.notifications.items);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [view, setView] = useState<"list" | "detail">("list");
  const [selectedNotif, setSelectedNotif] = useState<Notification | null>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filtered =
    filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  const markAllRead = () => dispatch(markAllReadAction());

  const openDetail = (notif: Notification) => {
    dispatch(markReadAction(notif.id));
    setSelectedNotif({ ...notif, read: true });
    setView("detail");
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-55 bg-black/20" onClick={onClose} />
      )}
      <div
        className={cn(
          "fixed top-0 right-0 z-60 flex h-screen w-90 flex-col bg-background border-l border-border shadow-2xl transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        {view === "list" ? (
          <>
            <div className="flex items-center justify-between px-4 py-4 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <span className="flex items-center justify-center min-w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold px-1.5">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] text-primary hover:opacity-80 transition-opacity font-medium"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="flex gap-1 px-4 pt-3 pb-3 shrink-0 border-b border-border">
              {(["all", "unread"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                    filter === tab
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent",
                  )}
                >
                  {tab === "all"
                    ? "All"
                    : `Unread${unreadCount > 0 ? ` (${unreadCount})` : ""}`}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 gap-2">
                  <Bell size={24} className="text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">
                    No unread notifications
                  </p>
                </div>
              ) : (
                filtered.map((notif) => {
                  const { Icon, color, bg } = typeConfig[notif.type];
                  return (
                    <button
                      key={notif.id}
                      onClick={() => openDetail(notif)}
                      className={cn(
                        "w-full flex items-start gap-3 px-4 py-4 text-left border-b border-border/40 last:border-0 transition-colors",
                        notif.read
                          ? "hover:bg-accent/40"
                          : "bg-primary/3 hover:bg-primary/6",
                      )}
                    >
                      <div
                        className={cn(
                          "flex items-center justify-center w-8 h-8 rounded-lg shrink-0 mt-0.5",
                          bg,
                        )}
                      >
                        <Icon size={14} className={color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p
                            className={cn(
                              "text-xs font-medium leading-snug",
                              notif.read
                                ? "text-foreground/70"
                                : "text-foreground",
                            )}
                          >
                            {notif.title}
                          </p>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                              {notif.time}
                            </span>
                            {!notif.read && (
                              <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                            )}
                          </div>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          {notif.description}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 px-4 py-4 border-b border-border shrink-0">
              <button
                onClick={() => {
                  setView("list");
                  setSelectedNotif(null);
                }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm font-semibold text-foreground flex-1">
                Notification Detail
              </span>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {selectedNotif &&
              (() => {
                const { Icon, color, bg } = typeConfig[selectedNotif.type];
                return (
                  <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-5 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/30">
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "flex items-center justify-center w-10 h-10 rounded-xl shrink-0",
                          bg,
                        )}
                      >
                        <Icon size={18} className={color} />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground leading-snug">
                          {selectedNotif.title}
                        </h3>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          {selectedNotif.date} · {selectedNotif.time}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-border" />

                    <p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-line">
                      {selectedNotif.detail}
                    </p>
                  </div>
                );
              })()}
          </>
        )}
      </div>
    </>
  );
}
