import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth, homeFor } from "../../config/authContext.jsx";
import { describeApiError, fieldErrorsOf } from "../../api/axiosClient.js";
import LoadingBlock from "../../components/shared/LoadingBlock.jsx";
import AuthIllustration from "./AuthIllustration.jsx";

/**
 * Sign in.
 *
 * After a successful sign-in the user goes to their own home page - students
 * to /student, employers to /employer, administrators to /admin - or back to
 * whatever page sent them here.
 *
 * TODO MEMBER_2: this is a working baseline, not the finished screen. Yours to
 * add:
 *   - the 2FA challenge (the backend returns a normal session today even when
 *     2FA is enabled - see TODO MEMBER_2 in AuthService)
 *   - "remember me", password reset, and lockout after repeated failures
 *   - whatever visual treatment you want. Keep the redirect behaviour.
 */
export default function LoginPage() {
  const { user, loading, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState(null);

  if (loading) {
    return <LoadingBlock label="Checking your session..." />;
  }

  // Already signed in? Nobody needs to see a login form twice.
  if (user) {
    return <Navigate to={homeFor(user.role)} replace />;
  }

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
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
    <div className="ijp-auth">
      <div className="ijp-card ijp-auth-card">
        <aside className="ijp-auth-aside">
          <p className="ijp-brand mb-1" style={{ fontSize: "1.25rem" }}>
            Internship<span className="ijp-brand-mark">JP</span>
          </p>
          <p className="ijp-muted mb-4">Find opportunities. Build your future.</p>
          <AuthIllustration />
        </aside>

        <div className="ijp-auth-form">
        <h1 className="ijp-page-title mb-1">Welcome back</h1>
        <p className="ijp-muted mb-4">Sign in to continue to InternshipJP.</p>

        {error ? (
          <div className="alert alert-danger py-2 px-3 small" role="alert">
            {error}
          </div>
        ) : null}

        <form onSubmit={submit} className="d-grid gap-3">
          <div>
            <label className="form-label small fw-semibold" htmlFor="loginEmail">
              Email
            </label>
            <input
              id="loginEmail"
              type="email"
              className={`form-control${fieldErrors?.email ? " is-invalid" : ""}`}
              value={form.email}
              onChange={(event) => update("email", event.target.value)}
              autoComplete="username"
              required
              autoFocus
            />
            {fieldErrors?.email ? (
              <div className="invalid-feedback">{fieldErrors.email}</div>
            ) : null}
          </div>

          <div>
            <label className="form-label small fw-semibold" htmlFor="loginPassword">
              Password
            </label>
            <input
              id="loginPassword"
              type="password"
              className={`form-control${fieldErrors?.password ? " is-invalid" : ""}`}
              value={form.password}
              onChange={(event) => update("password", event.target.value)}
              autoComplete="current-password"
              required
            />
            {fieldErrors?.password ? (
              <div className="invalid-feedback">{fieldErrors.password}</div>
            ) : null}
          </div>

          <button className="btn btn-ijp-primary" type="submit" disabled={busy}>
            {busy ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="ijp-muted small mt-4 mb-0">
          Don&apos;t have an account? <Link to="/auth/register">Create one</Link>
        </p>

        {/*
          TODO MEMBER_2: three controls from the design mockup are deliberately
          absent, because a control that does nothing is exactly the fake
          success the project brief forbids. Add each one WITH its backend:
            - "Remember me"      needs a persistent-token login on the server
            - "Forgot password?" needs a reset-token endpoint and an email
            - "Select role"      the server already knows the role from the
                                 account. A picker here can only be ignored or
                                 used to reject a correct password, and both
                                 are worse than not having it.
        */}
        </div>
      </div>
    </div>
  );
}
