import api, { API_PREFIX } from "./api";
import type { ApiResponse } from "@/src/types/api";
import type {
  CurrentUserData,
  ForgotPasswordRequest,
  LoginRequest,
  LoginResponse,
  MessageResponse,
  RegisterResponse,
  RegisterTenantRequest,
  ResendOtpRequest,
  ResetPasswordRequest,
  VerifyOtpRequest,
} from "@/src/types/auth";

const url = `${API_PREFIX}/auth`;

export const authApi = api.injectEndpoints({
  endpoints: (builder) => ({
    register: builder.mutation<RegisterResponse, RegisterTenantRequest>({
      query: (body) => ({
        url: `${url}/register`,
        method: "POST",
        body,
      }),
    }),
    verifyOtp: builder.mutation<LoginResponse, VerifyOtpRequest>({
      query: (body) => ({
        url: `${url}/verify-otp`,
        method: "POST",
        body,
      }),
    }),
    resendOtp: builder.mutation<MessageResponse, ResendOtpRequest>({
      query: (body) => ({
        url: `${url}/resend-otp`,
        method: "POST",
        body,
      }),
    }),
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: `${url}/login`,
        method: "POST",
        body: credentials,
      }),
    }),
    forgotPassword: builder.mutation<MessageResponse, ForgotPasswordRequest>({
      query: (body) => ({
        url: `${url}/forgot-password`,
        method: "POST",
        body,
      }),
    }),
    resetPassword: builder.mutation<MessageResponse, ResetPasswordRequest>({
      query: (body) => ({
        url: `${url}/reset-password`,
        method: "POST",
        body,
      }),
    }),
    logout: builder.mutation<MessageResponse, void>({
      query: () => ({
        url: `${url}/logout`,
        method: "POST",
      }),
    }),
    getCurrentUser: builder.query<ApiResponse<CurrentUserData>, void>({
      query: () => ({
        url: `${url}/me`,
        method: "GET",
      }),
      providesTags: ["CurrentUser"],
    }),
  }),
});

export const {
  useRegisterMutation,
  useVerifyOtpMutation,
  useResendOtpMutation,
  useLoginMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useLogoutMutation,
  useGetCurrentUserQuery,
} = authApi;
