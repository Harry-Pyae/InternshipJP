import { useCallback, useEffect, useState } from "react";
import PageHeader from "../../components/shared/PageHeader.jsx";
import SectionCard from "../../components/shared/SectionCard.jsx";
import ErrorAlert from "../../components/shared/ErrorAlert.jsx";
import LoadingBlock from "../../components/shared/LoadingBlock.jsx";
import StatusBadge from "../../components/shared/StatusBadge.jsx";
import { employerApi } from "../../api/employerApi.js";
import { describeApiError, fieldErrorsOf } from "../../api/axiosClient.js";
import { useLanguage } from "../../config/languageContext.jsx";
import CompanyLogoCard from "../../components/shared/CompanyLogoCard.jsx";
import CharCount from "../../components/shared/CharCount.jsx";

/**
 * Every limit here is the one UpdateCompanyRequest enforces.
 *
 * Only two were written down, so the rest fell back to 150 - which is not a
 * neutral default. It is longer than the server accepts for an industry, a
 * company size or a country, so the form let somebody finish typing and then
 * answered 400; and it is shorter than the server accepts for a website, an
 * address or a LinkedIn URL, so it cut a valid value off with no explanation.
 */
const FIELDS = [
  { name: "name", label: "Company name", required: true, maxLength: 150 },
  { name: "industry", label: "Industry", maxLength: 100 },
  { name: "companySize", label: "Company size", hint: "e.g. 11-50", maxLength: 30 },
  // A number input, so min/max rather than maxLength: browsers ignore
  // maxLength on type="number" entirely, and a character counter on a year is
  // counting the wrong thing. The bounds are @Min(1800)/@Max(2100) on the
  // request.
  { name: "foundedYear", label: "Founded year", type: "number", min: 1800, max: 2100 },
  {
    name: "registrationNumber",
    label: "Registration number",
    hint: "What an administrator checks before approving you.",
    maxLength: 20,
  },
  { name: "country", label: "Country", maxLength: 100 },
  { name: "location", label: "City", maxLength: 150 },
  { name: "address", label: "Address", maxLength: 255 },
  {
    name: "website",
    label: "Website",
    type: "url",
    placeholder: "https://example.com",
    maxLength: 255,
  },
  { name: "linkedinUrl", label: "LinkedIn", type: "url", maxLength: 255 },
  { name: "contactEmail", label: "Contact email", type: "email", maxLength: 190 },
  { name: "contactPhone", label: "Contact phone", maxLength: 16 },
];

/** UpdateCompanyRequest: @Size(max = 1500) on description. */
const DESCRIPTION_MAX = 1500;

const EMPTY = Object.fromEntries([...FIELDS.map((f) => [f.name, ""]), ["description", ""]]);

/**
 * The company profile: a page you read, and a form you open.
 */
export default function CompanyProfilePage() {
  const { t } = useLanguage();
  const [saved, setSaved] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(false);
  // The logo is displayed here and changed on the profile edit page.
  // Fetched through the client rather than pointed at by an img src: the
  // API is a different origin in development and carries no cookie on a
  // plain image request.
  const [logo, setLogo] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState(null);
  const [done, setDone] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await employerApi.getCompany();
      setSaved(data);
      setForm({ ...EMPTY, ...pickEditable(data) });
    } catch (requestError) {
      setError(describeApiError(requestError));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!saved?.logoPath) {
      setLogo(null);
      return undefined;
    }
    let alive = true;
    employerApi.fetchCompanyLogo().then((url) => {
      if (alive) setLogo(url);
    });
    return () => {
      alive = false;
    };
  }, [saved?.logoPath]);

  function cancel() {
    // Back to what is stored, not to whatever was half-typed.
    setForm({ ...EMPTY, ...pickEditable(saved) });
    setFieldErrors(null);
    setEditing(false);
  }

  async function save(event) {
    event.preventDefault();
    if (!form.name.trim()) {
      setFieldErrors({ name: "Company name is required." });
      return;
    }
    setBusy(true);
    setError(null);
    setFieldErrors(null);
    try {
      const payload = {
        ...form,
        foundedYear: form.foundedYear ? Number(form.foundedYear) : null,
      };
      const updated = await employerApi.updateCompany(payload);
      setSaved(updated);
      setForm({ ...EMPTY, ...pickEditable(updated) });
      setEditing(false);
      setDone(true);
    } catch (requestError) {
      setError(describeApiError(requestError));
      setFieldErrors(fieldErrorsOf(requestError));
    } finally {
      setBusy(false);
    }
  }

  if (saved === null && !error) {
    return <LoadingBlock label="Loading your company..." />;
  }

  return (
    <>
      <PageHeader
        title="Company profile"
        subtitle="Your organisation's details, and where its approval stands."
        action={
          editing ? null : (
            <button
              type="button"
              className="btn btn-ijp-primary btn-sm"
              onClick={() => {
                setDone(false);
                setEditing(true);
              }}
            >
              <i className="bi bi-pencil me-1" aria-hidden="true" />{t("Edit profile")}</button>
          )
        }
      />

      <ErrorAlert message={error} />

      {done && !editing ? (
        <div className="ijp-callout" role="status">
          <i className="bi bi-check2-circle ijp-callout-icon" aria-hidden="true" />
          <p className="mb-0">{t("Your changes have been saved.")}</p>
        </div>
      ) : null}

      {/* Approval is the thing an employer comes here to check, so it sits
          above the details rather than inside them. */}
      <div className="ijp-card p-3 p-md-4 mb-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <span className="ijp-label d-block mb-1">{t("Approval status")}</span>
            <StatusBadge value={saved?.approvalStatus} />
          </div>
          <p className="ijp-muted small mb-0" style={{ maxWidth: "34rem" }}>
            {t(saved?.approvalStatus === "APPROVED"
              ? "Your company is approved. You can publish internships."
              : "Until an administrator approves your company, your internships stay as drafts and no student can see them.")}
          </p>
        </div>
        {saved?.approvalNote ? (
          <div className="ijp-pending-note mt-3">
            <span className="ijp-label d-block mb-1">{t("Note from the administrator")}</span>
            {saved.approvalNote}
          </div>
        ) : null}
      </div>

      {editing ? (
        <>
        <div className="mb-4">
          <CompanyLogoCard onError={setError} />
        </div>

        <SectionCard title="Edit organisation details">
          <form onSubmit={save} className="ijp-form-card p-0">
            <div className="row g-3">
              {FIELDS.map((field) => (
                <div className="col-12 col-md-6" key={field.name}>
                  <label className="ijp-field-label" htmlFor={`co-${field.name}`}>
                    {t(field.label)}
                    {field.required ? null : (
                      <span className="ijp-muted fw-normal"> {t("(optional)")}</span>
                    )}
                  </label>
                  <input
                    id={`co-${field.name}`}
                    type={field.type ?? "text"}
                    className={`form-control${fieldErrors?.[field.name] ? " is-invalid" : ""}`}
                    placeholder={field.placeholder}
                    value={form[field.name] ?? ""}
                    onChange={(event) =>
                      setForm((c) => ({ ...c, [field.name]: event.target.value }))
                    }
                    maxLength={field.maxLength}
                    min={field.min}
                    max={field.max}
                  />
                  {field.maxLength ? (
                    <CharCount value={form[field.name] ?? ""} max={field.maxLength} />
                  ) : null}
                  {fieldErrors?.[field.name] ? (
                    <p className="ijp-field-error">{t(fieldErrors[field.name])}</p>
                  ) : field.hint ? (
                    <p className="ijp-field-hint">{t(field.hint)}</p>
                  ) : null}
                </div>
              ))}

              <div className="col-12">
                <label className="ijp-field-label" htmlFor="co-description">{t("Company description")}</label>
                <textarea
                  id="co-description"
                  className="form-control"
                  rows={4}
                  value={form.description ?? ""}
                  onChange={(event) =>
                    setForm((c) => ({ ...c, description: event.target.value }))
                  }
                  maxLength={DESCRIPTION_MAX}
                />
                <CharCount value={form.description ?? ""} max={DESCRIPTION_MAX} />
              </div>
            </div>

            <div className="d-flex gap-2 mt-4">
              <button className="btn btn-ijp-primary" type="submit" disabled={busy}>
                {t(busy ? "Saving..." : "Save changes")}
              </button>
              <button
                type="button"
                className="btn btn-ijp-quiet"
                onClick={cancel}
                disabled={busy}
              >{t("Cancel")}</button>
            </div>
          </form>
        </SectionCard>
        </>
      ) : (
        <SectionCard title="Organisation details">
          {logo ? (
            <div className="ijp-photo-row mb-4">
              <span className="ijp-pick ijp-pick--square">
                <img src={logo} alt="" />
              </span>
              <p className="ijp-muted small mb-0">
                {t("The logo is changed on the profile edit page.")}
              </p>
            </div>
          ) : null}

          <dl className="ijp-detail-grid ijp-detail">
            {FIELDS.map((field) => (
              <div key={field.name}>
                <dt>{t(field.label)}</dt>
                <Value value={saved?.[field.name]} link={field.type === "url"} />
              </div>
            ))}
          </dl>

          <div className="mt-4">
            <dl className="ijp-detail mb-0">
              <dt>{t("Company description")}</dt>
              <Value value={saved?.description} />
            </dl>
          </div>
        </SectionCard>
      )}
    </>
  );
}

/** A stored value, or a visible "Not set" so gaps are obvious rather than blank. */
function Value({ value, link }) {
  if (value === null || value === undefined || value === "") {
    return <dd className="ijp-detail--empty" />;
  }
  if (link) {
    return (
      <dd>
        <a href={String(value)} target="_blank" rel="noreferrer noopener">
          {String(value)}
        </a>
      </dd>
    );
  }
  return <dd>{String(value)}</dd>;
}

/** Only the fields the form owns - not ids, timestamps or approval state. */
function pickEditable(company) {
  if (!company) {
    return {};
  }
  const out = { description: company.description ?? "" };
  for (const field of FIELDS) {
    out[field.name] = company[field.name] ?? "";
  }
  return out;
}
