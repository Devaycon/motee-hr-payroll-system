"use client";

import { useMemo } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Eye, EyeOff, GripVertical, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils";
import { useAppDispatch, useAppSelector } from "@/src/lib/stores/hooks";
import {
  setOrder,
  setSpan,
  toggleHidden,
} from "@/src/lib/stores/dashboard-layout-slice";
import {
  DASHBOARD_WIDGETS,
  WIDGET_SPANS,
  resolveWidgetOrder,
  type DashboardWidget,
} from "../widgets";

/**
 * Written out in full rather than interpolated so Tailwind's scanner keeps
 * these classes. Everything is full width below `lg` — a 2-of-6 chart on a
 * phone is unreadable.
 */
const SPAN_CLASS: Record<number, string> = {
  2: "lg:col-span-2",
  3: "lg:col-span-3",
  4: "lg:col-span-4",
  6: "lg:col-span-6",
};

function SortableWidget({
  widget,
  span,
  editing,
  onToggleHidden,
  onCycleSpan,
}: {
  widget: DashboardWidget;
  span: number;
  editing: boolean;
  onToggleHidden: () => void;
  onCycleSpan: (direction: 1 | -1) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: widget.key, disabled: !editing });
  const Widget = widget.component;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        "relative",
        SPAN_CLASS[span] ?? SPAN_CLASS[widget.span],
        isDragging && "z-20 opacity-80",
        editing && "rounded-xl ring-2 ring-primary/40 ring-offset-2",
      )}
    >
      {editing && (
        <div className="absolute right-2 top-2 z-10 flex items-center gap-0.5 rounded-lg border border-border bg-card px-1 py-0.5 shadow-sm">
          <button
            type="button"
            aria-label={`Move ${widget.label}`}
            className="flex size-7 cursor-grab items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-4" />
          </button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground"
            aria-label={`Make ${widget.label} narrower`}
            disabled={span <= WIDGET_SPANS[0]}
            onClick={() => onCycleSpan(-1)}
          >
            <Minimize2 className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground"
            aria-label={`Make ${widget.label} wider`}
            disabled={span >= WIDGET_SPANS[WIDGET_SPANS.length - 1]}
            onClick={() => onCycleSpan(1)}
          >
            <Maximize2 className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-7 text-muted-foreground"
            aria-label={`Hide ${widget.label}`}
            onClick={onToggleHidden}
          >
            <EyeOff className="size-3.5" />
          </Button>
        </div>
      )}
      {/* In edit mode the widget is a layout object, not a control surface —
          swallowing pointer events stops a drag from firing a chart tooltip or
          following a "View more" link. */}
      <div className={cn(editing && "pointer-events-none select-none")}>
        <Widget />
      </div>
    </div>
  );
}

interface CustomisableGridProps {
  editing: boolean;
}

export function CustomisableGrid({ editing }: CustomisableGridProps) {
  const dispatch = useAppDispatch();
  const { order, hidden, spans } = useAppSelector((s) => s.dashboardLayout);

  const widgets = useMemo(() => resolveWidgetOrder(order), [order]);
  const visible = useMemo(
    () => widgets.filter((w) => !hidden.includes(w.key)),
    [widgets, hidden],
  );
  const hiddenWidgets = useMemo(
    () => DASHBOARD_WIDGETS.filter((w) => hidden.includes(w.key)),
    [hidden],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const keys = widgets.map((w) => w.key);
    const from = keys.indexOf(String(active.id));
    const to = keys.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    dispatch(setOrder(arrayMove(keys, from, to)));
  }

  function cycleSpan(key: string, current: number, direction: 1 | -1) {
    const i = WIDGET_SPANS.indexOf(current as (typeof WIDGET_SPANS)[number]);
    // An unrecognised saved span still steps sensibly: fall back to the widest
    // step below it rather than snapping to the start of the scale.
    const base = i >= 0 ? i : WIDGET_SPANS.findIndex((s) => s >= current);
    const next = WIDGET_SPANS[Math.min(Math.max(base + direction, 0), WIDGET_SPANS.length - 1)];
    if (next !== undefined) dispatch(setSpan({ key, span: next }));
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={visible.map((w) => w.key)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 items-start">
            {visible.map((w) => {
              const span = spans[w.key] ?? w.span;
              return (
                <SortableWidget
                  key={w.key}
                  widget={w}
                  span={span}
                  editing={editing}
                  onToggleHidden={() => dispatch(toggleHidden(w.key))}
                  onCycleSpan={(d) => cycleSpan(w.key, span, d)}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      {editing && hiddenWidgets.length > 0 && (
        <div className="rounded-xl border border-dashed border-border p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Hidden widgets
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {hiddenWidgets.map((w) => (
              <Button
                key={w.key}
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => dispatch(toggleHidden(w.key))}
              >
                <Eye className="size-3.5" />
                {w.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {visible.length === 0 && !editing && (
        <div className="rounded-xl border border-dashed border-border py-12 text-center">
          <p className="text-sm font-semibold text-foreground">
            Every widget is hidden
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Use <span className="font-medium">Customise</span> to bring some
            back.
          </p>
        </div>
      )}
    </>
  );
}
