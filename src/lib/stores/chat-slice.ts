import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  DEMO_CONTACTS,
  DEMO_MESSAGES,
  type Contact,
  type Message,
} from "@/src/data/chat-demo";

/**
 * The chat drawer used to keep its conversations in local state, so every
 * place that rendered a `ChatPanel` (the navbar, the community directory) got
 * its own disconnected copy. Holding it here means there is one drawer, opened
 * from anywhere via `openChat` / `startConversation`.
 */
interface ChatState {
  isOpen: boolean;
  /** Conversation being viewed; null shows the conversation list. */
  activeId: string | null;
  contacts: Contact[];
  messages: Record<string, Message[]>;
}

const initialState: ChatState = {
  isOpen: false,
  activeId: null,
  contacts: DEMO_CONTACTS,
  messages: DEMO_MESSAGES,
};

export interface ChatPerson {
  id: string;
  name: string;
  initials: string;
  role: string;
}

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    openChat(state) {
      state.isOpen = true;
    },
    closeChat(state) {
      state.isOpen = false;
    },
    selectConversation(state, action: PayloadAction<string | null>) {
      state.activeId = action.payload;
    },
    /**
     * Opens the drawer on a conversation with this person, creating an empty
     * one if none exists. Matches on name too, so demo threads seeded without
     * an employee id still resolve to the same conversation.
     */
    startConversation(state, action: PayloadAction<ChatPerson>) {
      const person = action.payload;
      const existing = state.contacts.find(
        (c) =>
          c.id === person.id ||
          c.name.toLowerCase() === person.name.toLowerCase(),
      );
      if (existing) {
        state.activeId = existing.id;
      } else {
        state.contacts.unshift({
          id: person.id,
          name: person.name,
          role: person.role,
          initials: person.initials,
          lastMessage: "",
          time: "",
          unread: 0,
          online: false,
        });
        state.messages[person.id] = [];
        state.activeId = person.id;
      }
      state.isOpen = true;
    },
    sendMessage(
      state,
      action: PayloadAction<{ contactId: string; message: Message }>,
    ) {
      const { contactId, message } = action.payload;
      (state.messages[contactId] ??= []).push(message);
      const idx = state.contacts.findIndex((c) => c.id === contactId);
      if (idx === -1) return;
      const [contact] = state.contacts.splice(idx, 1);
      contact.lastMessage = message.text || message.file?.name || "";
      contact.time = message.time;
      state.contacts.unshift(contact);
    },
  },
});

export const {
  openChat,
  closeChat,
  selectConversation,
  startConversation,
  sendMessage,
} = chatSlice.actions;
export default chatSlice.reducer;
