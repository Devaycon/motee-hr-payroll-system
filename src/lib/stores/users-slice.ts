import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type {
  UserAccountOverride,
  UserAccountState,
} from "@/src/lib/types/users";

/**
 * §4.14 — account-level overrides layered on top of the locale bundle's roles.
 *
 * Follows the same shape as `employees-slice`: the bundle is read-only fixture
 * data, so every administrative action is recorded here and merged back in when
 * the Users table is built.
 */
interface UsersState {
  /** roleId → whatever an admin has done to that account. */
  overrides: Record<string, UserAccountOverride>;
}

const initialState: UsersState = {
  overrides: {},
};

function nowIso(): string {
  return new Date().toISOString();
}

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    hydrate(state, action: PayloadAction<Record<string, UserAccountOverride>>) {
      if (action.payload && typeof action.payload === "object") {
        state.overrides = action.payload;
      }
    },

    /** Lock / unlock / restrict / revoke. */
    setAccountState(
      state,
      action: PayloadAction<{
        userId: string;
        accountState: UserAccountState;
        reason?: string;
        actorName: string;
      }>,
    ) {
      const { userId, accountState, reason, actorName } = action.payload;
      const existing = state.overrides[userId] ?? {};
      state.overrides[userId] = {
        ...existing,
        state: accountState,
        // Unlocking clears the old reason — leaving "Suspected phishing" on a
        // restored account is how stale notes become permanent records.
        reason: accountState === "active" ? undefined : reason,
        changedAt: nowIso(),
        changedBy: actorName,
      };
    },

    /**
     * Force a password reset. This does not change the account state: a locked
     * account stays locked, and resetting is not a way to quietly unlock one.
     */
    resetPassword(
      state,
      action: PayloadAction<{ userId: string; actorName: string }>,
    ) {
      const { userId, actorName } = action.payload;
      const existing = state.overrides[userId] ?? {};
      state.overrides[userId] = {
        ...existing,
        passwordResetAt: nowIso(),
        mustChangePassword: true,
        changedBy: actorName,
      };
    },

    /** §1.13 — set every access level this account holds, primary first. */
    setAccountRoles(
      state,
      action: PayloadAction<{
        userId: string;
        accessLevelIds: string[];
        actorName: string;
      }>,
    ) {
      const { userId, accessLevelIds, actorName } = action.payload;
      const ids = [...new Set(accessLevelIds.filter(Boolean))];
      if (ids.length === 0) return;
      const existing = state.overrides[userId] ?? {};
      state.overrides[userId] = {
        ...existing,
        accessLevelIds: ids,
        changedAt: nowIso(),
        changedBy: actorName,
      };
    },
  },
});

export const { hydrate, setAccountState, resetPassword, setAccountRoles } =
  usersSlice.actions;
export default usersSlice.reducer;
export type { UsersState };
