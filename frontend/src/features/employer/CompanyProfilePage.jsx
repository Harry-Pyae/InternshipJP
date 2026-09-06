import { useCallback, useEffect, useState } from "react";
import PageHeader from "../../components/shared/PageHeader.jsx";
import SectionCard from "../../components/shared/SectionCard.jsx";
import ErrorAlert from "../../components/shared/ErrorAlert.jsx";
import LoadingBlock from "../../components/shared/LoadingBlock.jsx";
import StatusBadge from "../../components/shared/StatusBadge.jsx";
import { employerApi } from "../../api/employerApi.js";
import { describeApiError, fieldErrorsOf } from "../../api/axiosClient.js";
import { useLanguage } from "../../config/languageContext.jsx";

/**
 * The company profile: a page you read, and a form you open.
 */
const FIELDS = [
  { name: "name", label: "Company name", required: true },
  { name: "industry", label: "Industry" },
  { name: "companySize", label: "Company size", hint: "e.g. 11-50" },
  { name: "foundedYear", label: "Founded year", type: "number" },
  {
    name: "registrationNumber",
    label: "Registration number",
    hint: "What an administrator checks before approving you.",
  },
  { name: "country", label: "Country" },
  { name: "location", label: "City" },
  { name: "address", label: "Address" },
  { name: "website", label: "Website", type: "url", placeholder: "https://example.com" },
  { name: "linkedinUrl", label: "LinkedIn", type: "url" },
  { name: "contactEmail", label: "Contact email", type: "email" },
  { name: "contactPhone", label: "Contact phone" },
];

const EMPTY = Object.fromEntries([...FIELDS.map((f) => [f.name, ""]), ["description", ""]]);

export default function CompanyProfilePage() {
  const { t } = useLanguage();
  const [saved, setSaved] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(false);
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
          <p className="mb-0">Your changes have been saved.</p>
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
            {saved?.approvalStatus === "APPROVED"
              ? "Your company is approved. You can publish internships."
              : "Until an administrator approves your company, your internships stay as drafts and no student can see them."}
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
        <SectionCard title="Edit organisation details">
          <form onSubmit={save} className="ijp-form-card p-0">
            <div className="row g-3">
              {FIELDS.map((field) => (
                <div className="col-12 col-md-6" key={field.name}>
                  <label className="ijp-field-label" htmlFor={`co-${field.name}`}>
                    {t(field.label)}
                    {field.required ? null : (
                      <span className="ijp-muted fw-normal"> (optional)</span>
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
                  />
                  {fieldErrors?.[field.name] ? (
                    <p className="ijp-field-error">{fieldErrors[field.name]}</p>
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
                />
              </div>
            </div>

            <div className="d-flex gap-2 mt-4">
              <button className="btn btn-ijp-primary" type="submit" disabled={busy}>
                {busy ? "Saving..." : "Save changes"}
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
      ) : (
        <SectionCard title="Organisation details">
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
