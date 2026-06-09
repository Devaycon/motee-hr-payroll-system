import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { AuthUser, LocaleBundle } from "@/src/lib/types/locale";
import type { RootState } from "./store";


export type AuthStatus = "idle" | "loading" | "authenticated" | "error";

interface AuthState {
  user: AuthUser | null;
  status: AuthStatus;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  status: "idle",
  error: null,
};

function buildUser(bundle: LocaleBundle, roleId: string): AuthUser | null {
  const role = bundle.roles.find((r) => r.id === roleId);
  if (!role) return null;
  const employee =
    bundle.employees.find((e) => e.id === role.linkedEmployeeId) ?? null;
  return {
    roleId: role.id,
    roleName: role.name,
    accessLevelId: role.linkedAccessLevelId,
    name: employee?.fullName ?? role.name,
    email: role.credentials.email,
    employeeId: role.linkedEmployeeId,
    initials: employee?.initials ?? role.name.slice(0, 2).toUpperCase(),
    jobTitle: employee?.jobTitle ?? role.name,
    departmentName: employee?.departmentName ?? "",
  };
}

interface LoginArgs {
  email: string;
  password: string;
}

export const loginThunk = createAsyncThunk<
  AuthUser,
  LoginArgs,
  { state: RootState; rejectValue: string }
>("auth/login", async ({ email, password }, { getState, rejectWithValue }) => {
  const bundle = getState().locale.data;
  if (!bundle) return rejectWithValue("Locale data not loaded");
  const normalized = email.trim().toLowerCase();
  const role = bundle.roles.find(
    (r) =>
      r.credentials.email.toLowerCase() === normalized &&
      r.credentials.password === password,
  );
  if (!role) return rejectWithValue("Invalid email or password");
  const user = buildUser(bundle, role.id);
  if (!user) return rejectWithValue("Account not provisioned");
  return user;
});

export const loginAsRoleThunk = createAsyncThunk<
  AuthUser,
  string,
  { state: RootState; rejectValue: string }
>("auth/loginAsRole", async (roleId, { getState, rejectWithValue }) => {
  const bundle = getState().locale.data;
  if (!bundle) return rejectWithValue("Locale data not loaded");
  const user = buildUser(bundle, roleId);
  if (!user) return rejectWithValue("Role not found");
  return user;
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.status = "idle";
      state.error = null;
    },
    clearAuthError(state) {
      state.error = null;
    },
    setUser(state, action: PayloadAction<AuthUser>) {
      state.user = action.payload;
      state.status = "authenticated";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.status = "authenticated";
        state.user = action.payload;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.status = "error";
        state.error = action.payload ?? "Login failed";
      })
      .addCase(loginAsRoleThunk.fulfilled, (state, action) => {
        state.status = "authenticated";
        state.user = action.payload;
        state.error = null;
      })
      .addCase(loginAsRoleThunk.rejected, (state, action) => {
        state.status = "error";
        state.error = action.payload ?? "Login failed";
      });
  },
});

export const { logout, clearAuthError, setUser } = authSlice.actions;
export default authSlice.reducer;
