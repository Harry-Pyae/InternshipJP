import { useLanguage } from "../../config/languageContext.jsx";

/**
 * A titled block of content, with an optional link on the right.
 *
 *   <SectionCard title="Recent applications" action={<Link to="/student/applications">View all</Link>}>
 *     <DataTable ... />
 *   </SectionCard>
 *
 * `fill` stretches the card to the height of its row, so two cards side by
 * side line up. It is opt-in because on a page with a single card it stretched
 * to the full height of the viewport instead, leaving a large empty box under
 * the content.
 *
 * Owner: Member 4.
 */
export default function SectionCard({ title, action, children, padded = true, fill = false }) {
  const { t } = useLanguage();
  return (
    <section className={`ijp-card${fill ? " h-100" : ""}`}>
      <div className="d-flex justify-content-between align-items-center gap-2 px-4 pt-4 pb-2">
        <h2 className="ijp-label mb-0">{t(title)}</h2>
        {action ? <div className="small">{action}</div> : null}
      </div>
      <div className={padded ? "px-4 pb-4" : "pb-2"}>{children}</div>
    </section>
  );
}
