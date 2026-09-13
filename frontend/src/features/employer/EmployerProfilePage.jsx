import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../components/shared/PageHeader.jsx";
import SectionCard from "../../components/shared/SectionCard.jsx";
import ErrorAlert from "../../components/shared/ErrorAlert.jsx";
import LoadingBlock from "../../components/shared/LoadingBlock.jsx";
import Avatar from "../../components/shared/Avatar.jsx";
import { employerApi } from "../../api/employerApi.js";
import { describeApiError } from "../../api/axiosClient.js";
import { useLanguage } from "../../config/languageContext.jsx";
import { useAuth } from "../../config/authContext.jsx";

/**
 * The employer's own profile, read-only.
 *
 * It used to display and edit in the same place, with a Save button on a page
 * titled "My profile". Editing lives at /employer/profile/edit now, matching
 * the student and administrator pages: a page that shows a record should not
 * also be the one place you can change it.
 */
export default function EmployerProfilePage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      setProfile(await employerApi.getProfile());
    } catch (requestError) {
      setError(describeApiError(requestError));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <PageHeader
        title="My profile"
        subtitle="Your recruiter details as students and administrators see them."
        action={
          <Link className="btn btn-sm btn-ijp-primary" to="/employer/profile/edit">
            <i className="bi bi-pencil me-1" aria-hidden="true" />
            {t("Edit profile")}
          </Link>
        }
      />

      <ErrorAlert message={error} onRetry={load} />

      {profile === null && !error ? (
        <div className="ijp-card p-4">
          <LoadingBlock label={t("Loading profile...")} />
        </div>
      ) : profile ? (
        <>
          <div className="ijp-card p-3 p-md-4 mb-4">
            <div className="d-flex align-items-center gap-3 flex-wrap">
              <Avatar name={profile.fullName} userId={user?.id} size="lg" />
              <div style={{ minWidth: 0 }}>
                <p className="h5 mb-1">{profile.fullName}</p>
                <p className="ijp-muted mb-0">
                  {profile.jobTitle || t("No job title yet")}
                  {profile.company?.name ? ` · ${profile.company.name}` : ""}
                </p>
              </div>
            </div>
          </div>

          <div className="row g-4">
            <div className="col-12 col-xl-6">
              <SectionCard title="Recruiter details">
                <dl className="ijp-detail mb-0">
                  <dt>{t("Job title")}</dt>
                  <Value value={profile.jobTitle} t={t} />
                  <dt>{t("Department")}</dt>
                  <Value value={profile.department} t={t} />
                </dl>
              </SectionCard>
            </div>

            <div className="col-12 col-xl-6">
              <SectionCard title="Contact">
                <dl className="ijp-detail mb-0">
                  <dt>{t("Sign-in email")}</dt>
                  <dd className="ijp-data">{profile.email}</dd>
                  <dt>{t("Work email")}</dt>
                  <Value value={profile.workEmail} t={t} />
                  <dt>{t("Contact phone")}</dt>
                  <Value value={profile.contactPhone} t={t} />
                </dl>
              </SectionCard>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}

/** A stored value, or a visible note so a gap is obvious rather than blank. */
function Value({ value, t }) {
  if (value === null || value === undefined || value === "") {
    return (
      <dd className="ijp-muted">{t("Not set")}</dd>
    );
  }
  return <dd>{value}</dd>;
}
