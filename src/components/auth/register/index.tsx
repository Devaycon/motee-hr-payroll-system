import React from "react";
import Link from "next/link";
import { RegisterForm } from "@/src/components/auth/register-form";
import ThemeToggle from "@/src/components/themes/theme-toggle";

const RegisterIndex = () => {
  return (
    <div className="relative min-h-screen flex items-center justify-end overflow-hidden">
      {/* Video background with poster fallback while loading */}
      <video
        className="absolute inset-0 w-full h-full object-cover"
        src="https://videos.pexels.com/video-files/3195394/3195394-uhd_2560_1440_25fps.mp4"
        poster="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1920&q=80"
        autoPlay
        loop
        muted
        playsInline
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Left hero text */}
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

        <div className="flex flex-col gap-3 max-w-xl">
          <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight">
            Get started in minutes
          </h1>
          <div className="w-10 h-1 rounded-full bg-white" />
          <p className="text-sm text-white/60 leading-relaxed">
            Set up your organisation, configure workflows, and onboard your team
            — all from one powerful platform.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {[
            { step: "1", label: "Register your organisation" },
            { step: "2", label: "Configure your HR setup" },
            { step: "3", label: "Invite your team" },
            { step: "4", label: "Go live instantly" },
          ].map(({ step, label }) => (
            <div key={step} className="flex items-center gap-3">
              <div
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                style={{
                  backgroundColor: "rgba(216,90,48,0.4)",
                  border: "1px solid rgba(216,90,48,0.6)",
                }}
              >
                {step}
              </div>
              <span className="text-sm text-white/70">{label}</span>
            </div>
          ))}
        </div>

        <p className="text-[11px] text-white/30 mt-auto pt-10">
          © {new Date().getFullYear()} Motee Solutions
        </p>
      </div>

      {/* Floating card on the right */}
      <div
        className="relative z-10 flex flex-col w-lg h-fit rounded-2xl md:shadow-2xl md:mr-16 bg-white overflow-hidden"
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
          <RegisterForm />
        </div>

        {/* Card footer */}
        <div className="flex items-center justify-center gap-1 px-6 py-4 text-xs text-white/50">
          <span>Already have an account?</span>
          <Link
            href="/auth/login"
            className="text-white font-semibold hover:underline"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterIndex;
