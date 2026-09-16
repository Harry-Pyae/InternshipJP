import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth, homeFor } from "../../config/authContext.jsx";
import { describeApiError, fieldErrorsOf } from "../../api/axiosClient.js";
import { rules, validate } from "../../api/validation.js";
import LoadingBlock from "../../components/shared/LoadingBlock.jsx";
import AuthField from "./AuthField.jsx";
import { useLanguage } from "../../config/languageContext.jsx";

/**
 * Sign in.
 */
export default function LoginPage() {
  const { t } = useLanguage();
  const { user, loading, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState(null);
  // A field is only "touched" once you have left it. Validating while someone
  // is still typing their email shouts "invalid" at every keystroke.
  const [touched, setTouched] = useState({});
  // Nothing is judged until a submit has been attempted.
  //
  // Validating on blur meant that tapping into the email box and out again -
  // or tapping anywhere else on the page - produced "Email is required." for a
  // field nobody had tried to use yet. After the first submit, blur checking
  // is useful, because then the person is correcting something rather than
  // being told off for looking.
  const [submitted, setSubmitted] = useState(false);

  const FIELD_RULES = {
    email: rules.email(),
    password: rules.required("Password"),
  };

  if (loading) {
    return <LoadingBlock variant="page" label={t("Checking your session...")} />;
  }

  // Already signed in? Nobody needs to see a login form twice.
  if (user) {
    return <Navigate to={homeFor(user.role)} replace />;
  }

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    // Clear a message as soon as the problem is fixed, but never introduce
    // one mid-typing.
    if (fieldErrors?.[field]) {
      setFieldErrors((current) => ({ ...current, [field]: null }));
    }
  }

  function blur(field) {
    if (!submitted) {
      setTouched((current) => ({ ...current, [field]: true }));
      return;
    }
    setTouched((current) => ({ ...current, [field]: true }));
    const found = validate(form, FIELD_RULES);
    setFieldErrors((current) => ({ ...current, [field]: found[field] ?? null }));
  }

  async function submit(event) {
    event.preventDefault();
    setSubmitted(true);

    // Check everything on submit, whether or not it has been touched.
    const found = validate(form, FIELD_RULES);
    if (Object.keys(found).length > 0) {
      setFieldErrors(found);
      setTouched({ email: true, password: true });
      return;
    }

    setBusy(true);
    setError(null);
    setFieldErrors(null);
    try {
      const signedIn = await signIn(form);
      const from = location.state?.from;
      navigate(from && from !== "/auth/login" ? from : homeFor(signedIn.role), { replace: true });
    } catch (loginError) {
      setError(describeApiError(loginError));
      setFieldErrors(fieldErrorsOf(loginError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <span className="ijp-auth-eyebrow">
            <i className="bi bi-box-arrow-in-right me-2" aria-hidden="true" />{t("Sign in")}</span>
          <h1 className="ijp-auth-title">{t("Welcome back")}</h1>
          <p className="ijp-muted mb-4">{t("Sign in to continue to InternshipJP.")}</p>

          {error ? (
            <div className="ijp-auth-error" role="alert">
              <i className="bi bi-exclamation-octagon" aria-hidden="true" />
              <span>{error}</span>
            </div>
          ) : null}

          <form onSubmit={submit} className="d-grid gap-3">
            <AuthField
              id="loginEmail"
              label={t("Email")}
              icon="bi-envelope"
              type="email"
              value={form.email}
              onChange={(value) => update("email", value)}
              onBlur={() => blur("email")}
              error={fieldErrors?.email}
              autoComplete="username"
              placeholder="you@example.com"
              required
              autoFocus
            maxLength={190}
                  />

            <AuthField
              id="loginPassword"
              label={t("Password")}
              icon="bi-lock"
              type="password"
              value={form.password}
              onChange={(value) => update("password", value)}
              onBlur={() => blur("password")}
              error={fieldErrors?.password}
              autoComplete="current-password"
              placeholder="Your password"
              required
            maxLength={72}
                  />

            <p className="ijp-auth-forgot">

              <Link to="/auth/forgot-password">{t("Forgot your password?")}</Link>

            </p>

            <button className="btn btn-ijp-primary ijp-auth-submit" type="submit" disabled={busy}>
              {busy ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />{t("Signing in...")}</>
              ) : (
                <>{t("Sign in")}<i className="bi bi-arrow-right ms-2" aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          <div className="ijp-auth-divider">
            <span>{t("New to InternshipJP?")}</span>
          </div>

      <Link className="btn btn-ijp-quiet w-100" to="/auth/register">
        <i className="bi bi-person-plus me-2" aria-hidden="true" />{t("Sign up")}</Link>
    </>
  );
}
