import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

/**
 * A dropdown we actually control.
 *
 * WHY NOT A NATIVE <select>
 *   The popup a native select opens is drawn by the operating system, not by
 *   the page. `color-scheme` gets it into the right light/dark mode - which is
 *   real and worth having - but that is where CSS stops. Rounded corners,
 *   padding, dividers between groups, hover styling: none of it is reachable.
 *   Chrome ignores it, and there is no flag that changes that.
 *
 *   So this renders its own listbox. That is the only way to get the same
 *   surface as the rest of the application.
 *
 * WHAT THAT COSTS, AND WHAT IT MUST THEREFORE DO
 *   A native select is accessible for free. Replacing it means re-implementing
 *   what the browser was giving us, or the component is a downgrade for anyone
 *   not using a mouse:
 *
 *     - full keyboard control: arrows, Home, End, Enter, Space, Escape
 *     - type-ahead: press "b" to jump to "Backend Intern", as a real select does
 *     - focus returns to the trigger on close, so Tab order is not lost
 *     - role="listbox"/"option" with aria-activedescendant, so a screen reader
 *       announces the highlighted option without focus actually moving
 *     - closes on outside click and on Escape
 *
 *   If you extend this, keep those. A prettier dropdown that cannot be used
 *   from a keyboard is not an improvement.
 *
 * Owner: Member 4 (shared UI). Use it for filter menus too.
 */
export default function Select({
  value,
  onChange,
  groups = [],
  placeholder = "Choose...",
  ariaLabel,
  disabled = false,
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef(null);
  const listRef = useRef(null);
  const triggerRef = useRef(null);
  const typeAhead = useRef({ text: "", at: 0 });
  const baseId = useId();

  // One flat list for keyboard movement; the groups are only a visual grouping.
  const flat = useMemo(
    () => groups.flatMap((group) => group.items.map((item) => ({ ...item, group: group.label }))),
    [groups],
  );

  const selected = flat.find((item) => String(item.value) === String(value)) ?? null;

  const close = useCallback(
    ({ restoreFocus = true } = {}) => {
      setOpen(false);
      setActiveIndex(-1);
      if (restoreFocus && triggerRef.current) {
        triggerRef.current.focus();
      }
    },
    [],
  );

  function openList() {
    if (disabled) {
      return;
    }
    const current = flat.findIndex((item) => String(item.value) === String(value));
    setActiveIndex(current >= 0 ? current : 0);
    setOpen(true);
  }

  function choose(index) {
    const item = flat[index];
    if (item) {
      onChange(String(item.value));
    }
    close();
  }

  // Outside click closes without stealing focus back - the user is clearly
  // heading somewhere else.
  useEffect(() => {
    if (!open) {
      return undefined;
    }
    function onPointerDown(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        close({ restoreFocus: false });
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open, close]);

  // Keep the highlighted row in view while arrowing through a long list.
  useEffect(() => {
    if (!open || activeIndex < 0 || !listRef.current) {
      return;
    }
    const node = listRef.current.querySelector(`[data-index="${activeIndex}"]`);
    if (node) {
      node.scrollIntoView({ block: "nearest" });
    }
  }, [open, activeIndex]);

  function onKeyDown(event) {
    if (disabled) {
      return;
    }

    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
        event.preventDefault();
        openList();
      }
      return;
    }

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, flat.length - 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case "Home":
        event.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        event.preventDefault();
        setActiveIndex(flat.length - 1);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        choose(activeIndex);
        break;
      case "Escape":
        event.preventDefault();
        close();
        break;
      case "Tab":
        // Let Tab move on, but do not leave a popup hanging open behind it.
        close({ restoreFocus: false });
        break;
      default:
        // Type-ahead. Letters typed within a second are treated as one string,
        // so "ba" finds "Backend" rather than jumping to anything with "a".
        if (event.key.length === 1 && !event.metaKey && !event.ctrlKey) {
          const now = Date.now();
          typeAhead.current.text =
            now - typeAhead.current.at > 1000 ? event.key : typeAhead.current.text + event.key;
          typeAhead.current.at = now;
          const needle = typeAhead.current.text.toLowerCase();
          const found = flat.findIndex((item) => item.label.toLowerCase().startsWith(needle));
          if (found >= 0) {
            setActiveIndex(found);
          }
        }
    }
  }

  return (
    <div className={`ijp-select ${className}`.trim()} ref={rootRef}>
      <button
        type="button"
        ref={triggerRef}
        className={`ijp-select-trigger${open ? " ijp-select-trigger--open" : ""}`}
        onClick={() => (open ? close() : openList())}
        onKeyDown={onKeyDown}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        <span className={selected ? "text-truncate" : "ijp-select-placeholder text-truncate"}>
          {selected ? selected.label : placeholder}
        </span>
        <i className="bi bi-chevron-down ijp-select-caret" aria-hidden="true" />
      </button>

      {open ? (
        <ul
          className="ijp-select-list"
          role="listbox"
          ref={listRef}
          tabIndex={-1}
          aria-label={ariaLabel}
          aria-activedescendant={activeIndex >= 0 ? `${baseId}-opt-${activeIndex}` : undefined}
        >
          {groups.map((group, groupIndex) => (
            <li key={group.label ?? groupIndex} role="presentation">
              {group.label ? (
                <p
                  className={`ijp-select-group${groupIndex > 0 ? " ijp-select-group--divided" : ""}`}
                >
                  {group.label}
                </p>
              ) : null}
              <ul role="presentation">
                {group.items.map((item) => {
                  const index = flat.findIndex(
                    (candidate) => String(candidate.value) === String(item.value),
                  );
                  const isSelected = String(item.value) === String(value);
                  return (
                    <li
                      key={item.value}
                      id={`${baseId}-opt-${index}`}
                      role="option"
                      aria-selected={isSelected}
                      data-index={index}
                      className={`ijp-select-option${
                        index === activeIndex ? " ijp-select-option--active" : ""
                      }${isSelected ? " ijp-select-option--selected" : ""}`}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => choose(index)}
                    >
                      <span className="text-truncate">{item.label}</span>
                      {isSelected ? (
                        <i className="bi bi-check2 flex-shrink-0" aria-hidden="true" />
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
