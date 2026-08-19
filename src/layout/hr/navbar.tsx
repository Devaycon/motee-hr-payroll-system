"use client";

import {
  Calendar,
  Bell,
  MessageSquare,
  Monitor,
  Award,
} from "lucide-react";
import { GlobalSearch } from "@/src/components/shared/global-search";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { User, LogOut } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import ThemeToggle from "@/src/components/themes/theme-toggle";
import { ChatPanel } from "@/src/components/shared/chat-panel";
import { NotificationsPanel } from "@/src/components/shared/notifications-panel";
import { ScreenShareModal } from "@/src/components/shared/screen-share-modal";
import { SendKudosModal } from "@/src/components/hr/kudos/components/send-kudos-modal";
import type { NewKudos } from "@/src/components/hr/kudos/types";
import { PersonAvatar } from "@/src/components/shared/person-avatar";
import { PortalModeToggle } from "@/src/components/shared/portal-mode-toggle";
import {
  useCurrentUser,
  DEMO_IDENTITY_PLACEHOLDER,
} from "@/src/lib/auth/demo-identity";

const formatDate = (date: Date) =>
  date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const formatTime = (date: Date) =>
  date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

const Navbar = () => {
  const [now, setNow] = useState(new Date());
  const router = useRouter();
  const [chatOpen, setChatOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [screenShareOpen, setScreenShareOpen] = useState(false);
  const [kudosOpen, setKudosOpen] = useState(false);
  // Same resolution as the self-service navbar, so switching portals never
  // looks like it switched who you are.
  const user = useCurrentUser();
  const adminName = user?.name ?? DEMO_IDENTITY_PLACEHOLDER.name;
  const adminInitials = user?.initials ?? DEMO_IDENTITY_PLACEHOLDER.initials;
  const adminSubtitle = user?.roleName ?? DEMO_IDENTITY_PLACEHOLDER.jobTitle;

  function handleSendKudos(data: NewKudos) {
    toast.success(`Kudos sent to ${data.recipientName}! 🌟`);
    setKudosOpen(false);
  }

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-20 flex h-18 items-center justify-between bg-sidebar border-b border-border px-6">
        <div className="flex items-center gap-3 flex-1 max-w-xs">
          <GlobalSearch />
        </div>

        <div className="flex items-center gap-3">
          <PortalModeToggle />

          <div className="flex items-center gap-3 bg-background border border-border rounded-lg px-3 py-2.5">
            <span className="flex items-center gap-2">
              <Calendar size={13} className="text-muted-foreground" />
              <span className="text-xs font-medium text-foreground">
                {formatDate(now)}
              </span>
            </span>
            {/* <span className="h-3.5 w-px bg-border" />
            <span className="flex items-center gap-2">
              <span className="text-xs font-medium text-foreground">
                {formatTime(now)}
              </span>
            </span> */}
          </div>

          <span data-tutorial="theme">
            <ThemeToggle />
          </span>

          <div className="flex items-center gap-3 border py-1 rounded-lg px-2 bg-card">
            <button
              data-tutorial="kudos"
              title="Send kudos"
              onClick={() => setKudosOpen(true)}
              className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-background border border-border text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <Award size={16} />
            </button>

            <button
              data-tutorial="chat"
              onClick={() => setChatOpen(true)}
              className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-background border border-border text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <MessageSquare size={16} />
              <span className="absolute -top-1 -right-1 flex min-w-5 h-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-white">
                4
              </span>
            </button>

            <button
              data-tutorial="screenshare"
              onClick={() => setScreenShareOpen(true)}
              className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-background border border-border text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <Monitor size={16} />
            </button>

            <button
              data-tutorial="notifications"
              onClick={() => setNotifOpen(true)}
              className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-background border border-border text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <Bell size={16} />
              <span className="absolute -top-1 -right-1 flex min-w-5 h-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-white">
                8
              </span>
            </button>
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <div
                data-tutorial="profile"
                className="cursor-pointer flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-2"
              >
                <PersonAvatar
                  name={adminName}
                  initials={adminInitials}
                  size="sm"
                  className="size-7"
                  fallbackClassName="bg-primary text-primary-foreground text-xs font-semibold"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-foreground leading-none">
                    {adminName}
                  </span>
                  <span className="text-[10px] text-muted-foreground leading-none mt-0.5">
                    {adminSubtitle}
                  </span>
                </div>
              </div>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-44 p-1.5">
              <button
                onClick={() => router.push("/admin/settings")}
                className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
              >
                <User size={14} />
               Company Profile
              </button>
              <button
                onClick={() => router.push("/auth/login")}
                className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut size={14} />
                Logout
              </button>
            </PopoverContent>
          </Popover>
        </div>
      </header>
      <ChatPanel isOpen={chatOpen} onClose={() => setChatOpen(false)} />
      <NotificationsPanel
        isOpen={notifOpen}
        onClose={() => setNotifOpen(false)}
      />
      <ScreenShareModal
        isOpen={screenShareOpen}
        onClose={() => setScreenShareOpen(false)}
      />
      <SendKudosModal
        open={kudosOpen}
        onClose={() => setKudosOpen(false)}
        onSave={handleSendKudos}
      />
    </>
  );
};

export default Navbar;
