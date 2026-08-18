import PageHeader from "../shared/PageHeader.jsx";

/**
 * A page that exists and routes correctly, but whose feature belongs to
 * another member.
 *
 * WHY THESE EXIST
 *   Every sidebar link must load its own page. Without a real component per
 *   route, an unmatched path falls through to the catch-all and lands
 *   somewhere else entirely - which is how the AI assistant ended up
 *   rendering on every screen.
 *
 *   They are also a handover: each one names the owner and lists which backend
 *   endpoints are already waiting, so whoever picks it up starts from a brief
 *   rather than a blank file.
 *
 * DELIBERATELY NO FAKE DATA. No invented counts, no sample rows. An honest
 * empty page beats a convincing lie.
 */
export default function FeaturePlaceholder({ title, description, icon, owner, endpoints = [], note }) {
  return (
    <>
      <PageHeader title={title} subtitle={description} />

      <div className="ijp-card ijp-placeholder">
        <span className="ijp-placeholder-icon" aria-hidden="true">
          <i className={`bi ${icon}`} />
        </span>
        <p className="ijp-placeholder-title">Not built yet</p>
        <p className="ijp-muted mb-0">
          This screen is part of the group project and has not been implemented.
        </p>

        {owner ? (
          <p className="ijp-muted small mt-3 mb-0">
            Owned by <span className="fw-semibold">{owner}</span>
          </p>
        ) : null}

        {note ? (
          <p className="ijp-placeholder-note">
            <i className="bi bi-exclamation-triangle me-2" aria-hidden="true" />
            {note}
          </p>
        ) : null}

        {endpoints.length > 0 ? (
          <div className="ijp-placeholder-endpoints">
            <p className="ijp-label mb-2">Backend endpoints already working</p>
            <ul className="list-unstyled d-grid gap-1 mb-0">
              {endpoints.map((endpoint) => (
                <li className="ijp-data" key={endpoint}>
                  {endpoint}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {endpoints.length === 0 && !note ? (
          <p className="ijp-muted small mt-3 mb-0">No backend endpoints exist for this yet.</p>
        ) : null}
      </div>
    </>
  );
}
