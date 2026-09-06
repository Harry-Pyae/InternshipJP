import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import PageHeader from "../../components/shared/PageHeader.jsx";
import StatusBadge from "../../components/shared/StatusBadge.jsx";
import LoadingBlock from "../../components/shared/LoadingBlock.jsx";
import ErrorAlert from "../../components/shared/ErrorAlert.jsx";
import { adminApi } from "../../api/adminApi.js";
import { describeApiError } from "../../api/axiosClient.js";

/**
 * Approving or rejecting one company.
 */
const DETAILS = [
  { key: "industry", label: "Industry" },
  { key: "companySize", label: "Company size" },
  { key: "foundedYear", label: "Founded" },
  { key: "website", label: "Website", link: true },
  { key: "linkedinUrl", label: "LinkedIn", link: true },
  { key: "contactEmail", label: "Contact email" },
  { key: "contactPhone", label: "Contact phone" },
  { key: "location", label: "City" },
  { key: "country", label: "Country" },
  { key: "address", label: "Address" },
];

export default function AdminEmployerReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [company, setCompany] = useState(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      // The list endpoint is the one that exists, so the company is found in
      // it rather than invented from a detail endpoint that does not.
      const page = await adminApi.listPendingEmployers({ page: 0, size: 100 });
      const found = (page?.content ?? []).find((c) => String(c.id) === String(id));
      if (!found) {
        setError("That company is not in the pending queue. It may already have been reviewed.");
        return;
      }
      setCompany(found);
    } catch (requestError) {
      setError(describeApiError(requestError));
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function decide(status) {
    if (status === "REJECTED" && !note.trim()) {
      setError("Please write a note explaining the rejection. The employer sees it.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await adminApi.decideEmployer(id, status, note.trim());
      navigate("/admin/employers", { replace: true });
    } catch (requestError) {
      setError(describeApiError(requestError));
      setBusy(false);
    }
  }

  if (company === null && !error) {
    return <LoadingBlock label="Loading the company..." />;
  }

  return (
    <>
      <PageHeader
        title={company?.name ?? "Company"}
        subtitle="Check the registration before activating this company's recruiters."
        action={
          <Link className="btn btn-sm btn-ijp-quiet" to="/admin/employers">
            <i className="bi bi-arrow-left me-1" aria-hidden="true" />
            Back to queue
          </Link>
        }
      />

      <ErrorAlert message={error} />

      {company ? (
        <div className="row g-4">
          <div className="col-12 col-xl-8">
            <div className="ijp-card p-3 p-md-4 mb-4">
              <div className="d-flex flex-wrap justify-content-between align-items-start gap-3 mb-3">
                <div>
                  <span className="ijp-label d-block mb-1">Registration number</span>
                  {company.registrationNumber ? (
                    <p className="ijp-data mb-0" style={{ fontSize: "1.1rem" }}>
                      {company.registrationNumber}
                    </p>
                  ) : (
                    <p className="ijp-state--bad mb-0">
                      <i className="bi bi-exclamation-triangle me-1" aria-hidden="true" />
                      Not provided
                    </p>
                  )}
                </div>
                <StatusBadge value={company.approvalStatus} />
              </div>

              <dl className="ijp-detail-grid ijp-detail mb-0">
                {DETAILS.map((field) => (
                  <div key={field.key}>
                    <dt>{field.label}</dt>
                    {company[field.key] ? (
                      field.link ? (
                        <dd>
                          <a href={company[field.key]} target="_blank" rel="noreferrer noopener">
                            {company[field.key]}
                          </a>
                        </dd>
                      ) : (
                        <dd>{company[field.key]}</dd>
                      )
                    ) : (
                      <dd className="ijp-detail--empty" />
                    )}
                  </div>
                ))}
              </dl>

              {company.description ? (
                <div className="mt-4">
                  <span className="ijp-label d-block mb-1">Description</span>
                  <p className="mb-0">{company.description}</p>
                </div>
              ) : null}
            </div>
          </div>

          <div className="col-12 col-xl-4">
            <div className="ijp-card p-3 p-md-4">
              <p className="ijp-label mb-2">Decision</p>
              <label className="ijp-field-label" htmlFor="companyNote">
                Review note
              </label>
              <textarea
                id="companyNote"
                className="form-control mb-2"
                rows={4}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Required when rejecting. The employer sees this."
              />
              <p className="ijp-field-hint mb-3">
                Approving activates this company's recruiter accounts and lets them publish
                vacancies to students.
              </p>

              <div className="d-grid gap-2">
                <button
                  type="button"
                  className="btn btn-ijp-primary"
                  onClick={() => decide("APPROVED")}
                  disabled={busy}
                >
                  <i className="bi bi-check2-circle me-1" aria-hidden="true" />
                  {busy ? "Saving..." : "Approve company"}
                </button>
                <button
                  type="button"
                  className="btn btn-ijp-quiet ijp-btn-danger"
                  onClick={() => decide("REJECTED")}
                  disabled={busy}
                >
                  <i className="bi bi-x-circle me-1" aria-hidden="true" />
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
