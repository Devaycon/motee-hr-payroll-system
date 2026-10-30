import api, { API_PREFIX } from "./api";
import type {
  CalendarEventRequest,
  CreateCalendarEventResponse,
  DeleteCalendarEventResponse,
  GetCalendarEventResponse,
  GetCalendarParams,
  GetCalendarResponse,
  GetUpcomingCalendarParams,
  GetUpcomingCalendarResponse,
  UpdateCalendarEventResponse,
} from "@/src/types/calendar";

const url = `${API_PREFIX}/calendar`;

export const calendarApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // ── Calendar ──
    getCalendar: builder.query<GetCalendarResponse, GetCalendarParams | void>({
      // employeeIds binds as a repeated key (?employeeIds=a&employeeIds=b);
      // fetchBaseQuery would join an array into one comma-separated value.
      query: (params) => {
        const { employeeIds, ...rest } = params ?? {};
        const search = new URLSearchParams();
        for (const [key, value] of Object.entries(rest)) {
          if (value != null) search.append(key, String(value));
        }
        employeeIds?.forEach((id) => search.append("employeeIds", id));
        const qs = search.toString();
        return { url: qs ? `${url}?${qs}` : url, method: "GET" };
      },
      providesTags: ["Calendar"],
    }),
    getUpcomingCalendar: builder.query<
      GetUpcomingCalendarResponse,
      GetUpcomingCalendarParams | void
    >({
      query: (params) => ({
        url: `${url}/upcoming`,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Calendar"],
    }),

    // ── Events ──
    createCalendarEvent: builder.mutation<
      CreateCalendarEventResponse,
      CalendarEventRequest
    >({
      query: (body) => ({
        url: `${url}/events`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Calendar"],
    }),
    getCalendarEvent: builder.query<GetCalendarEventResponse, string>({
      query: (id) => ({
        url: `${url}/events/${id}`,
        method: "GET",
      }),
      providesTags: ["Calendar"],
    }),
    updateCalendarEvent: builder.mutation<
      UpdateCalendarEventResponse,
      { id: string; body: CalendarEventRequest }
    >({
      query: ({ id, body }) => ({
        url: `${url}/events/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Calendar"],
    }),
    deleteCalendarEvent: builder.mutation<DeleteCalendarEventResponse, string>({
      query: (id) => ({
        url: `${url}/events/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Calendar"],
    }),
  }),
});

export const {
  useGetCalendarQuery,
  useGetUpcomingCalendarQuery,
  useCreateCalendarEventMutation,
  useGetCalendarEventQuery,
  useUpdateCalendarEventMutation,
  useDeleteCalendarEventMutation,
} = calendarApi;
