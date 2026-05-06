"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatedDotBackground } from "@/src/components/shared/animated-dot-background";
import ThemeToggle from "@/src/components/themes/theme-toggle";

export function MobileBlock() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (!isMobile) return null;

  return (
    <div className="fixed inset-0 z-99999 flex flex-col bg-background overflow-y-auto">
      <div className="absolute inset-0 pointer-events-none">
        <AnimatedDotBackground dotColor="#4361ee" />
        <div className="pointer-events-none absolute inset-0 bg-white mask-[radial-gradient(ellipse_at_center,transparent_20%,black)] dark:bg-black" />
      </div>

      <div className="relative z-10 flex items-center justify-between px-5 py-4">
        <Image
          src="/logo.png"
          alt="Motee Solutions"
          width={120}
          height={28}
          className="object-contain"
        />
        <ThemeToggle />
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-10 text-center gap-7">
        <div className="flex flex-col gap-2 max-w-xs">
          <h1 className="text-2xl font-bold text-foreground">Desktop Only</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This platform is designed for desktop use. For the best experience
            on mobile, download the official Motee app.
          </p>
        </div>

        <div className="flex flex-col items-center gap-2">
          <p className="text-xs text-muted-foreground">Scan to download</p>
          <div className="rounded-xl border border-border bg-white p-3 shadow-sm">
            <Image
              src="/qr-code.png"
              alt="Download Motee App"
              width={120}
              height={120}
              className="object-contain"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 w-fit">
          <a
            href="https://play.google.com/store"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 w-full rounded-xl border border-border bg-card px-4 py-3 shadow-sm hover:bg-accent transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-6 h-6 shrink-0" fill="none">
              <path
                d="M3.18 23.76c.3.17.65.19.97.07l12.93-7.47-2.93-2.93-10.97 10.33z"
                fill="#EA4335"
              />
              <path
                d="M22.54 10.27L19.4 8.48l-3.26 3.26 3.26 3.26 3.17-1.82a1.83 1.83 0 000-3.17v.06z"
                fill="#FBBC04"
              />
              <path
                d="M3.18.24a1.83 1.83 0 00-.97 1.65v20.22c0 .68.37 1.3.97 1.65L14.15 12 3.18.24z"
                fill="#4285F4"
              />
              <path
                d="M16.15 12l-2.93-2.93L3.18.24c.32-.12.67-.1.97.07L16.15 12z"
                fill="#34A853"
              />
            </svg>
            <div className="flex flex-col items-start">
              <span className="text-[10px] text-muted-foreground leading-none">
                Get it on
              </span>
              <span className="text-sm font-semibold text-foreground">
                Google Play
              </span>
            </div>
          </a>

          <a
            href="https://apps.apple.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 w-full rounded-xl border border-border bg-card px-4 py-3 shadow-sm hover:bg-accent transition-colors"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-6 h-6 shrink-0"
              fill="currentColor"
            >
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
            <div className="flex flex-col items-start">
              <span className="text-[10px] text-muted-foreground leading-none">
                Download on the
              </span>
              <span className="text-sm font-semibold text-foreground">
                App Store
              </span>
            </div>
          </a>
        </div>

        <p className="text-[10px] text-muted-foreground/50">
          © {new Date().getFullYear()} Motee Solutions
        </p>
      </div>
    </div>
  );
}
