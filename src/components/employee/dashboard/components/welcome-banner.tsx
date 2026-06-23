"use client";

interface WelcomeBannerProps {
  name: string;
  dayName: string;
  dateStr: string;
}

export function WelcomeBanner({ name, dayName, dateStr }: WelcomeBannerProps) {
  return (
    <div className="py-6 w-fit">
      <h1 className="text-2xl font-bold text-foreground">
        Welcome back, {name}
      </h1>
      <p className="text-sm text-muted-foreground mt-0.5">
        It&apos;s {dayName}, {dateStr} — here&apos;s a look at your day.
      </p>
    </div>
  );
}
