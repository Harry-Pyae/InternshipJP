import { Link } from "react-router-dom";

import { useLanguage } from "../../config/languageContext.jsx";

/**
 * One headline figure on a dashboard: a label, a large number, a line saying
 * what it counts, and - when there is somewhere to go - a link through to it.
 *
 * This is the card all three dashboards use. It lived inside
 * AdminDashboardPage as a private DashboardStat, so the administrator's
 * figures were tall linkable cards with a description while the student's and
 * the employer's were small ones with a hint and no link. Three dashboards,
 * two designs, for the same thing.
 *
 *   <MetricCard label="Applications" value={5} icon="bi-send"
 *               description="Internships you have applied to"
 *               href="/student/applications" />
 *
 * `tone` colours the figure and its icon: "ok", "warning" or "danger". Leave it
 * off for a number that is neither good nor bad, which is most of them - a
 * dashboard where every card is coloured says nothing at all.
 *
 * StatCard is the smaller sibling, for dense grids like the reports screen.
 */
export default function MetricCard({
  label,
  value,
  icon,
  description,
  href,
  tone = "normal",
}) {
  const { t } = useLanguage();
  const toneClass =
    tone === "ok"
      ? "ijp-state--ok"
      : tone === "warning"
        ? "ijp-state--warn"
        : tone === "danger"
          ? "ijp-state--bad"
          : "";

  const content = (
    <>
      <div className="ijp-metric-head">
        <span className="ijp-label">{t(label)}</span>
        <span className={`ijp-metric-icon${toneClass ? ` ijp-metric-icon--${tone}` : ""}`}>
          <i className={`bi ${icon}`} aria-hidden="true" />
        </span>
      </div>

      <p className={`ijp-metric-value ${toneClass}`}>{value}</p>

      {description ? <p className="ijp-metric-desc">{t(description)}</p> : null}

      {href ? (
        <span className="ijp-metric-go">
          {t("action.view")}
          <i className="bi bi-arrow-right" aria-hidden="true" />
        </span>
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link to={href} className="ijp-metric ijp-metric--link">
        {content}
      </Link>
    );
  }

  return <div className="ijp-metric">{content}</div>;
}
