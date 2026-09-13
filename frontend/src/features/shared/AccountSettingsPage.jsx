import { useEffect, useState } from "react";
import PageHeader from "../../components/shared/PageHeader.jsx";
import SectionCard from "../../components/shared/SectionCard.jsx";
import ErrorAlert from "../../components/shared/ErrorAlert.jsx";
import LoadingBlock from "../../components/shared/LoadingBlock.jsx";
import AuthField from "../auth/AuthField.jsx";
import { accountApi } from "../../api/accountApi.js";
import { describeApiError, fieldErrorsOf } from "../../api/axiosClient.js";
import { rules, validate } from "../../api/validation.js";
import { useAuth } from "../../config/authContext.jsx";
import { useLanguage } from "../../config/languageContext.jsx";

/**
 * Account settings, shared by all three roles.
 */
export default function AccountSettingsPage() {
  const { t } = useLanguage();
  const { refresh } = useAuth();

  const [account, setAccount] = useState(null);
  const [error, setError] = useState(null);

  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const [profile, setProfile] = useState({ fullName: "", phone: "" });
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileDone, setProfileDone] = useState(false);
  const [profileErrors, setProfileErrors] = useState(null);

  const [password, setPassword] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordDone, setPasswordDone] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState(null);

  useEffect(() => {
    accountApi
      .me()
      .then((data) => {
        setAccount(data);
        setProfile({ fullName: data.fullName ?? "", phone: data.phone ?? "" });
      })
      .catch((requestError) => setError(describeApiError(requestError)));
  }, []);

  async function saveProfile(event) {
    event.preventDefault();
    const found = validate(profile, { fullName: rules.required("Full name") });
    if (Object.keys(found).length > 0) {
      setProfileErrors(found);
      return;
    }
    setProfileBusy(true);
    setProfileErrors(null);
    setProfileDone(false);
    try {
      const updated = await accountApi.update(profile);
      setAccount(updated);
      setProfileDone(true);
      // The name shows in the sidebar and the top-right menu, so the session
      // has to be re-read or those keep the old one until a reload.
      refresh();
    } catch (requestError) {
      setError(describeApiError(requestError));
      setProfileErrors(fieldErrorsOf(requestError));
    } finally {
      setProfileBusy(false);
    }
  }

  async function savePassword(event) {
    event.preventDefault();
    const found = validate(password, {
      currentPassword: rules.required("Current password"),
      newPassword: rules.password(),
    });
    if (password.newPassword !== password.confirmPassword) {
      found.confirmPassword = "The two passwords do not match.";
    }
    if (Object.keys(found).length > 0) {
      setPasswordErrors(found);
      return;
    }
    setPasswordBusy(true);
    setPasswordErrors(null);
    setPasswordDone(false);
    try {
      await accountApi.changePassword({
        currentPassword: password.currentPassword,
        newPassword: password.newPassword,
      });
      setPassword({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordDone(true);
    } catch (requestError) {
      setPasswordErrors(fieldErrorsOf(requestError));
      setError(describeApiError(requestError));
    } finally {
      setPasswordBusy(false);
    }
  }

  if (account === null && !error) {
    return <LoadingBlock label="Loading your account..." />;
  }

  // Deleting your own account. The typed confirmation is deliberate: a

  // dialog dismissed with Enter is not a decision, and this removes the

  // profile, applications and certificates with no way back.

  const canDelete =

    deletePassword.length > 0 && deleteConfirm.trim().toUpperCase() === "DELETE";


  async function deleteAccount() {

    setDeleteBusy(true);

    setDeleteError(null);

    try {

      await accountApi.deleteMyAccount(deletePassword);

      // The session is already gone on the server, so reload rather than

      // navigate: it clears every piece of cached account state.

      window.location.assign("/auth/login");

    } catch (requestError) {

      setDeleteError(describeApiError(requestError));

      setDeleteBusy(false);

    }

  }


  return (
    <>
      <PageHeader title="Settings" subtitle="Your account, password and sign-in security." />

      <ErrorAlert message={error} />

      <div className="row g-4">
        <div className="col-12 col-xl-6">
          <SectionCard title="Account details">
            <form onSubmit={saveProfile} className="d-grid gap-3">
              <AuthField
                id="setName"
                label="Full name"
                icon="bi-person"
                value={profile.fullName}
                onChange={(value) => setProfile((c) => ({ ...c, fullName: value }))}
                error={profileErrors?.fullName}
                required
              />
              <AuthField
                id="setPhone"
                label="Phone"
                icon="bi-telephone"
                optional
                value={profile.phone}
                onChange={(value) => setProfile((c) => ({ ...c, phone: value }))}
                error={profileErrors?.phone}
              />

              <div>
                <span className="ijp-field-label d-block">Email</span>
                <p className="ijp-data mb-0">{account?.email}</p>
                <p className="ijp-field-hint">
                  Your email is your sign-in name and cannot be changed here.
                </p>
              </div>

              <div className="d-flex align-items-center gap-3">
                <button className="btn btn-ijp-primary" type="submit" disabled={profileBusy}>
                  {profileBusy ? "Saving..." : "Save changes"}
                </button>
                {profileDone ? (
                  <span className="ijp-state--ok small">
                    <i className="bi bi-check2-circle me-1" aria-hidden="true" />
                    Saved
                  </span>
                ) : null}
              </div>
            </form>
          </SectionCard>
        </div>

        <div className="col-12 col-xl-6">
          <SectionCard title="Password">
            <form onSubmit={savePassword} className="d-grid gap-3">
              <AuthField
                id="setCurrent"
                label="Current password"
                icon="bi-lock"
                type="password"
                autoComplete="current-password"
                value={password.currentPassword}
                onChange={(value) => setPassword((c) => ({ ...c, currentPassword: value }))}
                error={passwordErrors?.currentPassword}
                required
              />
              <AuthField
                id="setNew"
                label="New password"
                icon="bi-shield-lock"
                type="password"
                autoComplete="new-password"
                hint="At least 8 characters."
                value={password.newPassword}
                onChange={(value) => setPassword((c) => ({ ...c, newPassword: value }))}
                error={passwordErrors?.newPassword}
                required
              />
              <AuthField
                id="setConfirm"
                label="Confirm new password"
                icon="bi-shield-check"
                type="password"
                autoComplete="new-password"
                value={password.confirmPassword}
                onChange={(value) => setPassword((c) => ({ ...c, confirmPassword: value }))}
                error={passwordErrors?.confirmPassword}
                required
              />

              <div className="d-flex align-items-center gap-3">
                <button className="btn btn-ijp-primary" type="submit" disabled={passwordBusy}>
                  {passwordBusy ? "Changing..." : "Change password"}
                </button>
                {passwordDone ? (
                  <span className="ijp-state--ok small">
                    <i className="bi bi-check2-circle me-1" aria-hidden="true" />
                    Password changed
                  </span>
                ) : null}
              </div>
            </form>
          </SectionCard>
        </div>



        <div className="col-12">
          <SectionCard title={t("Delete this account")}>
            <div className="ijp-danger-zone">
              <p className="ijp-danger-title">
                <i className="bi bi-exclamation-octagon" aria-hidden="true" />
                {t("This cannot be undone")}
              </p>
              <p className="ijp-muted small mb-3">{t("Deleting removes this account and everything attached to it: your profile, your applications and every certificate you have uploaded. Verified certificates are removed too and would have to be checked again if you register a second time.")}</p>

              <div className="ijp-callout ijp-callout--danger">
                <i className="bi bi-arrow-repeat ijp-callout-icon" aria-hidden="true" />
                <p className="mb-0">
                  <strong>{t("Registered under the wrong role?")}</strong> {t("Delete this account, then register again with the role you meant. A role cannot be changed once chosen, because the profile and its records are tied to it.")}
                </p>
              </div>

              <form className="d-grid gap-3" onSubmit={(event) => event.preventDefault()}>
                <AuthField
                  id="deleteAccountPassword"
                  type="password"
                  label={t("Your password")}
                  icon="bi-lock"
                  value={deletePassword}
                  onChange={setDeletePassword}
                  hint={t("Required, because deletion is permanent.")}
                />
                <AuthField
                  id="deleteAccountConfirm"
                  label={t("Type DELETE to confirm")}
                  icon="bi-exclamation-triangle"
                  value={deleteConfirm}
                  onChange={setDeleteConfirm}
                  placeholder="DELETE"
                />

                <ErrorAlert message={deleteError} />

                <div>
                  <button
                    type="button"
                    className="btn btn-ijp-quiet ijp-btn-danger"
                    onClick={deleteAccount}
                    disabled={!canDelete || deleteBusy}
                  >
                    <i className="bi bi-trash me-1" aria-hidden="true" />
                    {deleteBusy ? t("Deleting...") : t("Delete my account permanently")}
                  </button>
                </div>
              </form>
            </div>
          </SectionCard>
        </div>

      </div>
    </>
  );
}
