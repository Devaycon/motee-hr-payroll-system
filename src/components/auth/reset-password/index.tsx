"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { KeyRound, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import ThemeToggle from "@/src/components/themes/theme-toggle";

const ResetPasswordIndex = () => {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.push("/auth/login");
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
              Almost there.
            </span>
          </h1>
          <div
            className="w-10 h-1 rounded-full"
            style={{ backgroundColor: "#D85A30" }}
          />
          <p className="text-xl text-white dark:text-white/80 leading-relaxed">
            Create a new strong password to secure your Motee account and get
            back to work.
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
                <KeyRound className="h-6 w-6 text-[#D85A30]" />
              </div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                Set new password
              </h1>
              <p className="text-sm text-muted-foreground">
                Your new password must be at least 8 characters long.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min. 8 characters"
                    className="pr-9"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="confirm">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirm"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Repeat password"
                    className="pr-9"
                    value={confirm}
                    onChange={(e) => {
                      setConfirm(e.target.value);
                      setError("");
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {error && (
                <span className="text-xs text-destructive">{error}</span>
              )}

              <Button
                type="submit"
                size="lg"
                disabled={loading}
                className="w-full mt-1 font-semibold"
                style={{ backgroundColor: "#D85A30", borderColor: "#D85A30" }}
              >
                {loading ? "Saving…" : "Reset Password"}
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

export default ResetPasswordIndex;
