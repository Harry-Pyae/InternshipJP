import { useState } from "react";
import { Link } from "react-router-dom";
import AuthField from "./AuthField.jsx";
import ErrorAlert from "../../components/shared/ErrorAlert.jsx";
import { authApi } from "../../api/authApi.js";
import { describeApiError, ensureCsrfToken } from "../../api/axiosClient.js";
import { useLanguage } from "../../config/languageContext.jsx";

/**
 * Getting back in without an administrator.
 *
 * One page with two steps rather than two pages: the person already has the
 * email open, and sending them somewhere else to paste a code is where these
 * flows lose people.
 *
 * The first step always reports success, even for an address with no account.
 * Saying "no account found" would turn this into a way to discover who is
 * registered.
 */
export default function ForgotPasswordPage() {
  const { t } = useLanguage();

  const [step, setStep] = useState("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function requestCode() {
    if (!email.trim()) {
      setError("Enter the email address you sign in with.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await ensureCsrfToken();
      const result = await authApi.forgotPassword(email.trim());
      setNotice(result?.message ?? "");
      setStep("reset");
    } catch (requestError) {
      setError(describeApiError(requestError));
    } finally {
      setBusy(false);
    }
  }

  async function submitReset() {
    setBusy(true);
    setError(null);
    try {
      await authApi.resetPassword({ email: email.trim(), code: code.trim(), newPassword });
      setStep("done");
    } catch (requestError) {
      setError(describeApiError(requestError));
    } finally {
      setBusy(false);
    }
  }

  if (step === "done") {
    return (
      <div className="ijp-auth-form">
        <h1 className="ijp-auth-title">{t("Password changed")}</h1>
        <p className="ijp-auth-sub">
          {t("You can sign in with your new password now.")}
        </p>
        <Link className="btn btn-ijp-primary w-100" to="/auth/login">
          {t("Sign in")}
        </Link>
      </div>
    );
  }

  return (
    <div className="ijp-auth-form">
      <h1 className="ijp-auth-title">{t("Forgot your password?")}</h1>
      <p className="ijp-auth-sub">
        {step === "request"
          ? t("Enter your email and we will send a code.")
          : t("Enter the code from the email and choose a new password.")}
      </p>

      <ErrorAlert message={error} />

      {notice && step === "reset" ? (
        <div className="ijp-callout mb-3" role="status">
          <i className="bi bi-envelope-check ijp-callout-icon" aria-hidden="true" />
          <p className="mb-0">{notice}</p>
        </div>
      ) : null}

      <AuthField
        id="forgotEmail"
        type="email"
        label={t("Email")}
        icon="bi-envelope"
        value={email}
        onChange={setEmail}
        disabled={step === "reset"}
      />

      {step === "reset" ? (
        <>
          <AuthField
            id="forgotCode"
            label={t("Code from the email")}
            icon="bi-key"
            value={code}
            onChange={setCode}
            placeholder="123456"
            inputMode="numeric"
          />
          <AuthField
            id="forgotNewPassword"
            type="password"
            label={t("New password")}
            icon="bi-lock"
            value={newPassword}
            onChange={setNewPassword}
            hint={t("At least 8 characters.")}
          />
        </>
      ) : null}

      <button
        type="button"
        className="btn btn-ijp-primary w-100 mt-2"
        onClick={step === "request" ? requestCode : submitReset}
        disabled={busy || (step === "reset" && (!code.trim() || newPassword.length < 8))}
      >
        {busy
          ? t("Please wait...")
          : step === "request"
            ? t("Send me a code")
            : t("Change my password")}
      </button>

      {step === "reset" ? (
        <button
          type="button"
          className="btn btn-ijp-quiet w-100 mt-2"
          onClick={requestCode}
          disabled={busy}
        >
          {t("Send another code")}
        </button>
      ) : null}

      <p className="ijp-auth-alt mt-3">
        <Link to="/auth/login">{t("Back to sign in")}</Link>
      </p>
    </div>
  );
}
