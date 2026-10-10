import api, { API_PREFIX } from "./api";
import type { GetUsersResponse } from "@/src/types/users";

const url = `${API_PREFIX}/users`;

export const usersApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<GetUsersResponse, void>({
      query: () => ({
        url,
        method: "GET",
      }),
      providesTags: ["Users"],
    }),
  }),
});

export const { useGetUsersQuery } = usersApi;
