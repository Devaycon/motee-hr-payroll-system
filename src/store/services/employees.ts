import api, { API_PREFIX } from "./api";
import { saveFileResponse, type DownloadedFile } from "./api/download";
import type {
  ChangeEmployeeStatusParams,
  ChangeEmployeeStatusResponse,
  CreateEmployeeResponse,
  DeleteEmployeeResponse,
  EmployeeImportRequest,
  EmployeeRequest,
  ExportEmployeesRequest,
  ExportEmployeesResponse,
  GetEmployeeExportColumnsResponse,
  GetEmployeeImportColumnsResponse,
  GetEmployeeInvitationsResponse,
  GetEmployeeMedicalResponse,
  GetEmployeeResponse,
  GetEmployeeStatsParams,
  GetEmployeeStatsResponse,
  GetEmployeesParams,
  GetEmployeesResponse,
  ImportEmployeesResponse,
  InviteEmployeeResponse,
  InviteRequest,
  ResendEmployeeInvitationResponse,
  RevokeEmployeeInvitationResponse,
  UpdateEmployeeParams,
  UpdateEmployeeResponse,
} from "@/src/types/employees";

const url = `${API_PREFIX}/employees`;

export const employeesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getEmployees: builder.query<
      GetEmployeesResponse,
      GetEmployeesParams | void
    >({
      query: (params) => ({
        url,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Employees"],
    }),
    createEmployee: builder.mutation<
      CreateEmployeeResponse,
      EmployeeRequest
    >({
      query: (body) => ({
        url,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Employees", "Departments", "Branches", "Onboarding", "Users", "Assets"],
    }),
    getEmployeeStats: builder.query<
      GetEmployeeStatsResponse,
      GetEmployeeStatsParams | void
    >({
      query: (params) => ({
        url: `${url}/stats`,
        method: "GET",
        params: params ?? undefined,
      }),
      providesTags: ["Employees"],
    }),
    exportEmployees: builder.mutation<
      ExportEmployeesResponse,
      ExportEmployeesRequest | void
    >({
      query: (body) => ({
        url: `${url}/export`,
        method: "POST",
        body: body ?? undefined,
      }),
    }),
    getEmployeeExportColumns: builder.query<
      GetEmployeeExportColumnsResponse,
      void
    >({
      query: () => ({
        url: `${url}/export/columns`,
        method: "GET",
      }),
      providesTags: ["Employees"],
    }),
    getEmployee: builder.query<
      GetEmployeeResponse,
      string
    >({
      query: (id) => ({
        url: `${url}/${id}`,
        method: "GET",
      }),
      providesTags: ["Employees"],
    }),
    deleteEmployee: builder.mutation<
      DeleteEmployeeResponse,
      string
    >({
      query: (id) => ({
        url: `${url}/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Employees", "Departments", "Branches", "Onboarding", "Users", "Assets"],
    }),
    updateEmployee: builder.mutation<
      UpdateEmployeeResponse,
      UpdateEmployeeParams
    >({
      query: ({ id, body }) => ({
        url: `${url}/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Employees", "Departments", "Branches", "Onboarding", "Users", "Assets"],
    }),
    getEmployeeMedical: builder.query<
      GetEmployeeMedicalResponse,
      string
    >({
      query: (id) => ({
        url: `${url}/${id}/medical`,
        method: "GET",
      }),
      providesTags: ["Employees"],
    }),
    changeEmployeeStatus: builder.mutation<
      ChangeEmployeeStatusResponse,
      ChangeEmployeeStatusParams
    >({
      query: ({ id, body }) => ({
        url: `${url}/${id}/status`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Employees", "Departments", "Branches", "Onboarding", "Users", "Assets"],
    }),
    inviteEmployee: builder.mutation<
      InviteEmployeeResponse,
      InviteRequest
    >({
      query: (body) => ({
        url: `${url}/invite`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Employees", "Departments", "Branches", "Onboarding", "Users", "Assets"],
    }),
    resendEmployeeInvitation: builder.mutation<
      ResendEmployeeInvitationResponse,
      string
    >({
      query: (id) => ({
        url: `${url}/${id}/invitation`,
        method: "POST",
      }),
      invalidatesTags: ["Employees", "Departments", "Branches", "Onboarding", "Users", "Assets"],
    }),
    revokeEmployeeInvitation: builder.mutation<
      RevokeEmployeeInvitationResponse,
      string
    >({
      query: (id) => ({
        url: `${url}/${id}/invitation`,
        method: "DELETE",
      }),
      invalidatesTags: ["Employees", "Departments", "Branches", "Onboarding", "Users", "Assets"],
    }),
    getEmployeeInvitations: builder.query<
      GetEmployeeInvitationsResponse,
      void
    >({
      query: () => ({
        url: `${url}/invitations`,
        method: "GET",
      }),
      providesTags: ["Employees"],
    }),
    getEmployeeImportColumns: builder.query<
      GetEmployeeImportColumnsResponse,
      void
    >({
      query: () => ({
        url: `${url}/import/columns`,
        method: "GET",
      }),
      providesTags: ["Employees"],
    }),
    importEmployees: builder.mutation<
      ImportEmployeesResponse,
      EmployeeImportRequest
    >({
      query: (body) => ({
        url: `${url}/import`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Employees", "Departments", "Branches", "Onboarding", "Users", "Assets"],
    }),
    downloadEmployeeImportTemplate: builder.mutation<DownloadedFile, void>({
      query: () => ({
        url: `${url}/import/template`,
        method: "GET",
        responseHandler: saveFileResponse("employee-import-template.xlsx"),
      }),
    }),
  }),
});

export const {
  useGetEmployeesQuery,
  useCreateEmployeeMutation,
  useGetEmployeeStatsQuery,
  useExportEmployeesMutation,
  useGetEmployeeExportColumnsQuery,
  useGetEmployeeQuery,
  useDeleteEmployeeMutation,
  useUpdateEmployeeMutation,
  useGetEmployeeMedicalQuery,
  useChangeEmployeeStatusMutation,
  useInviteEmployeeMutation,
  useResendEmployeeInvitationMutation,
  useRevokeEmployeeInvitationMutation,
  useGetEmployeeInvitationsQuery,
  useGetEmployeeImportColumnsQuery,
  useImportEmployeesMutation,
  useDownloadEmployeeImportTemplateMutation,
} = employeesApi;
