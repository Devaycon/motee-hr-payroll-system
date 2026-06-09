"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, type LucideIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";

export interface LinkCardStat {
  label: string;
  value: string | number;
}

export interface LinkCardAction {
  label: string;
  href: string;
}

interface Props {
  icon?: LucideIcon;
  title: string;
  description: string;
  stats?: LinkCardStat[];
  actions: LinkCardAction[];
}

export function SettingsLinkCard({
  icon: Icon,
  title,
  description,
  stats,
  actions,
}: Props) {
  const router = useRouter();

  return (
    <Card className="border-0 shadow-sm ring-1 ring-border">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4.5 w-4.5 text-primary" />}
          <CardTitle className="text-base">{title}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {stats && stats.length > 0 && (
          <div className="flex flex-wrap gap-6">
            {stats.map((s) => (
              <div key={s.label} className="space-y-1">
                <p className="text-2xl font-semibold text-foreground">
                  {s.value}
                </p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {actions.map((a) => (
            <Button
              key={a.href}
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => router.push(a.href)}
            >
              {a.label}
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
