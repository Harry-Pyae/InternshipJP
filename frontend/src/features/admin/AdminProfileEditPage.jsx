import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageHeader from "../../components/shared/PageHeader.jsx";
import SectionCard from "../../components/shared/SectionCard.jsx";
import ErrorAlert from "../../components/shared/ErrorAlert.jsx";
import LoadingBlock from "../../components/shared/LoadingBlock.jsx";
import AuthField from "../auth/AuthField.jsx";
import { accountApi } from "../../api/accountApi.js";
import { describeApiError } from "../../api/axiosClient.js";
import { useLanguage } from "../../config/languageContext.jsx";
import PhotoCard from "../../components/shared/PhotoCard.jsx";

/**
 * Editing an administrator's own details.
 *
 * Deliberately short. Everything an administrator can change about themselves
 * is here; everything they cannot - role, status, email - is shown on the
 * profile page and not offered as a field, because presenting an input that
 * the server will refuse is worse than not presenting one.
 */
export default function AdminProfileEditPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    accountApi
      .me()
      .then((account) =>
        setForm({ fullName: account.fullName ?? "", phone: account.phone ?? "" }),
      )
      .catch((requestError) => setError(describeApiError(requestError)));
  }, []);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await accountApi.update(form);
      navigate("/admin/profile");
    } catch (requestError) {
      setError(describeApiError(requestError));
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Edit profile"
        subtitle="Your name and contact number, as other administrators see them."
        action={
          <Link className="btn btn-sm btn-ijp-quiet" to="/admin/profile">
            <i className="bi bi-arrow-left me-1" aria-hidden="true" />
            {t("Back to my profile")}
          </Link>
        }
      />

      <ErrorAlert message={error} />

      {form === null ? (
        <div className="ijp-card p-4">
          <LoadingBlock label={t("Loading profile...")} />
        </div>
      ) : (
        <div className="row g-4">
          <div className="col-12">
            <PhotoCard onError={setError} />
          </div>

          <div className="col-12 col-xl-7">
            <SectionCard title="Your details">
              <form onSubmit={submit} className="d-grid gap-3">
                <AuthField
                  id="adminFullName"
                  label={t("Full name")}
                  icon="bi-person"
                  value={form.fullName}
                  onChange={(value) => setForm((c) => ({ ...c, fullName: value }))}
                  hint={t("Shown beside your photo in the users list.")}
                  required
                />

                <AuthField
                  id="adminPhone"
                  label={t("Phone")}
                  icon="bi-telephone"
                  value={form.phone}
                  onChange={(value) => setForm((c) => ({ ...c, phone: value }))}
                  hint={t("Optional. Useful when another administrator needs to reach you.")}
                />

                <div className="d-flex gap-2">
                  <button className="btn btn-ijp-primary" type="submit" disabled={busy}>
                    {busy ? t("Saving...") : t("Save changes")}
                  </button>
                  <Link className="btn btn-ijp-quiet" to="/admin/profile">
                    {t("Cancel")}
                  </Link>
                </div>
              </form>
            </SectionCard>
          </div>

          <div className="col-12 col-xl-5">
            <SectionCard title="Not editable here">
              <p className="ijp-muted small mb-2">
                {t("Your email, role and account status cannot be changed from this page.")}
              </p>
              <p className="ijp-field-note mb-0">
                {t("The photo is changed on the profile page, and the password in Settings.")}
              </p>
            </SectionCard>
          </div>
        </div>
      )}
    </>
  );
}
