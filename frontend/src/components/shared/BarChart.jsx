/**
 * A small horizontal bar chart, drawn as plain SVG.
 *
 * No charting library. Adding a dependency for four bars would mean a heavier
 * bundle and an npm install that has to succeed on every machine the project
 * is cloned onto - and this needs nothing a library provides.
 *
 * Every bar carries its own number as text. A chart where you have to estimate
 * against an axis is worse than a table; this one is a table you can also see
 * the shape of.
 */
export default function BarChart({ data, tone = "signal", empty = "No data yet." }) {
  const rows = (data ?? []).filter((row) => row && row.label);
  if (rows.length === 0) {
    return <p className="ijp-muted small mb-0">{empty}</p>;
  }

  // Scale to the largest value, never to zero - a single zero row would
  // otherwise divide by nothing and render NaN widths.
  const max = Math.max(...rows.map((row) => Number(row.value) || 0), 1);

  return (
    <ul className="ijp-bars">
      {rows.map((row) => {
        const value = Number(row.value) || 0;
        const pct = Math.round((value / max) * 100);
        return (
          <li className="ijp-bar-row" key={row.label}>
            <span className="ijp-bar-label" title={row.label}>
              {row.label}
            </span>
            <span className="ijp-bar-track">
              <span
                className={`ijp-bar-fill ijp-bar-fill--${row.tone ?? tone}`}
                style={{ width: `${Math.max(pct, value > 0 ? 4 : 0)}%` }}
                role="img"
                aria-label={`${row.label}: ${value}`}
              />
            </span>
            <span className="ijp-bar-value">{value}</span>
          </li>
        );
      })}
    </ul>
  );
}
