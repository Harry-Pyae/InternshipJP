import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

/**
 * A date field with our own calendar.
 */
export default function DatePicker({
  value,
  onChange,
  placeholder = "Choose a date",
  ariaLabel,
  min,
  disabled = false,
  id,
}) {
  const [open, setOpen] = useState(false);
  const [cursor, setCursor] = useState(() => parseISO(value) ?? startOfToday());
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const gridRef = useRef(null);
  const baseId = useId();

  const selected = parseISO(value);
  const minDate = parseISO(min);

  // Rebuild the grid only when the visible month changes.
  const weeks = useMemo(() => buildMonth(cursor), [cursor]);

  const close = useCallback((restoreFocus = true) => {
    setOpen(false);
    if (restoreFocus && triggerRef.current) {
      triggerRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    function onPointerDown(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        close(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open, close]);

  // Keep the focused day reachable when arrowing across a month boundary.
  useEffect(() => {
    if (open && gridRef.current) {
      const node = gridRef.current.querySelector('[data-focused="true"]');
      if (node) {
        node.focus({ preventScroll: true });
      }
    }
  }, [open, cursor]);

  function openCalendar() {
    if (disabled) {
      return;
    }
    setCursor(parseISO(value) ?? startOfToday());
    setOpen(true);
  }

  function choose(date) {
    if (isBefore(date, minDate)) {
      return;
    }
    onChange(toISO(date));
    close();
  }

  function onKeyDown(event) {
    if (!open) {
      if (["ArrowDown", "Enter", " "].includes(event.key)) {
        event.preventDefault();
        openCalendar();
      }
      return;
    }

    const moves = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
    };

    if (moves[event.key] !== undefined) {
      event.preventDefault();
      setCursor((c) => addDays(c, moves[event.key]));
      return;
    }

    switch (event.key) {
      case "PageUp":
        event.preventDefault();
        setCursor((c) => addMonths(c, -1));
        break;
      case "PageDown":
        event.preventDefault();
        setCursor((c) => addMonths(c, 1));
        break;
      case "Home":
        event.preventDefault();
        setCursor((c) => addDays(c, -c.getDay()));
        break;
      case "End":
        event.preventDefault();
        setCursor((c) => addDays(c, 6 - c.getDay()));
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        choose(cursor);
        break;
      case "Escape":
        event.preventDefault();
        close();
        break;
      case "Tab":
        close(false);
        break;
      default:
        break;
    }
  }

  return (
    <div className="ijp-datepicker" ref={rootRef}>
      <button
        type="button"
        id={id}
        ref={triggerRef}
        className={`ijp-select-trigger${open ? " ijp-select-trigger--open" : ""}`}
        onClick={() => (open ? close() : openCalendar())}
        onKeyDown={onKeyDown}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        <span className={selected ? "" : "ijp-select-placeholder"}>
          {selected ? longDate(selected) : placeholder}
        </span>
        <i className="bi bi-calendar-event ijp-select-caret" aria-hidden="true" />
      </button>

      {open ? (
        <div className="ijp-cal" role="dialog" aria-label={ariaLabel ?? "Choose a date"}>
          <div className="ijp-cal-head">
            <button
              type="button"
              className="ijp-icon-btn"
              onClick={() => setCursor((c) => addMonths(c, -1))}
              aria-label="Previous month"
            >
              <i className="bi bi-chevron-left" aria-hidden="true" />
            </button>
            <span className="ijp-cal-month" aria-live="polite">
              {monthYear(cursor)}
            </span>
            <button
              type="button"
              className="ijp-icon-btn"
              onClick={() => setCursor((c) => addMonths(c, 1))}
              aria-label="Next month"
            >
              <i className="bi bi-chevron-right" aria-hidden="true" />
            </button>
          </div>

          <div className="ijp-cal-grid" role="grid" ref={gridRef} onKeyDown={onKeyDown}>
            <div className="ijp-cal-row" role="row">
              {weekdayNames().map((name) => (
                <abbr key={name.long} className="ijp-cal-weekday" title={name.long}>
                  {name.short}
                </abbr>
              ))}
            </div>

            {weeks.map((week, wi) => (
              <div className="ijp-cal-row" role="row" key={wi}>
                {week.map((day) => {
                  const outside = day.getMonth() !== cursor.getMonth();
                  const isSelected = selected && sameDay(day, selected);
                  const isToday = sameDay(day, startOfToday());
                  const isFocused = sameDay(day, cursor);
                  const blocked = isBefore(day, minDate);
                  return (
                    <button
                      type="button"
                      role="gridcell"
                      key={toISO(day)}
                      id={`${baseId}-${toISO(day)}`}
                      data-focused={isFocused}
                      tabIndex={isFocused ? 0 : -1}
                      aria-selected={isSelected || undefined}
                      aria-current={isToday ? "date" : undefined}
                      aria-label={longDate(day)}
                      disabled={blocked}
                      className={[
                        "ijp-cal-day",
                        outside ? "ijp-cal-day--outside" : "",
                        isSelected ? "ijp-cal-day--selected" : "",
                        isToday ? "ijp-cal-day--today" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() => choose(day)}
                    >
                      {day.getDate()}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="ijp-cal-foot">
            <button
              type="button"
              className="btn btn-sm btn-ijp-quiet"
              onClick={() => {
                onChange("");
                close();
              }}
            >
              Clear
            </button>
            <button
              type="button"
              className="btn btn-sm btn-ijp-quiet"
              onClick={() => choose(startOfToday())}
            >
              Today
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ---------------------------------------------------------------- dates ---
   Plain Date arithmetic rather than a library. Only six operations are
   needed, all of them on local dates with no time component, which is the
   case Date handles without surprises. */

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function parseISO(text) {
  if (!text) {
    return null;
  }
  const [y, m, d] = String(text).slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) {
    return null;
  }
  return new Date(y, m - 1, d);
}

/** Built by hand, not toISOString - that converts to UTC and can shift a day. */
function toISO(date) {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

function addDays(date, n) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + n);
}

function addMonths(date, n) {
  // Clamps naturally: 31 January plus one month lands in early March, so step
  // back to the last day of the target month instead.
  const target = new Date(date.getFullYear(), date.getMonth() + n, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  return new Date(target.getFullYear(), target.getMonth(), Math.min(date.getDate(), lastDay));
}

function sameDay(a, b) {
  return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

function isBefore(date, limit) {
  return limit ? date < limit : false;
}

function buildMonth(cursor) {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const start = addDays(first, -first.getDay());
  const weeks = [];
  for (let w = 0; w < 6; w += 1) {
    const row = [];
    for (let d = 0; d < 7; d += 1) {
      row.push(addDays(start, w * 7 + d));
    }
    weeks.push(row);
  }
  return weeks;
}

/* Intl, so the names follow the browser's language rather than hard-coded
   English. */
function monthYear(date) {
  return new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(date);
}

function longDate(date) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function weekdayNames() {
  const shortFmt = new Intl.DateTimeFormat(undefined, { weekday: "short" });
  const longFmt = new Intl.DateTimeFormat(undefined, { weekday: "long" });
  // 4 January 1970 was a Sunday, which matches getDay() === 0.
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(1970, 0, 4 + i);
    return { short: shortFmt.format(day).slice(0, 2), long: longFmt.format(day) };
  });
}
