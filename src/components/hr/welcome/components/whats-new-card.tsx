"use client";

import { useRef, useState } from "react";
import { Play, Sparkles } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";

export function WhatsNewCard() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlay = () => {
    videoRef.current?.play();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 px-4 pt-4 pb-3">
        <div className="flex items-center justify-center w-7 h-7 rounded-md bg-muted">
          <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <CardTitle className="text-lg font-bold">Official Motee Tutorial</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {/*
          The recording itself is 1728×1080 (8:5) — `aspect-video` (16:9) is
          wider than that, so the box let the video keep its own ratio and
          letterboxed it instead of filling the width. Matching the
          container's ratio to the source removes the bars entirely.
        */}
        <div className="relative aspect-8/5 w-full overflow-hidden rounded-lg border border-border bg-muted">
          {/*
            Sourced from public/IMG_5867.MOV, which is HEVC-encoded — most
            non-Safari browsers can't play that natively, so this is a
            transcoded H.264 copy for broad playback support.
          */}
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            controls={isPlaying}
            preload="metadata"
            poster="/thumbnail.png"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          >
            <source src="/motee-tutorial.mp4" type="video/mp4" />
            Your browser doesn&apos;t support embedded video.
          </video>
          {!isPlaying && (
            <button
              type="button"
              onClick={handlePlay}
              aria-label="Play video"
              className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/20 transition-colors hover:bg-black/30"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-lg transition-transform hover:scale-105">
                <Play className="h-6 w-6 translate-x-0.5 fill-black text-black" />
              </span>
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
