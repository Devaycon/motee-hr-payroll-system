export type Contact = {
  id: string;
  name: string;
  role: string;
  initials: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
};

export type ChatFile = {
  name: string;
  size: string;
  mimeType: string;
  url?: string;
};

export type Message = {
  id: string;
  from: "me" | "them";
  text: string;
  time: string;
  file?: ChatFile;
};

export const DEMO_CONTACTS: Contact[] = [
  {
    id: "hr",
    name: "HR Team",
    role: "Human Resources",
    initials: "HR",
    lastMessage: "Also, here is the updated leave policy document.",
    time: "10:43 AM",
    unread: 2,
    online: true,
  },
  {
    id: "john",
    name: "John Adeyemi",
    role: "Finance Analyst",
    initials: "JA",
    lastMessage: "See you at the all-hands!",
    time: "Yesterday",
    unread: 0,
    online: false,
  },
  {
    id: "fatima",
    name: "Fatima Bello",
    role: "Product Designer",
    initials: "FB",
    lastMessage: "Can you review the Figma link?",
    time: "Yesterday",
    unread: 1,
    online: true,
  },
  {
    id: "sarah",
    name: "Sarah Johnson",
    role: "Frontend Engineer",
    initials: "SJ",
    lastMessage: "Thanks for the help!",
    time: "Mar 12",
    unread: 0,
    online: false,
  },
  {
    id: "mark",
    name: "Mark Williams",
    role: "Product Manager",
    initials: "MW",
    lastMessage: "Q2 roadmap update is ready.",
    time: "Mar 11",
    unread: 0,
    online: true,
  },
];

export const DEMO_MESSAGES: Record<string, Message[]> = {
  hr: [
    {
      id: "1",
      from: "them",
      text: "Hi, your leave request for Mar 20\u201324 has been reviewed.",
      time: "10:30 AM",
    },
    {
      id: "2",
      from: "them",
      text: "Please confirm if you still want to proceed.",
      time: "10:42 AM",
    },
    {
      id: "3",
      from: "them",
      text: "Also, here is the updated leave policy document.",
      time: "10:43 AM",
      file: {
        name: "Leave_Policy_2026.pdf",
        size: "245 KB",
        mimeType: "application/pdf",
      },
    },
  ],
  john: [
    {
      id: "1",
      from: "me",
      text: "Hey John, are you joining the all-hands tomorrow?",
      time: "Yesterday",
    },
    {
      id: "2",
      from: "them",
      text: "See you at the all-hands!",
      time: "Yesterday",
    },
  ],
  fatima: [
    {
      id: "1",
      from: "them",
      text: "Hey! Can you review the Figma link I sent over?",
      time: "Yesterday",
    },
  ],
  sarah: [
    { id: "1", from: "me", text: "No problem at all!", time: "Mar 12" },
    { id: "2", from: "them", text: "Thanks for the help!", time: "Mar 12" },
  ],
  mark: [
    {
      id: "1",
      from: "them",
      text: "Q2 roadmap update is ready. Let me know your thoughts.",
      time: "Mar 11",
    },
  ],
};
