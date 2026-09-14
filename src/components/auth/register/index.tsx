"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RegisterForm } from "@/src/components/auth/register-form";
import { CountrySwitcher } from "@/src/components/auth/country-switcher";
import ThemeToggle from "@/src/components/themes/theme-toggle";
import Image from "next/image";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { loadLocale } from "@/src/lib/stores/locale-slice";

const RegisterIndex = () => {
  const dispatch = useAppDispatch();
  const country = useAppSelector((s) => s.locale.country);

  useEffect(() => {
    dispatch(loadLocale(country));
  }, [country, dispatch]);

  return (
    <div
      className="relative min-h-screen flex items-center justify-end overflow-hidden"
      style={{
        backgroundImage: "url('/wife-and-daughter.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/45 dark:bg-black/60 light:bg-black/50" />

      {/* Left hero text */}
      <div className="hidden md:flex h-screen flex-1 flex-col justify-start gap-6 px-14 relative z-10 pb-24">
        <div className="flex h-24 mt-auto items-center shrink-0">
          <Image
            src="/logo.png"
            alt="Employee Portal"
            width={200}
            height={36}
            className="object-contain"
          />
        </div>

        <div className="flex flex-col gap-3 max-w-xl">
          <h1 className="text-3xl font-extrabold text-white leading-tight">
            Get started in minutes
          </h1>
          <div className="w-10 h-1 rounded-full bg-white" />
          <p className="text-sm text-white leading-relaxed">
            Set up your organisation, configure workflows, and onboard your team
            — all from one powerful platform.
          </p>
        </div>

        {/* <div className="flex flex-col gap-3">
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
              <span className="text-lg text-white">{label}</span>
            </div>
          ))}
        </div> */}

        <p className="text-[11px] text-white pt-5">
          © {new Date().getFullYear()} Motee Solutions
        </p>
      </div>

      {/* Floating card on the right */}
      <div className="relative py-5 z-10 flex flex-col w-lg h-fit rounded-2xl md:shadow-2xl md:mr-16 bg-card border border-border overflow-hidden">
        {/* Card top bar */}
        <div className="flex items-center justify-between px-6 py-4">
          <div className="hidden md:block" />
          <div className="flex justify-between w-full items-center gap-2">
            <CountrySwitcher />
            <ThemeToggle />
          </div>
        </div>

        {/* Form area */}
        <div className="flex flex-1 items-center justify-center pb-3">
          <RegisterForm />
        </div>

        {/* Card footer */}
        <div className="flex items-center justify-center gap-1 px-6 py-4 text-xs text-muted-foreground">
          <span>Already have an account?</span>
          <Link
            href="/auth/login"
            className="text-foreground font-semibold hover:underline"
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterIndex;
