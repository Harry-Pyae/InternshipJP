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

/**
 * Account settings, shared by all three roles.
 */
export default function AccountSettingsPage() {
  const { refresh } = useAuth();

  const [account, setAccount] = useState(null);
  const [error, setError] = useState(null);

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


      </div>
    </>
  );
}
