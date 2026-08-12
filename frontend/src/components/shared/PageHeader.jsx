/** Title, one line of explanation, and an optional action on the right. */
export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="d-flex flex-wrap justify-content-between align-items-end gap-2 mb-4">
      <div>
        <h1 className="ijp-page-title">{title}</h1>
        {subtitle ? <p className="ijp-page-subtitle">{subtitle}</p> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}
