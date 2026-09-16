import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageHeader from "../../components/shared/PageHeader.jsx";
import SectionCard from "../../components/shared/SectionCard.jsx";
import ErrorAlert from "../../components/shared/ErrorAlert.jsx";
import LoadingBlock from "../../components/shared/LoadingBlock.jsx";
import PhotoCard from "../../components/shared/PhotoCard.jsx";
import AuthField from "../auth/AuthField.jsx";
import { employerApi } from "../../api/employerApi.js";
import { describeApiError } from "../../api/axiosClient.js";
import { useLanguage } from "../../config/languageContext.jsx";
import PhoneField from "../../components/shared/PhoneField.jsx";

const EMPTY = { jobTitle: "", department: "", workEmail: "", contactPhone: "" };

/**
 * Editing an employer's own details, photo and company logo.
 *
 * Laid out like the student edit page: the images on the left, the form on the
 * right, and nothing on this page that only displays. The profile page shows
 * the record; this one changes it.
 */
export default function EmployerProfileEditPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    employerApi
      .getProfile()
      .then((profile) =>
        setForm({
          jobTitle: profile.jobTitle ?? "",
          department: profile.department ?? "",
          workEmail: profile.workEmail ?? "",
          contactPhone: profile.contactPhone ?? "",
        }),
      )
      .catch((requestError) => setError(describeApiError(requestError)));
  }, []);

  function set(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await employerApi.updateProfile(form);
      navigate("/employer/profile");
    } catch (requestError) {
      setError(describeApiError(requestError));
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Edit profile"
        subtitle="Your recruiter details and photo. The company logo is on the company page."
        action={
          <Link className="btn btn-sm btn-ijp-quiet" to="/employer/profile">
            <i className="bi bi-arrow-left me-1" aria-hidden="true" />
            {t("Back to my profile")}
          </Link>
        }
      />

      <ErrorAlert message={error} />

      {form === null && !error ? (
        <div className="ijp-card p-4">
          <LoadingBlock label={t("Loading profile...")} />
        </div>
      ) : form ? (
        <div className="row g-4">
          <div className="col-12 col-xl-5">
            <PhotoCard onError={setError} />
          </div>

          <div className="col-12 col-xl-7">
            <SectionCard title="Recruiter details">
              <form onSubmit={submit} className="d-grid gap-3">
                <AuthField
                  id="jobTitle"
                  label={t("Job title")}
                  icon="bi-briefcase"
                  value={form.jobTitle}
                  onChange={(value) => set("jobTitle", value)}
                  hint={t("Shown beside your name to students and administrators.")}
                maxLength={150}
                  />

                <AuthField
                  id="department"
                  label={t("Department")}
                  icon="bi-diagram-2"
                  value={form.department}
                  onChange={(value) => set("department", value)}
                maxLength={150}
                  />

                <AuthField
                  id="workEmail"
                  label={t("Work email")}
                  icon="bi-envelope"
                  type="email"
                  value={form.workEmail}
                  onChange={(value) => set("workEmail", value)}
                  hint={t("Optional. Your sign-in email is not changed by this.")}
                maxLength={190}
                  />

                <PhoneField
                  id="contactPhone"
                  label="Contact phone"
                  value={form.contactPhone}
                  onChange={(value) => set("contactPhone", value)}
                
                  maxLength={16}
                />

                <div className="d-flex gap-2">
                  <button className="btn btn-ijp-primary" type="submit" disabled={busy}>
                    {busy ? t("Saving...") : t("Save changes")}
                  </button>
                  <Link className="btn btn-ijp-quiet" to="/employer/profile">
                    {t("Cancel")}
                  </Link>
                </div>
              </form>
            </SectionCard>
          </div>
        </div>
      ) : null}
    </>
  );
}
