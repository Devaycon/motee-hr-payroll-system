import React from "react";
import Link from "next/link";
import { LoginForm } from "./login-form";
import ThemeToggle from "@/src/components/themes/theme-toggle";

const AuthIndex = () => {
  return (
    <div
      className="relative min-h-screen flex items-center justify-end overflow-hidden"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1920&q=80')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Left hero text — visible on md+ */}
      <div className="hidden md:flex flex-1 flex-col justify-center gap-6 px-14 py-16 relative z-10">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg font-bold text-sm text-white"
            style={{ backgroundColor: "rgba(255,255,255,0.25)" }}
          >
            M
          </div>
          <span className="text-white font-bold text-lg tracking-tight">
            Motee Solutions
          </span>
        </div>

        <div className="flex flex-col gap-3 max-w-lg">
          <h1 className="text-7xl font-extrabold text-white leading-tight">
            Welcome !
          </h1>
          <div
            className="w-10 h-1 rounded-full"
            style={{ backgroundColor: "#fff" }}
          />
          <p className="text-sm text-white/60 leading-relaxed">
            Streamline your people operations, automate payroll, and build a
            thriving workforce — all in one place.
          </p>
        </div>

        <Link
          href="/auth/register"
          className="self-start px-5 py-2 rounded-md border border-white/50 text-white text-sm font-medium hover:bg-white/10 transition-colors"
        >
          Learn more
        </Link>

        <p className="text-[11px] text-white/30 mt-auto pt-16">
          © {new Date().getFullYear()} Motee Solutions
        </p>
      </div>

      {/* Floating card on the right */}
      <div
        className="relative z-10 flex flex-col bg-white w-lg min-h-screen md:min-h-0 md:rounded-2xl md:shadow-2xl md:mr-16 md:my-10 overflow-hidden"
        // style={{
        //   background: "rgba(255,255,255,0.15)",
        //   backdropFilter: "blur(18px)",
        //   WebkitBackdropFilter: "blur(18px)",
        //   border: "1px solid rgba(255,255,255,0.25)",
        // }}
      >
        {/* Card top bar */}
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 md:hidden">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-md font-bold text-xs text-white"
              style={{ backgroundColor: "rgba(255,255,255,0.25)" }}
            >
              M
            </div>
            <span className="text-white font-bold text-base">
              Motee Solutions
            </span>
          </div>
          <div className="hidden md:block" />
          <ThemeToggle />
        </div>

        {/* Form area */}
        <div className="flex flex-1 items-center justify-center px-8 py-10">
          <LoginForm />
        </div>

        {/* Card footer */}
        <div className="flex items-center justify-center gap-1 px-6 py-4 text-xs text-white/50">
          <span>Don&apos;t have an account?</span>
          <Link
            href="/auth/register"
            className="text-white font-semibold hover:underline"
          >
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AuthIndex;
