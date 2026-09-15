/**
 * Long text that breaks at sensible points.
 *
 * `overflow-wrap: anywhere` breaks wherever the line runs out, so
 * student1@demo.internshipjp.local became "...internshipjp.lo" and "cal" on
 * the next line - which reads as a typo rather than as a wrap.
 *
 * A zero-width <wbr> after each @ . _ and - gives the browser somewhere
 * sensible to break instead. Nothing is added to the text: copying it still
 * gives the original, and a screen reader reads it as one string.
 */
export default function Breakable({ text, className }) {
  const value = String(text ?? "");
  const parts = value.split(/(?<=[@._-])/);

  return (
    <span className={`ijp-breakable ${className ?? ""}`.trim()}>
      {parts.map((part, index) => (
        <span key={index}>
          {part}
          {index < parts.length - 1 ? <wbr /> : null}
        </span>
      ))}
    </span>
  );
}
