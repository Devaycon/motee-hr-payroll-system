import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getApiErrorMessage(
  err: unknown,
  fallback = "Something went wrong. Please try again."
): string {
  if (err && typeof err === "object") {
    const e = err as {
      status?: number | string
      data?:
        | { message?: string | null; errors?: Record<string, string[]> }
        | string
      error?: string
    }
    // A 401 comes back with an empty body, so `data` may be a string.
    if (e.data && typeof e.data === "object") {
      if (e.data.errors) {
        const messages = Object.values(e.data.errors).flat().join(" ")
        if (messages) return messages
      }
      if (e.data.message) return e.data.message
    }
    if (e.status === "FETCH_ERROR") {
      return "Could not reach the server. Check your connection and try again."
    }
    if (typeof e.status === "number") return fallback
    if (e.error) return e.error
  }
  return fallback
}
