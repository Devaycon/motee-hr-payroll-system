"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import ThemeToggle from "@/src/components/themes/theme-toggle";

const ForgotPasswordIndex = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    setError("");
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.push("/auth/forgot-password/verify-otp");
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
      <div className="hidden md:flex flex-1 flex-col h-screen justify-start gap-6 px-14 pb-10 relative z-14">
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
            <span className="text-3xl text-white font-black">
              Regain access in seconds.
            </span>
          </h1>
          <div
            className="w-10 h-1 rounded-full"
            style={{ backgroundColor: "#D85A30" }}
          />
          <p className="text-sm text-white dark:text-white/80 leading-relaxed">
            Enter your registered email and we&apos;ll send you a secure code to
            reset your password.
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
        <div className="flex flex-1 items-center justify-center px-8 pb-10">
          <div className="flex flex-col w-full gap-8">
            <div className="flex flex-col gap-1.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#D85A30]/10 mb-2">
                <Mail className="h-6 w-6 text-[#D85A30]" />
              </div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">
                Forgot your password?
              </h1>
              <p className="text-sm text-muted-foreground">
                No worries. Enter your email and we&apos;ll send you a reset
                code.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                />
                {error && (
                  <span className="text-xs text-destructive">{error}</span>
                )}
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={loading}
                className="w-full mt-1 font-semibold"
                style={{ backgroundColor: "#D85A30", borderColor: "#D85A30" }}
              >
                {loading ? "Sending code…" : "Send Reset Code"}
              </Button>
            </form>
          </div>
        </div>

        {/* Card footer */}
        <div className="flex items-center justify-center gap-1 px-6 py-4 text-xs text-muted-foreground border-t border-border">
          <ArrowLeft className="h-3.5 w-3.5" />
          <Link
            href="/auth/login"
            className="text-foreground font-semibold hover:underline"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordIndex;
