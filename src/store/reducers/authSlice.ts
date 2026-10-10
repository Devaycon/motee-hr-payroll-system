import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { persistReducer } from "redux-persist";
import type { RootState } from "@/src/lib/stores/store";
import storage from "../sync_store";

/**
 * The API session — tokens and the ids the login response carries.
 *
 * Registered as `session`, not `auth`: the existing `auth` slice holds the
 * `AuthUser` identity every screen already reads, and stays that way.
 */
interface InitialState {
  token?: string;
  refresh_token?: string;
  expires_at?: string;
  user_id?: string;
  tenant_id?: string | null;
  onboarding_completed?: boolean;
  is_loggedIn: boolean;
}

const initialState: InitialState = {
  token: undefined,
  refresh_token: undefined,
  expires_at: undefined,
  user_id: undefined,
  tenant_id: undefined,
  onboarding_completed: undefined,
  is_loggedIn: false,
};

const authSlice = createSlice({
  name: "session",
  initialState,
  reducers: {
    logout: () => initialState,
    setCredentials: (
      state,
      action: PayloadAction<Omit<InitialState, "is_loggedIn">>,
    ) => ({
      ...state,
      ...action.payload,
      is_loggedIn: true,
    }),
    setOnboardingCompleted: (state, action: PayloadAction<boolean>) => ({
      ...state,
      onboarding_completed: action.payload,
    }),
  },
});

export const { logout, setCredentials, setOnboardingCompleted } =
  authSlice.actions;

export const selectCurrentUserToken = (state: RootState) => state.session.token;
export const selectCurrentUserRefreshToken = (state: RootState) =>
  state.session.refresh_token;
export const selectCurrentUserId = (state: RootState) => state.session.user_id;
export const selectCurrentTenantId = (state: RootState) =>
  state.session.tenant_id;
export const selectOnboardingCompleted = (state: RootState) =>
  state.session.onboarding_completed;
export const checkUserLoggedIn = (state: RootState) =>
  state.session.is_loggedIn;

const persistConfig = {
  key: "motee-session",
  storage,
};

export default persistReducer(persistConfig, authSlice.reducer);
