import { Link } from "react-router-dom";

import { useLanguage } from "../../config/languageContext.jsx";

/**
 * One number with a label, for a dense grid - the reports screen puts four of
 * these beside two charts.
 *
 * The taller card with a description and a link through is MetricCard, and
 * that is what all three dashboards use. Reach for this one when the figures
 * are already under a heading that explains them and the space is tight.
 *
 * The value is set in the data face with tabular figures, so a row of cards
 * lines up instead of wobbling as the numbers change.
 *
 *   <StatCard label="Applications" value={5} icon="bi-send" />
 *   <StatCard label="Unreviewed" value={12} icon="bi-clock" tone="bad" hint="oldest 11 days" />
 *
 * Owner: Member 4.
 */
export default function StatCard({ label, value, icon, tone, hint, to, onClick }) {
  const { t } = useLanguage();
  const interactive = Boolean(to || onClick);
  // Link, not <a href>. A bare anchor to an in-app route makes the browser
  // fetch the whole application again and throws away the session state the
  // router is holding, which is a slow blank flash instead of a navigation.
  const Tag = to ? Link : onClick ? "button" : "div";

  return (
    <Tag
      className={`ijp-card p-3 h-100 w-100 text-start${tone ? ` ijp-rail ijp-rail--${tone}` : ""}${
        interactive ? " ijp-card-interactive" : ""
      }`}
      to={to}
      onClick={onClick}
      type={onClick ? "button" : undefined}
      style={interactive ? { cursor: "pointer" } : undefined}
    >
      <div className="d-flex justify-content-between align-items-start gap-2">
        <span className="ijp-label">{t(label)}</span>
        {icon ? <i className={`bi ${icon} ijp-muted`} aria-hidden="true" /> : null}
      </div>
      <p className={`ijp-score mt-2 mb-0${tone ? ` ijp-state--${tone}` : ""}`}>{value}</p>
      {hint ? (
        <p className="ijp-muted mb-0 mt-1" style={{ fontSize: "0.76rem" }}>
          {t(hint)}
        </p>
      ) : null}
    </Tag>
  );
}
