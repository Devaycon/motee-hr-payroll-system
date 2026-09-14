import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type {
  NewShiftTemplate,
  ShiftAssignment,
  ShiftAssignmentStatus,
  ShiftTemplate,
} from "@/src/lib/types/shifts";

const DEFAULT_TEMPLATES: ShiftTemplate[] = [
  {
    id: "SHIFT-MORNING",
    name: "Morning Shift",
    startTime: "08:00",
    endTime: "16:00",
    breakMinutes: 30,
    color: "#7F77DD",
    workDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    createdAt: "2026-01-05",
  },
  {
    id: "SHIFT-AFTERNOON",
    name: "Afternoon Shift",
    startTime: "14:00",
    endTime: "22:00",
    breakMinutes: 30,
    color: "#1D9E75",
    workDays: ["Mon", "Tue", "Wed", "Thu", "Fri"],
    createdAt: "2026-01-05",
  },
  {
    id: "SHIFT-NIGHT",
    name: "Night Shift",
    startTime: "22:00",
    endTime: "06:00",
    breakMinutes: 30,
    color: "#5B5FEF",
    workDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    createdAt: "2026-01-05",
  },
  {
    id: "SHIFT-WEEKEND",
    name: "Weekend Cover",
    startTime: "10:00",
    endTime: "18:00",
    breakMinutes: 30,
    color: "#D97706",
    workDays: ["Sat", "Sun"],
    createdAt: "2026-01-05",
  },
];

interface ShiftsState {
  templates: ShiftTemplate[];
  assignments: ShiftAssignment[];
}

const initialState: ShiftsState = {
  templates: DEFAULT_TEMPLATES,
  assignments: [],
};

function nextId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

const shiftsSlice = createSlice({
  name: "shifts",
  initialState,
  reducers: {
    hydrate(state, action: PayloadAction<ShiftsState>) {
      state.templates = action.payload.templates?.length
        ? action.payload.templates
        : DEFAULT_TEMPLATES;
      state.assignments = action.payload.assignments ?? [];
    },
    addTemplate: {
      reducer(state, action: PayloadAction<ShiftTemplate>) {
        state.templates.push(action.payload);
      },
      prepare(input: NewShiftTemplate) {
        return {
          payload: {
            ...input,
            id: nextId("SHIFT"),
            createdAt: new Date().toISOString().slice(0, 10),
          } as ShiftTemplate,
        };
      },
    },
    updateTemplate(
      state,
      action: PayloadAction<{ id: string; patch: NewShiftTemplate }>,
    ) {
      const template = state.templates.find(
        (t) => t.id === action.payload.id,
      );
      if (template) Object.assign(template, action.payload.patch);
    },
    deleteTemplate(state, action: PayloadAction<string>) {
      state.templates = state.templates.filter(
        (t) => t.id !== action.payload,
      );
      state.assignments = state.assignments.filter(
        (a) => a.templateId !== action.payload,
      );
    },
    /** Assigns (or reassigns) one employee to one template on one date. */
    setAssignment(
      state,
      action: PayloadAction<{
        employeeId: string;
        date: string;
        templateId: string;
        note?: string;
      }>,
    ) {
      const { employeeId, date, templateId, note } = action.payload;
      const existing = state.assignments.find(
        (a) => a.employeeId === employeeId && a.date === date,
      );
      if (existing) {
        existing.templateId = templateId;
        existing.status = "scheduled";
        existing.note = note;
      } else {
        state.assignments.push({
          id: nextId("ASGN"),
          employeeId,
          date,
          templateId,
          status: "scheduled",
          note,
        });
      }
    },
    clearAssignment(
      state,
      action: PayloadAction<{ employeeId: string; date: string }>,
    ) {
      state.assignments = state.assignments.filter(
        (a) =>
          !(
            a.employeeId === action.payload.employeeId &&
            a.date === action.payload.date
          ),
      );
    },
    setAssignmentStatus(
      state,
      action: PayloadAction<{ id: string; status: ShiftAssignmentStatus }>,
    ) {
      const assignment = state.assignments.find(
        (a) => a.id === action.payload.id,
      );
      if (assignment) assignment.status = action.payload.status;
    },
  },
});

export const {
  hydrate,
  addTemplate,
  updateTemplate,
  deleteTemplate,
  setAssignment,
  clearAssignment,
  setAssignmentStatus,
} = shiftsSlice.actions;

export { DEFAULT_TEMPLATES };
export default shiftsSlice.reducer;
