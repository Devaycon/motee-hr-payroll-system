import api, { API_PREFIX } from "./api";
import type {
  GetMyRemindersResponse,
} from "@/src/types/my-reminders";

export const myRemindersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/v1/my-reminders
    getMyReminders: builder.query<GetMyRemindersResponse, void>({
      query: () => ({
        url: `${API_PREFIX}/my-reminders`,
        method: "GET",
      }),
      providesTags: ["MyReminders"],
    }),
  }),
});

export const {
  useGetMyRemindersQuery,
  useLazyGetMyRemindersQuery,
} = myRemindersApi;
