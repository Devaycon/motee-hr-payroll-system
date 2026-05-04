"use client";

import { useRouter } from "next/navigation";
import { Building2, Users, User } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Separator } from "@/src/components/ui/separator";

const QUICK_ACCESS = [
  {
    label: "Motee Super Admin",
    icon: Building2,
    href: "/motee",
    accent: "#D85A30",
    border: "rgba(216,90,48,0.4)",
    hover: "rgba(216,90,48,0.08)",
  },
  {
    label: "HR Administrator — Acme Corp",
    icon: Users,
    href: "/hr",
    accent: "#7F77DD",
    border: "rgba(127,119,221,0.4)",
    hover: "rgba(127,119,221,0.08)",
  },
  {
    label: "Employee — James Adeyemi",
    icon: User,
    href: "/employee",
    accent: "#1D9E75",
    border: "rgba(29,158,117,0.4)",
    hover: "rgba(29,158,117,0.08)",
  },
];

export function LoginForm() {
  const router = useRouter();

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/hr");
  };

  return (
    <div className="flex flex-col w-full max-w-sm gap-8">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          Welcome back
        </h1>
        <p className="text-sm text-muted-foreground">
          Sign in to your Motee Solutions account
        </p>
      </div>

      <form onSubmit={handleSignIn} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            defaultValue="admin@moteesolutions.com"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" defaultValue="password" />
        </div>

        <Button
          type="submit"
          className="w-full mt-1 h-10 text-sm font-semibold"
          style={{ backgroundColor: "#D85A30", borderColor: "#D85A30" }}
        >
          Sign in
        </Button>
      </form>

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          or sign in as
        </span>
        <Separator className="flex-1" />
      </div>

      {/* <div className="flex flex-col gap-2.5">
        {QUICK_ACCESS.map((role) => {
          const Icon = role.icon;
          return (
            <button
              key={role.href}
              type="button"
              onClick={() => router.push(role.href)}
              className="flex items-center gap-3 rounded-lg px-4 h-11 text-sm font-medium transition-colors text-left cursor-pointer"
              style={{
                border: `1.5px solid ${role.border}`,
                color: role.accent,
                backgroundColor: "transparent",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = role.hover)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
            >
              <Icon size={15} strokeWidth={2} style={{ color: role.accent }} />
              {role.label}
            </button>
          );
        })}
      </div> */}
    </div>
  );
}
