import Link from "next/link";
import { Hourglass } from "lucide-react";
import { HOME_PATH } from "@/src/lib/auth/session";

/** Shown in place of a screen whose endpoints are not integrated yet. */
export function NotLive() {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-20">
      <div className="max-w-md flex flex-col items-center text-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Hourglass className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">
          Not available yet
        </h1>
        <p className="text-sm text-muted-foreground">
          This area is still being connected. It will appear in the menu as soon
          as it is ready.
        </p>
        <Link
          href={HOME_PATH}
          className="mt-2 inline-flex items-center justify-center h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
