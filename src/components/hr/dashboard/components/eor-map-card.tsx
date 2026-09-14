"use client";

import { useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { Globe2, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
import worldTopo from "world-atlas/countries-110m.json";
import { Button } from "@/src/components/ui/button";
import { ChartCard } from "@/src/components/shared/charts";
import { EOR_WORKERS } from "@/src/data/eor-demo";

const MIN_ZOOM = 1;
const MAX_ZOOM = 8;
const ZOOM_STEP = 1.6;

/**
 * ISO-2 → ISO-3166-1 numeric id, for the handful of countries EOR data
 * actually covers. `world-atlas`'s topojson keys each country feature by the
 * numeric id, not the ISO-2 code our own data uses, and country *names* don't
 * reliably match either (this dataset calls the US "United States of
 * America"), so a small explicit lookup is the least fragile option.
 */
const ISO2_TO_NUMERIC_ID: Record<string, string> = {
  US: "840",
  GB: "826",
  DE: "276",
  IN: "356",
  KE: "404",
  BR: "076",
  PH: "608",
  CA: "124",
};

interface CountryCount {
  countryCode: string;
  country: string;
  count: number;
}

function useEorByCountry(): CountryCount[] {
  return useMemo(() => {
    const byCode = new Map<string, CountryCount>();
    for (const w of EOR_WORKERS) {
      const existing = byCode.get(w.countryCode);
      if (existing) {
        existing.count += 1;
      } else {
        byCode.set(w.countryCode, {
          countryCode: w.countryCode,
          country: w.country,
          count: 1,
        });
      }
    }
    return [...byCode.values()].sort((a, b) => b.count - a.count);
  }, []);
}

/** Three-step shade by headcount — enough to read "more vs fewer" at a glance. */
function fillFor(count: number, max: number): string {
  const ratio = count / max;
  if (ratio > 0.66) return "#1a7d2e";
  if (ratio > 0.33) return "#4ED251";
  return "#a7e8ac";
}

interface HoverInfo {
  x: number;
  y: number;
  name: string;
  count: number;
  pct: number;
}

export function EorMapCard() {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  // `--muted`/`--border` are calibrated for subtle UI chrome, not a map's
  // land mass — in light mode `--muted` sits a hair below white, nearly
  // invisible against the card. Fixed, theme-aware grays instead of the CSS
  // vars guarantee contrast against the card in both themes.
  const inactiveFill = dark ? "#52525b" : "#cbd5e1";
  const strokeColor = dark ? "#27272a" : "#94a3b8";

  const [hover, setHover] = useState<HoverInfo | null>(null);
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>([0, 0]);

  function zoomIn() {
    setZoom((z) => Math.min(MAX_ZOOM, z * ZOOM_STEP));
  }
  function zoomOut() {
    setZoom((z) => {
      const next = Math.max(MIN_ZOOM, z / ZOOM_STEP);
      if (next === MIN_ZOOM) setCenter([0, 0]);
      return next;
    });
  }
  function resetZoom() {
    setZoom(MIN_ZOOM);
    setCenter([0, 0]);
  }

  const byCountry = useEorByCountry();
  const totalWorkers = EOR_WORKERS.length;
  const max = Math.max(...byCountry.map((c) => c.count), 1);
  const byNumericId = useMemo(() => {
    const m = new Map<string, CountryCount>();
    for (const c of byCountry) {
      const id = ISO2_TO_NUMERIC_ID[c.countryCode];
      if (id) m.set(id, c);
    }
    return m;
  }, [byCountry]);

  return (
    <ChartCard
      title="EOR Workforce by Country"
      description="Where your Employer-of-Record workers are based"
      icon={Globe2}
      compact
      className="h-full"
      footer={`${totalWorkers} workers across ${byCountry.length} countries`}
      viewMoreHref="/organization/eor"
    >
      {/* Centers the map in whatever height the card ends up with — set by
          the taller sibling it sits beside on the People tab, not by the map
          itself. */}
      <div className="relative flex h-full items-center justify-center overflow-hidden">
        <ComposableMap
          // A 2:1 canvas matches the world's own natural bounding-box aspect
          // at full extent, so the map fills the available width instead of
          // sitting inset with dead space either side — 800x260 (an
          // arbitrary card-shaped ratio) left ~40% of the width empty.
          projectionConfig={{ scale: 146 }}
          width={800}
          height={400}
          style={{ width: "100%", height: "auto" }}
        >
          <ZoomableGroup
            zoom={zoom}
            center={center}
            minZoom={MIN_ZOOM}
            maxZoom={MAX_ZOOM}
            // Zoom is button-only: the scroll wheel and double-click gestures
            // are filtered out, so scrolling the dashboard over the map never
            // hijacks the page. Dragging still pans once zoomed in — that
            // gesture isn't a zoom event, so it isn't filtered here.
            filterZoomEvent={(event) => {
              // react-simple-maps 3.x hands the underlying DOM event to this
              // filter at runtime; its published types mislabel the
              // parameter as `SVGElement`, so this narrows to the fields it
              // actually reads instead of trusting that signature.
              const e = event as unknown as {
                type: string;
                ctrlKey: boolean;
                button: number;
              };
              if (e.type === "wheel" || e.type === "dblclick") return false;
              return !e.ctrlKey && !e.button;
            }}
            // Keeps the pannable area pinned to the map's own canvas, so
            // dragging can never pull the map out from under the card.
            translateExtent={[
              [0, 0],
              [800, 400],
            ]}
            onMoveEnd={({ zoom: z, coordinates }) => {
              setZoom(z);
              setCenter(coordinates);
            }}
          >
            <Geographies geography={worldTopo}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const match = byNumericId.get(geo.id);
                  const count = match?.count ?? 0;
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={match ? fillFor(match.count, max) : inactiveFill}
                      stroke={strokeColor}
                      strokeWidth={0.5 / zoom}
                      style={{
                        default: { outline: "none" },
                        hover: { outline: "none", opacity: 0.85 },
                        pressed: { outline: "none" },
                      }}
                      onMouseEnter={(e) =>
                        setHover({
                          x: e.clientX,
                          y: e.clientY,
                          name: match?.country ?? geo.properties.name,
                          count,
                          pct: totalWorkers
                            ? Math.round((count / totalWorkers) * 100)
                            : 0,
                        })
                      }
                      onMouseMove={(e) =>
                        setHover((h) =>
                          h ? { ...h, x: e.clientX, y: e.clientY } : h,
                        )
                      }
                      onMouseLeave={() => setHover(null)}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>

        <div className="absolute top-1 right-1 flex flex-col gap-0.5 rounded-md border border-border bg-card/90 p-0.5 shadow-sm backdrop-blur-sm">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            aria-label="Zoom in"
            disabled={zoom >= MAX_ZOOM}
            onClick={zoomIn}
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            aria-label="Zoom out"
            disabled={zoom <= MIN_ZOOM}
            onClick={zoomOut}
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          {zoom !== MIN_ZOOM && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              aria-label="Reset zoom"
              onClick={resetZoom}
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* A floating card rather than an anchored popover — `fixed` positioning
          means it's never clipped by the chart card's `overflow-hidden`. */}
      {hover && (
        <div
          className="pointer-events-none fixed z-50 min-w-36 rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg"
          style={{ left: hover.x + 14, top: hover.y + 14 }}
        >
          <p className="font-medium text-foreground">{hover.name}</p>
          {hover.count > 0 ? (
            <>
              <p className="mt-0.5 text-muted-foreground">
                <span className="font-semibold text-foreground">
                  {hover.count}
                </span>{" "}
                {hover.count === 1 ? "worker" : "workers"}
              </p>
              <p className="text-muted-foreground">
                {hover.pct}% of EOR workforce
              </p>
            </>
          ) : (
            <p className="mt-0.5 text-muted-foreground">No EOR workers</p>
          )}
        </div>
      )}
    </ChartCard>
  );
}
