import { useEffect, useState } from "react";

/**
 * Reveals an answer a few words at a time instead of dropping it in whole.
 */

const TICK_MS = 24;
const TARGET_TICKS = 60;

export default function RevealingText({ text, animate = true, onProgress, children }) {
  const [shown, setShown] = useState(() => (animate ? "" : text));

  useEffect(() => {
    const reducedMotion =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!animate || reducedMotion || !text) {
      setShown(text ?? "");
      return undefined;
    }

    // Split on whitespace but keep it, so line breaks and spacing survive.
    const pieces = text.split(/(\s+)/);
    const perTick = Math.max(2, Math.ceil(pieces.length / TARGET_TICKS));
    let index = 0;

    const timer = setInterval(() => {
      index += perTick;
      setShown(pieces.slice(0, index).join(""));
      if (onProgress) {
        onProgress();
      }
      if (index >= pieces.length) {
        clearInterval(timer);
      }
    }, TICK_MS);

    return () => clearInterval(timer);
  }, [text, animate, onProgress]);

  const finished = shown.length >= (text ?? "").length;

  // A render prop, so the caller decides how to display the partial text. The
  // answer is re-parsed into sections on every tick, which means headings and
  // list items appear as they are written rather than snapping into place at
  // the end.
  if (typeof children === "function") {
    return children(shown, finished);
  }

  return (
    <>
      {shown}
      {finished ? null : <span className="ijp-caret" aria-hidden="true" />}
    </>
  );
}
