"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { clearAuthError, loginThunk } from "@/src/lib/stores/auth-slice";
import { landingPathForUser } from "@/src/lib/auth/landing";

export function LoginForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const authStatus = useAppSelector((s) => s.auth.status);
  const authError = useAppSelector((s) => s.auth.error);
  const localeStatus = useAppSelector((s) => s.locale.status);
  const tenantName = useAppSelector((s) => s.locale.data?.tenant.name);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    return () => {
      dispatch(clearAuthError());
    };
  }, [dispatch]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await dispatch(loginThunk({ email, password }));
    if (loginThunk.fulfilled.match(result)) {
      router.push(landingPathForUser(result.payload));
    }
  };

  const submitting = authStatus === "loading";
  const localeLoading = localeStatus === "loading" || localeStatus === "idle";

  return (
    <div className="flex flex-col w-full gap-8">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Welcome back
        </h1>
        <p className="text-sm text-muted-foreground">
          Access your MOTEE HRIS account
        </p>
      </div>

      <form onSubmit={handleSignIn} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            autoComplete="email"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
          />
          <Link
            href="/auth/forgot-password"
            className="text-[13px]  mt-1 text-muted-foreground hover:text-foreground hover:underline transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        {authError && (
          <p className="text-[13px] text-red-500" role="alert">
            {authError}
          </p>
        )}

        <Button
          type="submit"
          disabled={submitting || localeLoading || !email || !password}
          className="w-full mt-1 h-10 text-sm font-semibold"
          style={{ backgroundColor: "#D85A30", borderColor: "#D85A30" }}
        >
          {submitting ? "Signing in…" : "Login"}
        </Button>
        <p className="text-[11px] text-muted-foreground text-center">
          Tip: open the Demo Links button (bottom-right) to log in as any role.
        </p>
      </form>
    </div>
  );
}
