import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { authApi } from "../../api/authApi.js";
import { useAuth, homeFor } from "../../config/authContext.jsx";
import { describeApiError, fieldErrorsOf, ensureCsrfToken } from "../../api/axiosClient.js";
import LoadingBlock from "../../components/shared/LoadingBlock.jsx";
import AuthIllustration from "./AuthIllustration.jsx";

/**
 * Create an account, as a student or an employer.
 *
 * There is deliberately no administrator option. Admins are created once by
 * the bootstrap runner - a public "register as admin" form would be an open
 * door to the whole platform.
 *
 * An employer account starts PENDING and its company starts PENDING: they can
 * sign in, but cannot publish a vacancy until an administrator approves the
 * company. The form says so rather than letting them find out later.
 *
 * TODO MEMBER_2: yours to finish - email confirmation, a password strength
 * meter, and any extra fields you want at sign-up. The registration payloads
 * are in documentation/API_CONTRACT.md.
 */
export default function RegisterPage() {
  const { user, loading, signIn } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState("STUDENT");
  const [form, setForm] = useState({
    email: "",
    password: "",
    fullName: "",
    university: "",
    degree: "",
    companyName: "",
    industry: "",
    jobTitle: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState(null);

  if (loading) {
    return <LoadingBlock label="Checking your session..." />;
  }
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
      await ensureCsrfToken();
      if (role === "STUDENT") {
        await authApi.registerStudent({
          email: form.email,
          password: form.password,
          fullName: form.fullName,
          university: form.university || undefined,
          degree: form.degree || undefined,
        });
      } else {
        await authApi.registerEmployer({
          email: form.email,
          password: form.password,
          fullName: form.fullName,
          companyName: form.companyName,
          industry: form.industry || undefined,
          jobTitle: form.jobTitle || undefined,
        });
      }

      // Registration does not sign you in, so do it here - nobody wants to
      // type the same password twice in a row.
      const signedIn = await signIn({ email: form.email, password: form.password });
      navigate(homeFor(signedIn.role), { replace: true });
    } catch (registerError) {
      setError(describeApiError(registerError));
      setFieldErrors(fieldErrorsOf(registerError));
    } finally {
      setBusy(false);
    }
  }

  const isStudent = role === "STUDENT";

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
        <h1 className="ijp-page-title mb-1">Create your account</h1>
        <p className="ijp-muted mb-4">Find opportunities, or find people to hire.</p>

        <div className="btn-group w-100 mb-4" role="group" aria-label="Account type">
          <button
            type="button"
            className={`btn ${isStudent ? "btn-ijp-primary" : "btn-ijp-quiet"}`}
            onClick={() => setRole("STUDENT")}
          >
            <i className="bi bi-mortarboard me-2" aria-hidden="true" />
            I&apos;m a student
          </button>
          <button
            type="button"
            className={`btn ${isStudent ? "btn-ijp-quiet" : "btn-ijp-primary"}`}
            onClick={() => setRole("EMPLOYER")}
          >
            <i className="bi bi-briefcase me-2" aria-hidden="true" />
            I&apos;m an employer
          </button>
        </div>

        {error ? (
          <div className="alert alert-danger py-2 px-3 small" role="alert">
            {error}
          </div>
        ) : null}

        <form onSubmit={submit} className="d-grid gap-3">
          <Field
            id="regFullName"
            label="Full name"
            value={form.fullName}
            onChange={(value) => update("fullName", value)}
            error={fieldErrors?.fullName}
            required
          />
          <Field
            id="regEmail"
            label="Email"
            type="email"
            value={form.email}
            onChange={(value) => update("email", value)}
            error={fieldErrors?.email}
            autoComplete="username"
            required
          />
          <Field
            id="regPassword"
            label="Password"
            type="password"
            value={form.password}
            onChange={(value) => update("password", value)}
            error={fieldErrors?.password}
            hint="At least 8 characters."
            autoComplete="new-password"
            required
          />

          {isStudent ? (
            <>
              <Field
                id="regUniversity"
                label="University"
                optional
                value={form.university}
                onChange={(value) => update("university", value)}
              />
              <Field
                id="regDegree"
                label="Degree"
                optional
                value={form.degree}
                onChange={(value) => update("degree", value)}
              />
            </>
          ) : (
            <>
              <Field
                id="regCompany"
                label="Company name"
                value={form.companyName}
                onChange={(value) => update("companyName", value)}
                error={fieldErrors?.companyName}
                required
              />
              <Field
                id="regIndustry"
                label="Industry"
                optional
                value={form.industry}
                onChange={(value) => update("industry", value)}
              />
              <Field
                id="regJobTitle"
                label="Your job title"
                optional
                value={form.jobTitle}
                onChange={(value) => update("jobTitle", value)}
              />
              <p className="ijp-muted small mb-0">
                <i className="bi bi-info-circle me-1" aria-hidden="true" />
                Employer accounts are reviewed by an administrator. You can sign in straight
                away, but your vacancies stay hidden until the company is approved.
              </p>
            </>
          )}

          <button className="btn btn-ijp-primary" type="submit" disabled={busy}>
            {busy ? "Creating your account..." : "Create account"}
          </button>
        </form>

        <p className="ijp-muted small mt-4 mb-0">
          Already have an account? <Link to="/auth/login">Sign in</Link>
        </p>
        </div>
      </div>
    </div>
  );
}

function Field({ id, label, value, onChange, type = "text", error, hint, optional, ...rest }) {
  return (
    <div>
      <label className="form-label small fw-semibold" htmlFor={id}>
        {label}
        {optional ? <span className="ijp-muted fw-normal"> (optional)</span> : null}
      </label>
      <input
        id={id}
        type={type}
        className={`form-control${error ? " is-invalid" : ""}`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        {...rest}
      />
      {error ? <div className="invalid-feedback">{error}</div> : null}
      {hint && !error ? <p className="ijp-muted small mb-0 mt-1">{hint}</p> : null}
    </div>
  );
}
