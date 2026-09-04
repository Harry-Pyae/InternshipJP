import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { authApi } from "../../api/authApi.js";
import { useAuth, homeFor } from "../../config/authContext.jsx";
import { describeApiError, fieldErrorsOf, ensureCsrfToken } from "../../api/axiosClient.js";
import { rules, validate } from "../../api/validation.js";
import LoadingBlock from "../../components/shared/LoadingBlock.jsx";
import AuthField from "./AuthField.jsx";

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
    companyWebsite: "",
    industry: "",
    jobTitle: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState(null);

  // Rules follow the selected role, so an employer is never asked for a
  // university and a student is never asked for a company.
  const fieldRules = {
    fullName: rules.required("Full name"),
    email: rules.email(),
    password: rules.password(),
    ...(role === "EMPLOYER"
      ? {
          companyName: rules.required("Company name"),
          companyWebsite: rules.url("Company website"),
        }
      : {}),
  };

  if (loading) {
    return <LoadingBlock label="Checking your session..." />;
  }
  if (user) {
    return <Navigate to={homeFor(user.role)} replace />;
  }

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    if (fieldErrors?.[field]) {
      setFieldErrors((current) => ({ ...current, [field]: null }));
    }
  }

  function blur(field) {
    const found = validate(form, fieldRules);
    setFieldErrors((current) => ({ ...current, [field]: found[field] ?? null }));
  }

  /** Switching role clears messages about fields that no longer exist. */
  function pickRole(nextRole) {
    setRole(nextRole);
    setFieldErrors(null);
    setError(null);
  }

  async function submit(event) {
    event.preventDefault();

    const found = validate(form, fieldRules);
    if (Object.keys(found).length > 0) {
      setFieldErrors(found);
      return;
    }

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
          website: form.companyWebsite || undefined,
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
    <>
      <span className="ijp-auth-eyebrow">
            <i className="bi bi-person-plus me-2" aria-hidden="true" />
            Sign up
          </span>
          <h1 className="ijp-auth-title">Create your account</h1>
        <p className="ijp-muted mb-4">Find opportunities, or find people to hire.</p>

        <div className="btn-group w-100 mb-4" role="group" aria-label="Account type">
          <button
            type="button"
            className={`btn ${isStudent ? "btn-ijp-primary" : "btn-ijp-quiet"}`}
            onClick={() => pickRole("STUDENT")}
          >
            <i className="bi bi-mortarboard me-2" aria-hidden="true" />
            I&apos;m a student
          </button>
          <button
            type="button"
            className={`btn ${isStudent ? "btn-ijp-quiet" : "btn-ijp-primary"}`}
            onClick={() => pickRole("EMPLOYER")}
          >
            <i className="bi bi-briefcase me-2" aria-hidden="true" />
            I&apos;m an employer
          </button>
        </div>

        {error ? (
            <div className="ijp-auth-error" role="alert">
              <i className="bi bi-exclamation-octagon" aria-hidden="true" />
              <span>{error}</span>
            </div>
          ) : null}

        <form onSubmit={submit} className="d-grid gap-3">
          <AuthField
            id="regFullName"
            label="Full name"
            icon="bi-person"
            value={form.fullName}
            onChange={(value) => update("fullName", value)}
            onBlur={() => blur("fullName")}
            error={fieldErrors?.fullName}
            required
          />
          <AuthField
            id="regEmail"
            label="Email"
            icon="bi-envelope"
            type="email"
            value={form.email}
            onChange={(value) => update("email", value)}
            onBlur={() => blur("email")}
            error={fieldErrors?.email}
            autoComplete="username"
            required
          />
          <AuthField
            id="regPassword"
            label="Password"
            icon="bi-lock"
            type="password"
            value={form.password}
            onChange={(value) => update("password", value)}
            onBlur={() => blur("password")}
            error={fieldErrors?.password}
            hint="At least 8 characters."
            autoComplete="new-password"
            required
          />

          {isStudent ? (
            <div className="ijp-auth-row">
              <AuthField
                id="regUniversity"
                label="University"
                icon="bi-mortarboard"
                optional
                value={form.university}
                onChange={(value) => update("university", value)}
              />
              <AuthField
                id="regDegree"
                label="Degree"
                icon="bi-journal-text"
                optional
                value={form.degree}
                onChange={(value) => update("degree", value)}
              />
            </div>
          ) : (
            <>
              <AuthField
                id="regCompany"
                label="Company name"
                icon="bi-building"
                value={form.companyName}
                onChange={(value) => update("companyName", value)}
                onBlur={() => blur("companyName")}
                error={fieldErrors?.companyName}
                required
              />
              <AuthField
                id="regWebsite"
                label="Company website"
                icon="bi-globe"
                optional
                placeholder="https://example.com"
                value={form.companyWebsite}
                onChange={(value) => update("companyWebsite", value)}
                onBlur={() => blur("companyWebsite")}
                error={fieldErrors?.companyWebsite}
              />
              <div className="ijp-auth-row">
                <AuthField
                  id="regIndustry"
                  label="Industry"
                  icon="bi-diagram-3"
                  optional
                  value={form.industry}
                  onChange={(value) => update("industry", value)}
                />
                <AuthField
                  id="regJobTitle"
                  label="Your job title"
                  icon="bi-briefcase"
                  optional
                  value={form.jobTitle}
                  onChange={(value) => update("jobTitle", value)}
                />
              </div>
              <p className="ijp-muted small mb-0">
                <i className="bi bi-info-circle me-1" aria-hidden="true" />
                Employer accounts are reviewed by an administrator. You can sign in straight
                away, but your vacancies stay hidden until the company is approved.
              </p>
            </>
          )}

          <button className="btn btn-ijp-primary ijp-auth-submit" type="submit" disabled={busy}>
            {busy ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                Creating your account...
              </>
            ) : (
              <>
                Create account
                <i className="bi bi-arrow-right ms-2" aria-hidden="true" />
              </>
            )}
          </button>
        </form>

      <div className="ijp-auth-divider">
        <span>Already have an account?</span>
      </div>

      <Link className="btn btn-ijp-quiet w-100" to="/auth/login">
        <i className="bi bi-box-arrow-in-right me-2" aria-hidden="true" />
        Sign in
      </Link>
    </>
  );
}
