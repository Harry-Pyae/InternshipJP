import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { authApi } from "../../api/authApi.js";
import { useAuth, homeFor } from "../../config/authContext.jsx";
import { describeApiError, fieldErrorsOf, ensureCsrfToken } from "../../api/axiosClient.js";
import { rules, validate } from "../../api/validation.js";
import LoadingBlock from "../../components/shared/LoadingBlock.jsx";
import AuthField from "./AuthField.jsx";
import { useLanguage } from "../../config/languageContext.jsx";

/**
 * Create an account, as a student or an employer.
 */
export default function RegisterPage() {
  const { t } = useLanguage();
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
    registrationNumber: "",
    contactEmail: "",
    country: "",
    location: "",
    address: "",
    linkedinUrl: "",
    contactPhone: "",
    companySize: "",
    foundedYear: "",
    description: "",
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
          registrationNumber: rules.required("Registration number"),
          contactEmail: rules.required("Contact email"),
          country: rules.required("Country"),
          location: rules.required("City"),
          companyWebsite: rules.url("Company website"),
        }
      : {}),
  };

  if (loading) {
    return <LoadingBlock variant="page" label={t("Checking your session...")} />;
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
          registrationNumber: form.registrationNumber,
          contactEmail: form.contactEmail,
          country: form.country,
          location: form.location,
          address: form.address || undefined,
          linkedinUrl: form.linkedinUrl || undefined,
          contactPhone: form.contactPhone || undefined,
          companySize: form.companySize || undefined,
          foundedYear: form.foundedYear ? Number(form.foundedYear) : undefined,
          description: form.description || undefined,
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
            <i className="bi bi-person-plus me-2" aria-hidden="true" />{t("Sign up")}</span>
          <h1 className="ijp-auth-title">{t("Create your account")}</h1>
        <p className="ijp-muted mb-4">{t("Find opportunities, or find people to hire.")}</p>

        <div className="btn-group w-100 mb-4" role="group" aria-label={t("Account type")}>
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
            label={t("Full name")}
            icon="bi-person"
            value={form.fullName}
            onChange={(value) => update("fullName", value)}
            onBlur={() => blur("fullName")}
            error={fieldErrors?.fullName}
            required
          />
          <AuthField
            id="regEmail"
            label={t("Email")}
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
            label={t("Password")}
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
                label={t("University")}
                icon="bi-mortarboard"
                optional
                value={form.university}
                onChange={(value) => update("university", value)}
              />
              <AuthField
                id="regDegree"
                label={t("Degree")}
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
                label={t("Company name")}
                icon="bi-building"
                value={form.companyName}
                onChange={(value) => update("companyName", value)}
                onBlur={() => blur("companyName")}
                error={fieldErrors?.companyName}
                required
              />
              <AuthField
                id="regWebsite"
                label={t("Company website")}
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
                  label={t("Industry")}
                  icon="bi-diagram-3"
                  optional
                  value={form.industry}
                  onChange={(value) => update("industry", value)}
                />
                <AuthField
                  id="regJobTitle"
                  label={t("Your job title")}
                  icon="bi-briefcase"
                  optional
                  value={form.jobTitle}
                  onChange={(value) => update("jobTitle", value)}
                />
              </div>

              {/* An administrator has to approve a real business. Without these
                  three there is nothing to verify against, and a company can be
                  registered under a person's name without anyone noticing. */}
              <div className="ijp-auth-row">
                <AuthField
                  id="regRegistration"
                  label={t("Business registration number")}
                  icon="bi-hash"
                  value={form.registrationNumber}
                  onChange={(value) => update("registrationNumber", value)}
                  onBlur={() => blur("registrationNumber")}
                  error={fieldErrors?.registrationNumber}
                  required
                  hint={t("An administrator checks this before approving you.")}
                />
                <AuthField
                  id="regContactEmail"
                  type="email"
                  label={t("Company contact email")}
                  icon="bi-envelope-at"
                  value={form.contactEmail}
                  onChange={(value) => update("contactEmail", value)}
                  onBlur={() => blur("contactEmail")}
                  error={fieldErrors?.contactEmail}
                  required
                />
              </div>

              <div className="ijp-auth-row">
                <AuthField
                  id="regCountry"
                  label={t("Country")}
                  icon="bi-globe2"
                  value={form.country}
                  onChange={(value) => update("country", value)}
                  onBlur={() => blur("country")}
                  error={fieldErrors?.country}
                  required
                />
                <AuthField
                  id="regCity"
                  label={t("City")}
                  icon="bi-geo-alt"
                  value={form.location}
                  onChange={(value) => update("location", value)}
                  onBlur={() => blur("location")}
                  error={fieldErrors?.location}
                  required
                />
              </div>

              <div className="ijp-auth-row">
                <AuthField
                  id="regAddress"
                  label={t("Address")}
                  icon="bi-pin-map"
                  optional
                  value={form.address}
                  onChange={(value) => update("address", value)}
                />
                <AuthField
                  id="regContactPhone"
                  label={t("Contact phone")}
                  icon="bi-telephone"
                  optional
                  value={form.contactPhone}
                  onChange={(value) => update("contactPhone", value)}
                />
              </div>

              <div className="ijp-auth-row">
                <AuthField
                  id="regCompanySize"
                  label={t("Company size")}
                  icon="bi-people"
                  optional
                  placeholder="e.g. 11-50"
                  value={form.companySize}
                  onChange={(value) => update("companySize", value)}
                />
                <AuthField
                  id="regLinkedin"
                  label={t("LinkedIn")}
                  icon="bi-linkedin"
                  optional
                  placeholder="https://linkedin.com/company/..."
                  value={form.linkedinUrl}
                  onChange={(value) => update("linkedinUrl", value)}
                />
              </div>

              <div className="ijp-auth-row">
                <AuthField
                  id="regFoundedYear"
                  label={t("Founded year")}
                  icon="bi-calendar3"
                  optional
                  placeholder="e.g. 2019"
                  value={form.foundedYear}
                  onChange={(value) => update("foundedYear", value)}
                />
              </div>

              <AuthField
                id="regDescription"
                label={t("What the company does")}
                icon="bi-card-text"
                optional
                value={form.description}
                onChange={(value) => update("description", value)}
                hint={t("Students read this before deciding whether to apply.")}
              />
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
                <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />{t("Creating your account...")}</>
            ) : (
              <>{t("Create account")}<i className="bi bi-arrow-right ms-2" aria-hidden="true" />
              </>
            )}
          </button>
        </form>

      <div className="ijp-auth-divider">
        <span>{t("Already have an account?")}</span>
      </div>

      <Link className="btn btn-ijp-quiet w-100" to="/auth/login">
        <i className="bi bi-box-arrow-in-right me-2" aria-hidden="true" />{t("Sign in")}</Link>
    </>
  );
}
