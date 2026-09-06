import { useLanguage } from "../../config/languageContext.jsx";

/**
 * One number with a label. The top row of every dashboard.
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
  const Tag = to ? "a" : onClick ? "button" : "div";

  return (
    <Tag
      className={`ijp-card p-3 h-100 w-100 text-start${tone ? ` ijp-rail ijp-rail--${tone}` : ""}${
        interactive ? " ijp-card-interactive" : ""
      }`}
      href={to}
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
