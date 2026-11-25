import api, { API_PREFIX } from "./api";
import type {
  AddEmployeeNoteResponse,
  DeleteEmployeeNoteResponse,
  EmployeeNoteRequest,
  GetEmployeeNotesResponse,
  PinEmployeeNoteParams,
  PinEmployeeNoteResponse,
  UpdateEmployeeNoteResponse,
} from "@/src/types/employee-notes";

export const employeeNotesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // GET /api/v1/employees/{employeeId}/notes
    getEmployeeNotes: builder.query<GetEmployeeNotesResponse, string>({
      query: (employeeId) => ({
        url: `${API_PREFIX}/employees/${employeeId}/notes`,
        method: "GET",
      }),
      providesTags: ["EmployeeNotes"],
    }),
    // POST /api/v1/employees/{employeeId}/notes
    addEmployeeNote: builder.mutation<AddEmployeeNoteResponse, { employeeId: string; body: EmployeeNoteRequest }>({
      query: ({ employeeId, body }) => ({
        url: `${API_PREFIX}/employees/${employeeId}/notes`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["EmployeeNotes"],
    }),
    // PUT /api/v1/employees/{employeeId}/notes/{noteId}
    updateEmployeeNote: builder.mutation<UpdateEmployeeNoteResponse, { employeeId: string; noteId: string; body: EmployeeNoteRequest }>({
      query: ({ employeeId, noteId, body }) => ({
        url: `${API_PREFIX}/employees/${employeeId}/notes/${noteId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["EmployeeNotes"],
    }),
    // DELETE /api/v1/employees/{employeeId}/notes/{noteId}
    deleteEmployeeNote: builder.mutation<DeleteEmployeeNoteResponse, { employeeId: string; noteId: string }>({
      query: ({ employeeId, noteId }) => ({
        url: `${API_PREFIX}/employees/${employeeId}/notes/${noteId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["EmployeeNotes"],
    }),
    // POST /api/v1/employees/{employeeId}/notes/{noteId}/pin
    pinEmployeeNote: builder.mutation<PinEmployeeNoteResponse, { employeeId: string; noteId: string; params?: PinEmployeeNoteParams }>({
      query: ({ employeeId, noteId, params }) => ({
        url: `${API_PREFIX}/employees/${employeeId}/notes/${noteId}/pin`,
        method: "POST",
        params: params ?? undefined,
      }),
      invalidatesTags: ["EmployeeNotes"],
    }),
  }),
});

export const {
  useGetEmployeeNotesQuery,
  useLazyGetEmployeeNotesQuery,
  useAddEmployeeNoteMutation,
  useUpdateEmployeeNoteMutation,
  useDeleteEmployeeNoteMutation,
  usePinEmployeeNoteMutation,
} = employeeNotesApi;
