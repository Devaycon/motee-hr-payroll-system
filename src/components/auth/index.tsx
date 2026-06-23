"use client";

import { useEffect } from "react";
import Link from "next/link";
import { LoginForm } from "./login-form";
import ThemeToggle from "@/src/components/themes/theme-toggle";
import { cn } from "@/src/lib/utils";
import Image from "next/image";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import { loadLocale, setCountry } from "@/src/lib/stores/locale-slice";
import type { CountryKey } from "@/src/lib/types/locale";

const AuthIndex = () => {
  const dispatch = useAppDispatch();
  const country = useAppSelector((s) => s.locale.country);

  useEffect(() => {
    dispatch(loadLocale(country));
  }, [country, dispatch]);

  return (
    <div
      className="relative min-h-screen flex items-center justify-end overflow-hidden"
      style={{
        backgroundImage: "url('/wife-bg-v2.png')",
        backgroundSize: "cover",
        backgroundPosition: "bottom",
      }}
    >
      <div className="absolute inset-0 bg-black/50 dark:bg-black/60 light:bg-black/50" />

      {/* Left hero text — visible on md+ */}
      <div className="hidden md:flex flex-1 flex-col h-screen justify-start gap-6 px-14 pb-0 relative z-10">
        <div className="flex h-24 mt-auto  items-center shrink-0">
          <Image
            src="/logo.png"
            alt="Employee Portal"
            width={200}
            height={36}
            className="object-contain"
          />
        </div>

        <div className="flex flex-col gap-3 max-w-2xl">
          <h1>
            <span className="text-3xl text-white font-black">
              Welcome to MOTEE HRIS
            </span>
          </h1>
          <div
            className="w-10 h-1 rounded-full"
            style={{ backgroundColor: "#D85A30" }}
          />
          <p className="text-sm text-white dark:text-white/80 leading-relaxed">
            Sign in to manage your team, track performance, and access your
            professional tools in one secure place.
          </p>
        </div>

        <Link
          href="https://motee-solutions.vercel.app/"
          
          className="self-start px-5 py-2 rounded-md border border-white/50 bg-white text-gray-900  text-sm font-medium hover:bg-white/90 transition-colors"
        >
          Visit Website
        </Link>

        <p className="text-[11px] text-white/30 py-8">
          © {new Date().getFullYear()} Motee Solutions
        </p>
      </div>

      {/* Floating card on the right */}
      <div className="relative z-10 flex flex-col bg-card w-lg min-h-screen md:min-h-0 md:rounded-2xl md:shadow-2xl md:mr-16 md:my-10 overflow-hidden border border-border">
        {/* Card top bar */}
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 md:hidden">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-md font-bold text-xs text-white"
              style={{ backgroundColor: "#D85A30" }}
            >
              M
            </div>
            <span className="text-foreground font-bold text-base">
              Motee Solutions
            </span>
          </div>
          <div className="hidden md:block" />
          <div className="flex w-full justify-between items-center gap-2">
            <div className="flex items-center rounded-full border border-border bg-muted p-0.5 gap-0.5">
              {(["uk", "ng"] as const).map((key: CountryKey) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => dispatch(setCountry(key))}
                  title={key === "uk" ? "United Kingdom" : "Nigeria"}
                  className={cn(
                    "flex items-center justify-center w-8 h-7 rounded-full transition-all duration-150 cursor-pointer",
                    country === key
                      ? "bg-card shadow-sm"
                      : "opacity-50 hover:opacity-100",
                  )}
                >
                  <Image
                    src={
                      key === "uk"
                        ? "/united-kingdom-flag-icon.png"
                        : "/nigeria-flag-icon.png"
                    }
                    alt={key === "uk" ? "United Kingdom" : "Nigeria"}
                    width={22}
                    height={16}
                    className="rounded-[3px] object-cover"
                  />
                </button>
              ))}
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* Form area */}
        <div className="flex flex-1 items-center justify-center px-8 py-10">
          <LoginForm />
        </div>

        {/* Card footer */}
        <div className="flex items-center justify-center gap-1 px-6 py-4 text-xs text-muted-foreground">
          <span>Don&apos;t have an account?</span>
          <Link
            href="/auth/register"
            className="text-foreground font-semibold hover:underline"
          >
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AuthIndex;
