import { useCallback, useEffect, useState } from "react";

import PageHeader from "../../components/shared/PageHeader.jsx";
import SectionCard from "../../components/shared/SectionCard.jsx";
import LoadingBlock from "../../components/shared/LoadingBlock.jsx";
import ErrorAlert from "../../components/shared/ErrorAlert.jsx";
import StatusBadge from "../../components/shared/StatusBadge.jsx";

import { adminApi } from "../../api/adminApi.js";
import { describeApiError } from "../../api/axiosClient.js";

export default function AdminSettingsPage() {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [accountResult] = await Promise.all([
        adminApi.getAccount(),
      ]);
      setAccount(accountResult);
    } catch (requestError) {
      setError(describeApiError(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !account) {
    return <><PageHeader title="Settings" subtitle="Your administrator account and security." /><LoadingBlock label="Loading account settings..." /></>;
  }

  return (
    <>
      <PageHeader title="Settings" subtitle="Your administrator account and security." />
      <ErrorAlert message={error} onRetry={load} />
      {message ? <div className="alert alert-success" role="status">{message}</div> : null}

      <div className="row g-4">
        <div className="col-12 col-xl-6">
          <ProfileCard account={account} onSaved={(updated) => { setAccount(updated); setMessage("Profile updated."); }} onError={setError} />
        </div>
        <div className="col-12 col-xl-6">
          <PasswordCard onSaved={setMessage} onError={setError} />
        </div>
        <div className="col-12">
        </div>
      </div>
    </>
  );
}

function ProfileCard({ account, onSaved, onError }) {
  const [fullName, setFullName] = useState(account?.fullName || "");
  const [phone, setPhone] = useState(account?.phone || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFullName(account?.fullName || "");
    setPhone(account?.phone || "");
  }, [account]);

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    onError("");
    try {
      const updated = await adminApi.updateAccount({ fullName, phone });
      onSaved(updated);
    } catch (error) {
      onError(describeApiError(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <SectionCard title="Profile">
      <form onSubmit={save}>
        <label className="ijp-label mb-2" htmlFor="admin-full-name">Full name</label>
        <input id="admin-full-name" className="form-control mb-3" value={fullName} onChange={(event) => setFullName(event.target.value)} required maxLength={150} />

        <label className="ijp-label mb-2" htmlFor="admin-email">Email</label>
        <input id="admin-email" className="form-control mb-3" value={account?.email || ""} disabled />

        <label className="ijp-label mb-2" htmlFor="admin-phone">Phone</label>
        <input id="admin-phone" className="form-control mb-3" value={phone} onChange={(event) => setPhone(event.target.value)} maxLength={30} />

        <div className="d-flex justify-content-between align-items-center gap-2 mb-3">
          <span className="small">Role: <strong>{account?.role || "ADMIN"}</strong></span>
          <StatusBadge value={account?.accountStatus} />
        </div>

        <button type="submit" className="btn btn-ijp-primary" disabled={saving}>{saving ? "Saving..." : "Save profile"}</button>
      </form>
    </SectionCard>
  );
}

function PasswordCard({ onSaved, onError }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mismatch, setMismatch] = useState("");
  const [saving, setSaving] = useState(false);

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    onError("");
    try {
      // Checked here rather than only by the server: the API takes one new
      // password, so a typo would be saved silently and lock the admin out of
      // their own account on the next sign-in.
      if (newPassword !== confirmPassword) {
        setMismatch("The two passwords do not match.");
        // No setSaving(false) here - the finally below already does it,
        // and two paths clearing the same flag is one to forget later.
        return;
      }
      setMismatch("");

      const result = await adminApi.changePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onSaved(result.message || "Password changed.");
    } catch (error) {
      onError(describeApiError(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <SectionCard title="Change password">
      <form onSubmit={save}>
        <label className="ijp-label mb-2" htmlFor="admin-current-password">Current password</label>
        <input id="admin-current-password" type="password" className="form-control mb-3" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required />

        <label className="ijp-label mb-2" htmlFor="admin-new-password">New password</label>
        <input id="admin-new-password" type="password" className="form-control mb-3" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength={8} maxLength={100} required />

        <label className="ijp-label mb-2" htmlFor="admin-confirm-password">Confirm new password</label>
        <input
          id="admin-confirm-password"
          type="password"
          className={`form-control mb-1${mismatch ? " is-invalid" : ""}`}
          value={confirmPassword}
          onChange={(event) => {
            setConfirmPassword(event.target.value);
            if (mismatch) setMismatch("");
          }}
          autoComplete="new-password"
          minLength={8}
          maxLength={100}
          required
        />
        {mismatch ? <p className="ijp-field-error mb-3">{mismatch}</p> : <div className="mb-3" />}

        <p className="ijp-muted small">Use a new password that is different from your current password.</p>
        <button type="submit" className="btn btn-ijp-primary" disabled={saving}>{saving ? "Changing..." : "Change password"}</button>
      </form>
    </SectionCard>
  );
}

