"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useAppDispatch } from "@/src/lib/stores/hooks";
import { landingPathForSession } from "@/src/lib/auth/session";
import { getApiErrorMessage } from "@/src/lib/utils";
import { loginFormSchema, LoginFormType } from "@/src/lib/validations/auth";
import { useLoginMutation } from "@/src/store/services/auth";
import { setCredentials } from "@/src/store/reducers/authSlice";

export function LoginForm() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [login] = useLoginMutation();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormType>({
    resolver: zodResolver(loginFormSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values: LoginFormType) => {
    const result = await login(values);

    if (result.data?.success && result.data.data) {
      const session = result.data.data;

      dispatch(
        setCredentials({
          token: session.accessToken,
          refresh_token: session.refreshToken ?? undefined,
          expires_at: session.expiresAt,
          user_id: session.userId,
          tenant_id: session.tenantId,
          onboarding_completed: session.onboardingCompleted,
        }),
      );

      router.push(
        landingPathForSession({
          tenant_id: session.tenantId,
          onboarding_completed: session.onboardingCompleted,
        }),
      );
    } else {
      toast.error(
        getApiErrorMessage(
          result.error,
          result.data?.message ?? "Invalid email or password.",
        ),
      );
    }
  };

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

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@company.com"
            autoComplete="email"
            {...register("email")}
          />
          {errors.email && (
            <span className="text-xs text-destructive">
              {errors.email.message}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
              className="pr-9"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {errors.password && (
            <span className="text-xs text-destructive">
              {errors.password.message}
            </span>
          )}
          <Link
            href="/auth/forgot-password"
            className="text-[13px]  mt-1 text-muted-foreground hover:text-foreground hover:underline transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-1 h-10 text-sm font-semibold"
          style={{ backgroundColor: "#D85A30", borderColor: "#D85A30" }}
        >
          {isSubmitting ? "Signing in…" : "Login"}
        </Button>
        <p className="text-[11px] text-muted-foreground text-center">
          Tip: open the Demo Links button (bottom-right) to jump between the
          sign-up and account screens.
        </p>
      </form>
    </div>
  );
}
