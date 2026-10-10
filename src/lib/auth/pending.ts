/**
 * Carries the email (and, for a password reset, the emailed code) between the
 * auth screens. Session storage rather than the URL so neither ends up in
 * browser history, and so a refresh mid-flow keeps its place.
 */
const EMAIL_KEY = "motee:auth:email";
const RESET_CODE_KEY = "motee:auth:resetCode";

function read(key: string): string {
  if (typeof window === "undefined") return "";
  try {
    return window.sessionStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

function write(key: string, value: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (value) window.sessionStorage.setItem(key, value);
    else window.sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export const readPendingEmail = () => read(EMAIL_KEY);
export const writePendingEmail = (email: string) => write(EMAIL_KEY, email);
export const readResetCode = () => read(RESET_CODE_KEY);
export const writeResetCode = (code: string) => write(RESET_CODE_KEY, code);

export function clearPendingAuth(): void {
  write(EMAIL_KEY, null);
  write(RESET_CODE_KEY, null);
}
