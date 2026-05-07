"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, RotateCcw, ArrowLeft } from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/src/components/ui/input-otp";
import { Button } from "@/src/components/ui/button";
import ThemeToggle from "@/src/components/themes/theme-toggle";
import { cn } from "@/src/lib/utils";

const TOTAL = 6;

const ForgotPasswordVerifyOtpIndex = () => {
  const router = useRouter();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState("");

  function handleVerify() {
    if (otp.length < TOTAL) return;
    setError("");
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.push("/auth/forgot-password/reset");
    }, 1200);
  }

  function handleResend() {
    setResending(true);
    setResent(false);
    setError("");
    setTimeout(() => {
      setResending(false);
      setResent(true);
    }, 1200);
  }

  return (
    <div
      className="relative min-h-screen flex items-center justify-end overflow-hidden"
      style={{
        backgroundImage: "url('/wife-bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "bottom",
      }}
    >
      <div className="absolute inset-0 bg-black/50 dark:bg-black/60" />

      {/* Left hero */}
      <div className="hidden md:flex flex-1 flex-col h-screen justify-start gap-6 px-14 pb-0 relative z-10">
        <div className="flex h-24 mt-auto items-center shrink-0">
          <Image
            src="/logo.png"
            alt="Motee HRIS"
            width={200}
            height={36}
            className="object-contain"
          />
        </div>
        <div className="flex flex-col gap-3 max-w-2xl">
          <h1>
            <span className="text-6xl text-white font-black">
              Check your inbox.
            </span>
          </h1>
          <div
            className="w-10 h-1 rounded-full"
            style={{ backgroundColor: "#D85A30" }}
          />
          <p className="text-xl text-white dark:text-white/80 leading-relaxed">
            We sent a 6-digit reset code to your email. Enter it below to
            continue resetting your password.
          </p>
        </div>
        <p className="text-[11px] text-white/30 py-8">
          © {new Date().getFullYear()} Motee Solutions
        </p>
      </div>

      {/* Floating card */}
      <div className="relative z-10 flex flex-col bg-card w-lg min-h-screen md:min-h-0 md:rounded-2xl md:shadow-2xl md:mr-16 md:my-10 overflow-hidden border border-border">
        {/* Card top bar */}
        <div className="flex items-center justify-between px-6 py-4">
          <div className="hidden md:block" />
          <div className="flex justify-end w-full">
            <ThemeToggle />
          </div>
        </div>

        {/* Card body */}
        <div className="flex flex-col items-center px-8 py-10 gap-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#D85A30]/10">
              <ShieldCheck className="h-7 w-7 text-[#D85A30]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                Enter reset code
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
              <p className="text-xs text-[#4ED251] text-center">
                A new code has been sent to your email.
              </p>
            )}
          </div>

          <Button
            size="lg"
            className="w-full font-semibold"
            style={{ backgroundColor: "#D85A30", borderColor: "#D85A30" }}
            disabled={otp.length < TOTAL || loading}
            onClick={handleVerify}
          >
            {loading ? "Verifying…" : "Verify Code"}
          </Button>

          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span>Didn&apos;t receive a code?</span>
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
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
          <ArrowLeft className="h-3.5 w-3.5" />
          <Link
            href="/auth/forgot-password"
            className="text-foreground font-semibold hover:underline"
          >
            Back
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordVerifyOtpIndex;
