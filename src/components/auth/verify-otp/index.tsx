"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, RotateCcw } from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/src/components/ui/input-otp";
import { Button } from "@/src/components/ui/button";
import ThemeToggle from "@/src/components/themes/theme-toggle";
import { cn, getApiErrorMessage } from "@/src/lib/utils";
import { useAppDispatch } from "@/src/lib/stores/hooks";
import { clearPendingAuth, readPendingEmail } from "@/src/lib/auth/pending";
import { landingPathForSession } from "@/src/lib/auth/session";
import { OTP_LENGTH, otpSchema } from "@/src/lib/validations/auth";
import {
  useResendOtpMutation,
  useVerifyOtpMutation,
} from "@/src/store/services/auth";
import { setCredentials } from "@/src/store/reducers/authSlice";

const TOTAL = OTP_LENGTH;

const VerifyOtpIndex = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [email] = useState(readPendingEmail);
  const [otp, setOtp] = useState("");
  const [resent, setResent] = useState(false);
  const [error, setError] = useState("");
  const [verifyOtp, { isLoading: loading }] = useVerifyOtpMutation();
  const [resendOtp, { isLoading: resending }] = useResendOtpMutation();

  async function handleVerify(code: string) {
    const parsed = otpSchema.safeParse({ email, code });
    if (!parsed.success) {
      setError(
        email
          ? parsed.error.issues[0].message
          : "We could not tell which account to verify. Please register again.",
      );
      return;
    }
    setError("");
    try {
      const { data: session } = await verifyOtp(parsed.data).unwrap();
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
      clearPendingAuth();
      router.push(
        landingPathForSession({
          tenant_id: session.tenantId,
          onboarding_completed: session.onboardingCompleted,
        }),
      );
    } catch (err) {
      setError(getApiErrorMessage(err, "That code is not valid."));
    }
  }

  async function handleResend() {
    setResent(false);
    setError("");
    try {
      await resendOtp({ email }).unwrap();
      setResent(true);
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not resend the code."));
    }
  }

  return (
    <div
      className="relative min-h-screen flex items-center justify-end overflow-hidden"
      style={{
        backgroundImage: "url('/login-bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/45 dark:bg-black/60" />

      {/* Left hero */}
      <div className="hidden md:flex h-screen flex-1 flex-col justify-start gap-6 px-14 relative z-10 pb-24">
        <div className="flex h-24 mt-auto items-center shrink-0">
          <Image
            src="/logo.png"
            alt="Motee HRIS"
            width={200}
            height={36}
            className="object-contain"
          />
        </div>
        <div className="flex flex-col gap-3 max-w-xl">
          <h1 className="text-3xl font-extrabold text-white leading-tight">
            One step away.
          </h1>
          <div className="w-10 h-1 rounded-full bg-white" />
          <p className="text-sm text-white leading-relaxed">
            We sent a verification code to your email. Enter it below to confirm
            your identity and activate your account.
          </p>
        </div>
        <p className="text-[11px] text-white pt-5">
          © {new Date().getFullYear()} Motee Solutions
        </p>
      </div>

      {/* Card */}
      <div className="relative py-5 z-10 flex flex-col w-lg h-fit rounded-2xl md:shadow-2xl md:mr-16 bg-card border border-border overflow-hidden">
        {/* Card top bar */}
        <div className="flex items-center justify-between px-6 py-4">
          <div className="hidden md:block" />
          <div className="flex justify-end w-full">
            <ThemeToggle />
          </div>
        </div>

        {/* Card body */}
        <div className="flex flex-col items-center px-8 pb-6 gap-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FE8F44]/10">
              <ShieldCheck className="h-7 w-7 text-[#FE8F44]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                Verify your email
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter the 6-digit code sent to your email address.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 w-full">
            <InputOTP
              maxLength={TOTAL}
              value={otp}
              onChange={(val) => {
                setOtp(val);
                setError("");
              }}
              onComplete={handleVerify}
            >
              <InputOTPGroup>
                {Array.from({ length: TOTAL }).map((_, i) => (
                  <InputOTPSlot
                    key={i}
                    index={i}
                    className={cn(
                      "size-12 text-lg font-bold",
                      error && "border-destructive",
                    )}
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>

            {error && (
              <p className="text-xs text-destructive text-center">{error}</p>
            )}

            {resent && (
              <p className="text-xs text-[#50D34C] text-center">
                A new code has been sent to your email.
              </p>
            )}
          </div>

          <Button
            size="lg"
            className="w-fit px-10 bg-[#FE8F44] hover:bg-[#FE8F44]/90 text-white"
            disabled={otp.length < TOTAL || loading}
            onClick={() => handleVerify(otp)}
          >
            {loading ? "Verifying…" : "Verify & Continue"}
          </Button>

          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span>Didn&apos;t receive a code?</span>
            <button
              type="button"
              onClick={handleResend}
              disabled={resending || !email}
              className="flex items-center gap-1 font-semibold text-foreground hover:underline disabled:opacity-50"
            >
              <RotateCcw
                className={cn("h-3.5 w-3.5", resending && "animate-spin")}
              />
              {resending ? "Resending…" : "Resend"}
            </button>
          </div>
        </div>

        {/* Card footer */}
        <div className="flex items-center justify-center gap-1 px-6 py-4 text-xs text-muted-foreground border-t border-border">
          <span>Wrong account?</span>
          <Link
            href="/auth/register"
            className="text-foreground font-semibold hover:underline"
          >
            Back to Register
          </Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtpIndex;
