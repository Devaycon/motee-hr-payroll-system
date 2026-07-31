import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  DEMO_NOTIFICATIONS,
  type Notification,
  type NotifType,
} from "@/src/data/notifications-demo";

/**
 * The notification centre previously held `useState(DEMO_NOTIFICATIONS)` inside
 * the panel, so nothing in the app could raise a notification. Moving it into
 * the store gives features a `pushNotification` API — required for leave
 * notifications (§F11) and profile change-request notifications (§B7).
 */
interface NotificationsState {
  items: Notification[];
}

const initialState: NotificationsState = {
  items: DEMO_NOTIFICATIONS,
};

function uid(): string {
  return `NT-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

export interface PushNotificationPayload {
  title: string;
  description: string;
  detail?: string;
  type?: NotifType;
}

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    pushNotification(state, action: PayloadAction<PushNotificationPayload>) {
      const now = new Date();
      state.items.unshift({
        id: uid(),
        title: action.payload.title,
        description: action.payload.description,
        detail: action.payload.detail ?? action.payload.description,
        date: now.toLocaleDateString(undefined, {
          month: "long",
          day: "numeric",
          year: "numeric",
        }),
        time: now.toLocaleTimeString(undefined, {
          hour: "2-digit",
          minute: "2-digit",
        }),
        read: false,
        type: action.payload.type ?? "info",
      });
    },

    markRead(state, action: PayloadAction<string>) {
      const n = state.items.find((x) => x.id === action.payload);
      if (n) n.read = true;
    },

    markAllRead(state) {
      for (const n of state.items) n.read = true;
    },

    dismissNotification(state, action: PayloadAction<string>) {
      state.items = state.items.filter((n) => n.id !== action.payload);
    },
  },
});

export const { pushNotification, markRead, markAllRead, dismissNotification } =
  notificationsSlice.actions;

export default notificationsSlice.reducer;
