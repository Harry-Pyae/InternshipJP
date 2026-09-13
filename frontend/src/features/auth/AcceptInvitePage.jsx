import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthField from "./AuthField.jsx";
import { authApi } from "../../api/authApi.js";
import { describeApiError } from "../../api/axiosClient.js";
import { useLanguage } from "../../config/languageContext.jsx";

/**
 * Accepting an administrator invitation.
 *
 * Reachable without signing in, because somebody accepting an invitation has
 * no account they can sign into yet: the one created for them has a password
 * nobody knows. This page is the only route by which it becomes usable.
 *
 * The invitee chooses their own password. An administrator setting another
 * person's password would mean two people knew it, which is not a credential.
 */
export default function AcceptInvitePage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [form, setForm] = useState({
    email: params.get("email") ?? "",
    code: "",
    newPassword: "",
    confirm: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  function set(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");

    if (form.newPassword !== form.confirm) {
      setError(t("The two passwords do not match."));
      return;
    }

    setBusy(true);
    try {
      await authApi.acceptInvite({
        email: form.email.trim(),
        code: form.code.trim(),
        newPassword: form.newPassword,
      });
      setDone(true);
    } catch (requestError) {
      setError(describeApiError(requestError));
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="ijp-auth-form">
        <h1 className="ijp-auth-title">{t("Your account is ready")}</h1>
        <p className="ijp-auth-sub">
          {t("Sign in with the password you just chose. You have administrator access.")}
        </p>
        <button
          type="button"
          className="btn btn-ijp-primary w-100"
          onClick={() => navigate("/auth/login")}
        >
          {t("Go to sign in")}
        </button>
      </div>
    );
  }

  return (
    <div className="ijp-auth-form">
      <h1 className="ijp-auth-title">{t("Accept your invitation")}</h1>
      <p className="ijp-auth-sub">
        {t("Enter the code from your invitation email and choose a password. The account cannot be used until you do.")}
      </p>

      {error ? (
        <div className="ijp-auth-error" role="alert">
          <i className="bi bi-exclamation-triangle" aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : null}

      <form onSubmit={submit} className="d-grid gap-3">
        <AuthField
          id="inviteEmail"
          label={t("Email")}
          icon="bi-envelope"
          type="email"
          value={form.email}
          onChange={(value) => set("email", value)}
          placeholder="you@example.com"
          autoComplete="username"
          required
        />

        <AuthField
          id="inviteCode"
          label={t("Invitation code")}
          icon="bi-key"
          value={form.code}
          onChange={(value) => set("code", value)}
          placeholder="000000"
          hint={t("Six digits, from the email. It expires 72 hours after it was sent.")}
          autoComplete="one-time-code"
          required
        />

        <AuthField
          id="invitePassword"
          label={t("Choose a password")}
          icon="bi-lock"
          type="password"
          value={form.newPassword}
          onChange={(value) => set("newPassword", value)}
          hint={t("At least 8 characters.")}
          autoComplete="new-password"
          required
        />

        <AuthField
          id="inviteConfirm"
          label={t("Confirm the password")}
          icon="bi-lock"
          type="password"
          value={form.confirm}
          onChange={(value) => set("confirm", value)}
          autoComplete="new-password"
          required
        />

        <button className="btn btn-ijp-primary ijp-auth-submit" type="submit" disabled={busy}>
          {busy ? t("Setting up...") : t("Activate my account")}
        </button>
      </form>

      <p className="ijp-auth-alt mt-3">
        <Link to="/auth/login">{t("Back to sign in")}</Link>
      </p>
    </div>
  );
}
