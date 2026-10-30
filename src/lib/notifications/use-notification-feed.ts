"use client";

import { useMemo } from "react";
import {
  DEMO_NOTIFICATIONS,
  isForRecipient,
  type Notification,
  type NotifType,
} from "@/src/data/notifications-demo";
import { useCurrentUser } from "@/src/lib/auth/demo-identity";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import {
  markAllRead as markAllReadAction,
  markRead as markReadAction,
} from "@/src/lib/stores/notifications-slice";
import {
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from "@/src/store/services/notifications";
import type { NotificationDto } from "@/src/types/notifications";

const TYPE_BY_KIND: Record<NotificationDto["kind"], NotifType> = {
  contractExpiring: "file",
  documentExpiring: "file",
  acknowledgementOutstanding: "file",
  timesheetDue: "calendar",
  openClockSession: "calendar",
  reviewOverdue: "trending",
  goalOverdue: "trending",
};

function toNotification(dto: NotificationDto): Notification {
  const at = new Date(dto.createdAt);
  return {
    id: dto.id,
    title: dto.title,
    description: dto.body,
    detail: dto.body,
    date: at.toLocaleDateString(undefined, {
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
    time: at.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    }),
    read: dto.read,
    type: dto.severity === "warning" ? "warning" : TYPE_BY_KIND[dto.kind] ?? "info",
    href: dto.href ?? undefined,
  };
}

const DEMO_IDS = new Set(DEMO_NOTIFICATIONS.map((n) => n.id));

/**
 * The notification centre's feed. Signed in, it is the server's notifications
 * plus anything a screen raised in this session through `pushNotification`;
 * the demo seeds are left out. Signed out, it is the store as before.
 */
export function useNotificationFeed() {
  const dispatch = useAppDispatch();
  const live = useAppSelector(
    (s) => s.session.is_loggedIn && !!s.session.tenant_id,
  );
  const local = useAppSelector((s) => s.notifications.items);
  const user = useCurrentUser();
  const server = useGetNotificationsQuery(undefined, {
    skip: !live,
    pollingInterval: 60_000,
  });
  const [markServerRead] = useMarkNotificationReadMutation();
  const [markServerAllRead] = useMarkAllNotificationsReadMutation();

  const notifications = useMemo(() => {
    // Targeted notifications reach only their recipient; untargeted ones still
    // reach everyone.
    const raised = local
      .filter((n) => !live || !DEMO_IDS.has(n.id))
      .filter((n) => isForRecipient(n, user?.employeeId, user?.roleId));
    if (!live) return raised;
    return [...raised, ...(server.data?.data ?? []).map(toNotification)];
  }, [local, live, server.data, user?.employeeId, user?.roleId]);

  const serverIds = useMemo(
    () => new Set((server.data?.data ?? []).map((n) => n.id)),
    [server.data],
  );

  return {
    notifications,
    markRead(id: string) {
      if (serverIds.has(id)) void markServerRead(id);
      else dispatch(markReadAction(id));
    },
    markAllRead() {
      dispatch(markAllReadAction());
      if (live && serverIds.size) void markServerAllRead();
    },
  };
}
