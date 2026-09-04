import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth, homeFor } from "../../config/authContext.jsx";
import { describeApiError, fieldErrorsOf } from "../../api/axiosClient.js";
import { rules, validate } from "../../api/validation.js";
import LoadingBlock from "../../components/shared/LoadingBlock.jsx";
import AuthField from "./AuthField.jsx";

/**
 * Sign in.
 *
 * After a successful sign-in the user goes to their own dashboard - students
 * to /student, employers to /employer, administrators to /admin - or back to
 * whatever page sent them here.
 *
 * TODO MEMBER_2: this is a working baseline, not the finished screen. Still
 * yours to add:
 *   - the 2FA challenge (the backend returns a normal session today even when
 *     2FA is enabled - see TODO MEMBER_2 in AuthService)
 *   - "remember me" and password reset
 *
 * Those three controls are deliberately absent rather than drawn and inert.
 * A checkbox that does nothing is the fake success the project brief forbids,
 * and a "forgot password" link that leads nowhere is worse than none: it makes
 * someone locked out believe there is a way back.
 */
export default function LoginPage() {
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

  const FIELD_RULES = {
    email: rules.email(),
    password: rules.required("Password"),
  };

  if (loading) {
    return <LoadingBlock label="Checking your session..." />;
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
    setTouched((current) => ({ ...current, [field]: true }));
    const found = validate(form, FIELD_RULES);
    setFieldErrors((current) => ({ ...current, [field]: found[field] ?? null }));
  }

  async function submit(event) {
    event.preventDefault();

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
            <i className="bi bi-box-arrow-in-right me-2" aria-hidden="true" />
            Sign in
          </span>
          <h1 className="ijp-auth-title">Welcome back</h1>
          <p className="ijp-muted mb-4">Sign in to continue to InternshipJP.</p>

          {error ? (
            <div className="ijp-auth-error" role="alert">
              <i className="bi bi-exclamation-octagon" aria-hidden="true" />
              <span>{error}</span>
            </div>
          ) : null}

          <form onSubmit={submit} className="d-grid gap-3">
            <AuthField
              id="loginEmail"
              label="Email"
              icon="bi-envelope"
              type="email"
              value={form.email}
              onChange={(value) => update("email", value)}
              onBlur={() => blur("email")}
              error={touched.email ? fieldErrors?.email : fieldErrors?.email}
              autoComplete="username"
              placeholder="you@example.com"
              required
              autoFocus
            />

            <AuthField
              id="loginPassword"
              label="Password"
              icon="bi-lock"
              type="password"
              value={form.password}
              onChange={(value) => update("password", value)}
              onBlur={() => blur("password")}
              error={fieldErrors?.password}
              autoComplete="current-password"
              placeholder="Your password"
              required
            />

            <button className="btn btn-ijp-primary ijp-auth-submit" type="submit" disabled={busy}>
              {busy ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <i className="bi bi-arrow-right ms-2" aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          <div className="ijp-auth-divider">
            <span>New to InternshipJP?</span>
          </div>

      <Link className="btn btn-ijp-quiet w-100" to="/auth/register">
        <i className="bi bi-person-plus me-2" aria-hidden="true" />
        Sign up
      </Link>
    </>
  );
}
