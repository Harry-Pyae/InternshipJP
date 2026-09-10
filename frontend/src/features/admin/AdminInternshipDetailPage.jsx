import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import PageHeader from "../../components/shared/PageHeader.jsx";
import SectionCard from "../../components/shared/SectionCard.jsx";
import StatusBadge from "../../components/shared/StatusBadge.jsx";
import LoadingBlock from "../../components/shared/LoadingBlock.jsx";
import ErrorAlert from "../../components/shared/ErrorAlert.jsx";
import { adminApi } from "../../api/adminApi.js";
import { describeApiError } from "../../api/axiosClient.js";
import { useLanguage } from "../../config/languageContext.jsx";

/**
 * One internship, read-only.
 *
 * An administrator does not edit vacancies - that belongs to the company that
 * owns it. This exists so a listing in a report or a queue can be opened and
 * understood, which previously meant guessing from a table row.
 *
 * The fact strip matches the certificate and company review pages, so all
 * three read as one product.
 */
export default function AdminInternshipDetailPage() {
  const { id } = useParams();
  const { t } = useLanguage();

  const [internship, setInternship] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setInternship(await adminApi.getInternship(id));
    } catch (requestError) {
      setError(describeApiError(requestError));
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (internship === null && !error) {
    return <LoadingBlock label="Loading the internship..." />;
  }

  return (
    <>
      <PageHeader
        title={internship?.title ?? "Internship"}
        subtitle={internship?.company?.name ?? "Internship detail"}
        action={
          <Link className="btn btn-sm btn-ijp-quiet" to="/admin/internships">
            <i className="bi bi-arrow-left me-1" aria-hidden="true" />
            {t("Back to list")}
          </Link>
        }
      />

      <ErrorAlert message={error} onRetry={load} />

      {internship ? (
        <>
          <div className="ijp-fact-strip">
            <Fact label={t("Status")}>
              <StatusBadge value={internship.status} />
            </Fact>
            <Fact label={t("Company")}>{internship.company?.name || "—"}</Fact>
            <Fact label={t("Location")}>{internship.location || "Not given"}</Fact>
            <Fact label={t("Work mode")}>{internship.workMode || "Not given"}</Fact>
            <Fact label={t("Duration (months)")}>{internship.durationMonths ?? "—"}</Fact>
            <Fact label={t("Available positions")}>{internship.positionsAvailable ?? "—"}</Fact>
            <Fact label={t("Application deadline")}>
              {internship.applicationDeadline || t("No deadline")}
            </Fact>
            <Fact label={t("Created")}>
              {internship.createdAt?.replace("T", " ").slice(0, 16) || "—"}
            </Fact>
          </div>

          <div className="d-grid gap-4">
            <SectionCard title="Description">
              <p className="mb-0" style={{ whiteSpace: "pre-line", lineHeight: 1.65 }}>
                {internship.description || t("No description")}
              </p>
            </SectionCard>

            {internship.responsibilities ? (
              <SectionCard title="Responsibilities">
                <p className="mb-0" style={{ whiteSpace: "pre-line", lineHeight: 1.65 }}>
                  {internship.responsibilities}
                </p>
              </SectionCard>
            ) : null}

            {internship.requirements ? (
              <SectionCard title="Requirements">
                <p className="mb-0" style={{ whiteSpace: "pre-line", lineHeight: 1.65 }}>
                  {internship.requirements}
                </p>
              </SectionCard>
            ) : null}

            <SectionCard title="Required skills">
              {internship.requiredSkills?.length ? (
                <div className="ijp-pill-row">
                  {internship.requiredSkills.map((skill) => (
                    <span className="ijp-pill-skill" key={skill.id ?? skill.name ?? skill}>
                      {skill.name ?? skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="ijp-muted mb-0">
                  {t("No required skills, so students cannot be matched to it")}
                </p>
              )}
            </SectionCard>
          </div>
        </>
      ) : null}
    </>
  );
}

function Fact({ label, children }) {
  return (
    <div className="ijp-fact">
      <span className="ijp-fact-label">{label}</span>
      <span className="ijp-fact-value">{children}</span>
    </div>
  );
}
