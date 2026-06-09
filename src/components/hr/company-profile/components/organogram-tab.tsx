"use client";

import { useState, useRef, useEffect } from "react";
import { Download, Network, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { useOrgChart } from "../hooks";
import type { OrgNode } from "@/src/lib/types/company-profile";

function RootCard({ node }: { node: OrgNode }) {
  return (
    <div className="flex flex-col items-center gap-2.5 p-5 rounded-2xl bg-primary text-primary-foreground min-w-40 max-w-48 shadow-lg shadow-primary/25 text-center">
      <div className="w-16 h-16 rounded-full bg-primary-foreground/20 ring-2 ring-primary-foreground/30 flex items-center justify-center text-2xl font-bold tracking-wide">
        {node.initials}
      </div>
      <div className="w-full">
        <p className="font-bold text-sm leading-tight truncate">{node.name}</p>
        <p className="text-xs text-primary-foreground/70 mt-0.5 truncate">
          {node.role}
        </p>
      </div>
      <Badge
        variant="outline"
        className="text-[9px] px-1.5 py-0 border-primary-foreground/30 text-primary-foreground/80"
      >
        {node.dept}
      </Badge>
    </div>
  );
}

function ManagerCard({ node }: { node: OrgNode }) {
  return (
    <div className="flex flex-col items-center gap-2 p-3.5 rounded-xl border border-sidebar-border bg-sidebar-accent min-w-36 max-w-44 text-center">
      <div className="w-11 h-11 rounded-full bg-sidebar-primary/15 ring-2 ring-sidebar-primary/25 flex items-center justify-center text-sm font-bold text-sidebar-primary">
        {node.initials}
      </div>
      <div className="w-full">
        <p className="font-semibold text-xs leading-tight text-foreground truncate">
          {node.name}
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
          {node.role}
        </p>
      </div>
      <Badge
        variant="outline"
        className="text-[9px] px-1.5 py-0 border-sidebar-border text-sidebar-accent-foreground max-w-full truncate"
      >
        {node.dept}
      </Badge>
    </div>
  );
}

function MemberCard({ node }: { node: OrgNode }) {
  return (
    <div className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl border border-border bg-card min-w-32 max-w-38 text-center hover:border-primary/40 hover:shadow-sm transition-all">
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
        {node.initials}
      </div>
      <div className="w-full">
        <p className="font-semibold text-[11px] leading-tight text-foreground truncate">
          {node.name}
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
          {node.role}
        </p>
      </div>
      <Badge
        variant="outline"
        className="text-[9px] px-1.5 py-0 w-full justify-center truncate"
      >
        {node.dept}
      </Badge>
    </div>
  );
}

function SiblingRow({
  items,
  all,
  level,
}: {
  items: OrgNode[];
  all: OrgNode[];
  level: number;
}) {
  return (
    <div className="flex items-start">
      {items.map((node, idx) => {
        const isFirst = idx === 0;
        const isLast = idx === items.length - 1;
        const isOnly = items.length === 1;
        return (
          <div key={node.id} className="flex flex-col items-center px-4">
            <div className="w-full relative h-6">
              {!isOnly && (
                <div
                  className="absolute top-0 h-px bg-border"
                  style={{
                    left: isFirst ? "50%" : "0",
                    right: isLast ? "50%" : "0",
                  }}
                />
              )}
              <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-border" />
            </div>
            <OrgBranch node={node} all={all} level={level} />
          </div>
        );
      })}
    </div>
  );
}

function OrgBranch({
  node,
  all,
  level,
}: {
  node: OrgNode;
  all: OrgNode[];
  level: number;
}) {
  const nodeChildren = all.filter((n) => n.reportsTo === node.id);
  const isRoot = level === 1;
  const isManager = nodeChildren.length > 0;

  return (
    <div className="flex flex-col items-center">
      {isRoot ? (
        <RootCard node={node} />
      ) : isManager ? (
        <ManagerCard node={node} />
      ) : (
        <MemberCard node={node} />
      )}
      {nodeChildren.length > 0 && (
        <>
          <div className="w-px h-6 bg-border shrink-0" />
          <SiblingRow items={nodeChildren} all={all} level={level + 1} />
        </>
      )}
    </div>
  );
}

export function OrganogramTab() {
  const nodes = useOrgChart();
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const autoFitRef = useRef(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const id = requestAnimationFrame(() => {
      if (!autoFitRef.current) return;
      if (container.scrollWidth > container.clientWidth + 1) {
        const ratio = container.clientWidth / container.scrollWidth;
        setZoom((prev) =>
          Math.max(0.3, parseFloat((prev * ratio * 0.97).toFixed(3))),
        );
      } else {
        autoFitRef.current = false;
      }
    });
    return () => cancelAnimationFrame(id);
  }, [zoom]);

  function handleZoomIn() {
    autoFitRef.current = false;
    setZoom((z) => Math.min(2, parseFloat((z + 0.1).toFixed(2))));
  }

  function handleZoomOut() {
    autoFitRef.current = false;
    setZoom((z) => Math.max(0.3, parseFloat((z - 0.1).toFixed(2))));
  }

  function handleFit() {
    autoFitRef.current = true;
    setZoom(1);
  }

  function handleExport() {
    const el = printRef.current;
    if (!el) return;

    const styles = Array.from(document.styleSheets)
      .map((sheet) => {
        try {
          return Array.from(sheet.cssRules)
            .map((r) => r.cssText)
            .join("\n");
        } catch {
          return sheet.href ? `@import url("${sheet.href}");` : "";
        }
      })
      .join("\n");

    const win = window.open("", "_blank", "width=1400,height=900");
    if (!win) return;

    win.document.write(
      `<!DOCTYPE html><html><head>
        <style>${styles}</style>
        <style>
          html,body{margin:0;padding:32px;background:white;display:flex;justify-content:center;}
          @media print{html,body{padding:0;}}
        </style>
      </head><body>${el.outerHTML}</body></html>`,
    );
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 400);
  }

  const root = nodes.find((n) => n.reportsTo === null);

  return (
    <Card className="relative">
      <CardHeader className="flex flex-row items-center justify-between px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-muted">
            <Network className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div>
            <CardTitle className="text-sm font-medium">
              Organisation Chart
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Live org chart built from department and reporting line data.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1.5"
          onClick={handleExport}
        >
          <Download className="w-3 h-3" /> Export
        </Button>
      </CardHeader>

      <CardContent className="p-0 relative">
        <div ref={containerRef} className="overflow-x-auto min-w-0">
          <div
            ref={printRef}
            className="py-8 px-8 w-max min-w-full"
            style={{ zoom }}
          >
            {root ? (
              <OrgBranch node={root} all={nodes} level={1} />
            ) : (
              <p className="text-sm text-muted-foreground py-10 text-center w-full">
                No organisation structure available.
              </p>
            )}
          </div>
        </div>

        <div className="absolute bottom-3 right-3 flex items-center gap-0.5 bg-background/90 backdrop-blur-sm border border-border rounded-lg p-1 shadow-sm z-10">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleZoomOut}
            disabled={zoom <= 0.3}
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </Button>
          <span className="text-[11px] text-muted-foreground w-9 text-center tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleZoomIn}
            disabled={zoom >= 2}
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </Button>
          <div className="w-px h-4 bg-border mx-0.5" />
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleFit}
            title="Fit to screen"
          >
            <Maximize2 className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
