import { useEffect, useState } from "react";

/**
 * Reveals an answer a few words at a time instead of dropping it in whole.
 *
 * WHY
 *   The backend returns the finished answer in one response, so without this
 *   the text appears in a single frame - which reads as the page reloading
 *   rather than the assistant replying. Revealing it restores the sense that
 *   something is being written to you.
 *
 * HONEST ABOUT WHAT THIS IS
 *   This is a reveal, not token streaming. The whole answer is already in the
 *   browser; we are pacing how it is shown. Real streaming would need the
 *   backend to forward Groq's server-sent events - worth doing later, and the
 *   change would be invisible here because this component would simply receive
 *   a growing string.
 *
 *   The pace adapts to length, so a long answer does not take a minute to
 *   appear: roughly 1.5 seconds whatever the size.
 *
 *   Anyone with reduced motion turned on gets the full text immediately.
 */

const TICK_MS = 24;
const TARGET_TICKS = 60;

export default function RevealingText({ text, animate = true, onProgress }) {
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

  return (
    <>
      {shown}
      {/* A caret while writing, so a pause mid-answer looks deliberate. */}
      {finished ? null : <span className="ijp-caret" aria-hidden="true" />}
    </>
  );
}
