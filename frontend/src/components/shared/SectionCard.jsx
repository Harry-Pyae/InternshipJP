/**
 * A titled block of content, with an optional link on the right.
 *
 *   <SectionCard title="Recent applications" action={<Link to="/student/applications">View all</Link>}>
 *     <DataTable ... />
 *   </SectionCard>
 *
 * Owner: Member 4.
 */
export default function SectionCard({ title, action, children, padded = true }) {
  return (
    <section className="ijp-card h-100">
      <div className="d-flex justify-content-between align-items-center gap-2 px-4 pt-4 pb-2">
        <h2 className="ijp-label mb-0">{title}</h2>
        {action ? <div className="small">{action}</div> : null}
      </div>
      <div className={padded ? "px-4 pb-4" : "pb-2"}>{children}</div>
    </section>
  );
}
