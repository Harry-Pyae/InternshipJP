import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageHeader from "../../components/shared/PageHeader.jsx";
import StatusBadge from "../../components/shared/StatusBadge.jsx";
import ErrorAlert from "../../components/shared/ErrorAlert.jsx";
import LoadingBlock from "../../components/shared/LoadingBlock.jsx";
import { studentApi } from "../../api/studentApi.js";
import { describeApiError } from "../../api/axiosClient.js";

/**
 * One vacancy, and the button that applies to it.
 */
export default function StudentInternshipDetailPage() {
  const { id } = useParams();
  const [internship, setInternship] = useState(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [applied, setApplied] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      setInternship(await studentApi.getInternship(id));
    } catch (requestError) {
      setError(describeApiError(requestError));
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function apply() {
    setBusy(true);
    setError(null);
    try {
      await studentApi.apply(id, coverLetter.trim());
      setApplied(true);
    } catch (requestError) {
      const status = requestError?.response?.status;
      setError(
        status === 409
          ? "You have already applied to this internship."
          : describeApiError(requestError),
      );
      setBusy(false);
    }
  }

  if (internship === null && !error) {
    return <LoadingBlock label="Loading the internship..." />;
  }

  return (
    <>
      <PageHeader
        title={internship?.title ?? "Internship"}
        subtitle={
          internship
            // InternshipDetailResponse nests the company as an object - there
            // is no companyName on it, which is why the header read
            // "undefined · Yangon".
            ? `${internship.company?.name ?? "Company"}${
                internship.location ? ` · ${internship.location}` : ""
              }`
            : ""
        }
        action={
          <Link className="btn btn-sm btn-ijp-quiet" to="/student/internships">
            <i className="bi bi-arrow-left me-1" aria-hidden="true" />
            Back to list
          </Link>
        }
      />

      <ErrorAlert message={error} />

      {internship ? (
        <div className="row g-4">
          <div className="col-12 col-xl-8">
            <div className="ijp-card p-3 p-md-4">
              <div className="d-flex flex-wrap gap-2 mb-4">
                <StatusBadge value={internship.status} />
                {internship.workMode ? (
                  <span className="ijp-issue">
                    <i className="bi bi-geo-alt" aria-hidden="true" />
                    {internship.workMode.toLowerCase()}
                  </span>
                ) : null}
                {internship.durationMonths ? (
                  <span className="ijp-issue">
                    <i className="bi bi-clock" aria-hidden="true" />
                    {internship.durationMonths} months
                  </span>
                ) : null}
                {internship.stipendAmount ? (
                  <span className="ijp-issue">
                    <i className="bi bi-cash" aria-hidden="true" />
                    {internship.stipendAmount}
                    {internship.stipendCurrency ? ` ${internship.stipendCurrency}` : ""}
                    {internship.stipendCurrency ? ` ${internship.stipendCurrency}` : ""}
                  </span>
                ) : null}
              </div>

              {internship.requiredSkills?.length ? (
                <div className="mb-4">
                  <p className="ijp-label mb-2">Skills asked for</p>
                  <div className="ijp-pill-row">
                    {internship.requiredSkills.map((skill) => (
                      <span className="ijp-pill-skill ijp-pill-skill--learn" key={skill}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              <Block title="Description" text={internship.description} />
              <Block title="Responsibilities" text={internship.responsibilities} />
              <Block title="Requirements" text={internship.requirements} />
            </div>
          </div>

          <div className="col-12 col-xl-4">
            <div className="ijp-card p-3 p-md-4">
              {applied ? (
                <div className="text-center py-3">
                  <i
                    className="bi bi-check2-circle ijp-state--ok"
                    style={{ fontSize: "2rem" }}
                    aria-hidden="true"
                  />
                  <p className="fw-semibold mt-2 mb-1">Application sent</p>
                  <p className="ijp-muted small mb-3">
                    The employer can see it now. You can follow its progress under My
                    applications.
                  </p>
                  <Link className="btn btn-ijp-quiet btn-sm" to="/student/applications">
                    View my applications
                  </Link>
                </div>
              ) : (
                <>
                  <p className="ijp-label mb-2">Apply</p>
                  <label className="ijp-field-label" htmlFor="coverLetter">
                    Cover letter <span className="ijp-muted fw-normal">(optional)</span>
                  </label>
                  <textarea
                    id="coverLetter"
                    className="form-control mb-2"
                    rows={6}
                    value={coverLetter}
                    onChange={(event) => setCoverLetter(event.target.value)}
                    placeholder="Why you are a good fit for this role."
                  />
                  <p className="ijp-field-hint mb-3">
                    Your profile, skills and verified certificates are sent with the
                    application automatically.
                  </p>
                  <button
                    type="button"
                    className="btn btn-ijp-primary w-100"
                    onClick={apply}
                    disabled={busy || internship.status !== "OPEN"}
                  >
                    {busy
                      ? "Sending..."
                      : internship.status === "OPEN"
                        ? "Apply for this internship"
                        : "Not accepting applications"}
                  </button>
                </>
              )}

              {internship.applicationDeadline ? (
                <p className="ijp-muted small mt-3 mb-0">
                  <i className="bi bi-calendar-event me-1" aria-hidden="true" />
                  Closes {internship.applicationDeadline}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function Block({ title, text }) {
  if (!text) {
    return null;
  }
  return (
    <div className="mb-4">
      <p className="ijp-label mb-2">{title}</p>
      <p className="mb-0" style={{ whiteSpace: "pre-line", lineHeight: 1.6 }}>
        {text}
      </p>
    </div>
  );
}
