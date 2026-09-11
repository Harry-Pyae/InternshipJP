import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DatePicker from "../../components/shared/DatePicker.jsx";
import Select from "../../components/shared/Select.jsx";
import PageHeader from "../../components/shared/PageHeader.jsx";
import { employerApi } from "../../api/employerApi.js";
import { useLanguage } from "../../config/languageContext.jsx";

const initialForm = {
  title: "",
  description: "",
  responsibilities: "",
  requirements: "",
  location: "",
  workMode: "ONSITE",
  durationMonths: "",
  stipendAmount: "",
  stipendCurrency: "USD",
  availablePositions: "1",
  applicationDeadline: "",
  status: "DRAFT",
};

/**
 * Create or edit a vacancy.
 *
 * The same page does both. With an id in the URL it loads that internship
 * first; without one it starts blank and shows a briefing. One form, one set
 * of rules, one place to fix a bug, rather than a near-duplicate edit page
 * that drifts out of step.
 */
export default function PostInternshipPage() {
  const { t } = useLanguage();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  // The briefing is for someone creating a vacancy; an editor has read it.
  const [briefed, setBriefed] = useState(isEdit);

  useEffect(() => {
    if (!isEdit) return;
    employerApi
      .getInternship(id)
      .then((data) =>
        // Only the fields this form owns. Spreading the whole response would
        // post back ids and timestamps the API does not accept.
        setForm((current) => ({
          ...current,
          title: data.title ?? "",
          description: data.description ?? "",
          responsibilities: data.responsibilities ?? "",
          requirements: data.requirements ?? "",
          location: data.location ?? "",
          workMode: data.workMode ?? current.workMode,
          durationMonths: data.durationMonths ?? "",
          stipendAmount: data.stipendAmount ?? "",
          stipendCurrency: data.stipendCurrency ?? current.stipendCurrency,
          availablePositions: data.availablePositions ?? "",
          applicationDeadline: data.applicationDeadline ?? "",
          status: data.status ?? current.status,
        })),
      )
      .catch(() => setError("Could not load this internship."));
  }, [id, isEdit]);

  function set(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleChange(event) {
    set(event.target.name, event.target.value);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const payload = {
        ...form,
        durationMonths: form.durationMonths ? Number(form.durationMonths) : null,
        stipendAmount: form.stipendAmount ? Number(form.stipendAmount) : null,
        availablePositions: form.availablePositions
          ? Number(form.availablePositions)
          : 1,
      };

      if (isEdit) {
        await employerApi.updateInternship(id, payload);
      } else {
        await employerApi.createInternship(payload);
      }

      setMessage(
        isEdit
          ? t("Changes saved.")
          : form.status === "OPEN"
            ? t("Internship published successfully.")
            : t("Internship draft created successfully."),
      );
      // Only clear when creating. Wiping the fields after an edit would look
      // like the change had been lost.
      if (!isEdit) setForm(initialForm);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          t("Unable to create the internship."),
      );
    } finally {
      setSaving(false);
    }
  }

  if (!briefed) {
    return <Briefing t={t} onStart={() => setBriefed(true)} />;
  }

  // Completeness, computed from the form, so an unticked step means a field is
  // genuinely missing rather than merely unvisited.
  const ready = {
    role: Boolean(form.title.trim() && form.description.trim()),
    where: Boolean(form.location.trim() && form.workMode),
    pay: Boolean(form.applicationDeadline || form.stipendAmount),
  };
  const readyCount = Object.values(ready).filter(Boolean).length;

  return (
    <>
      <PageHeader
        title={isEdit ? "Edit internship" : "Post an internship"}
        subtitle={
          isEdit
            ? "Applications already received are kept."
            : "Create a vacancy for your company."
        }
        action={
          <Link className="btn btn-sm btn-ijp-quiet" to="/employer/internships">
            <i className="bi bi-arrow-left me-1" aria-hidden="true" />
            {t("Back to my vacancies")}
          </Link>
        }
      />

      <form onSubmit={handleSubmit}>
        <div className="row g-4">
          <div className="col-12 col-xl-8">
            <Section
              n="1"
              tone="role"
              title={t("The role")}
              hint={t("What the internship is, and what a student would actually do.")}
            >
              <Field
                htmlFor="title"
                label={t("Title")}
                note={t("Students see this first. Name the role, not the department.")}
                required
              >
                <input
                  id="title"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  className="form-control"
                  maxLength={150}
                  required
                />
              </Field>

              <Field
                htmlFor="description"
                label={t("Description")}
                note={t("What the internship is for, and what the student would learn.")}
              >
                <textarea
                  id="description"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  className="form-control"
                  rows="3"
                  maxLength={2000}
                />
              </Field>

              <Field
                htmlFor="responsibilities"
                label={t("Responsibilities")}
                note={t("Day-to-day tasks. Concrete tasks attract better-matched applicants.")}
              >
                <textarea
                  id="responsibilities"
                  name="responsibilities"
                  value={form.responsibilities}
                  onChange={handleChange}
                  className="form-control"
                  rows="3"
                  maxLength={2000}
                />
              </Field>

              <Field
                htmlFor="requirements"
                label={t("Requirements")}
                note={t("What a student must already be able to do.")}
              >
                <textarea
                  id="requirements"
                  name="requirements"
                  value={form.requirements}
                  onChange={handleChange}
                  className="form-control"
                  rows="3"
                  maxLength={2000}
                />
              </Field>
            </Section>

            <Section
              n="2"
              tone="where"
              title={t("Where and how")}
              hint={t("Short answers. Two to a line so the form stays readable.")}
            >
              <div className="row g-3">
                <div className="col-md-6">
                  <Field htmlFor="location" label={t("Location")}>
                    <input
                      id="location"
                      name="location"
                      value={form.location}
                      onChange={handleChange}
                      className="form-control"
                      maxLength={150}
                    />
                  </Field>
                </div>
                <div className="col-md-6">
                  {/* Select draws its own control and takes no id, so the label
                      is not bound with htmlFor; ariaLabel names it instead. */}
                  <Field
                    label={t("Work mode")}
                    note={t("On-site, remote or hybrid. Students filter on this.")}
                  >
                    <Select
                      value={form.workMode}
                      onChange={(value) => set("workMode", value)}
                      groups={[
                        {
                          label: null,
                          items: [
                            { value: "ONSITE", label: t("On-site") },
                            { value: "REMOTE", label: t("Remote") },
                            { value: "HYBRID", label: t("Hybrid") },
                          ],
                        },
                      ]}
                      ariaLabel={t("Work mode")}
                    />
                  </Field>
                </div>
                <div className="col-md-6">
                  <Field
                    htmlFor="durationMonths"
                    label={t("Duration (months)")}
                    note={t("In months. Leave empty if it is open-ended.")}
                  >
                    <input
                      id="durationMonths"
                      name="durationMonths"
                      type="number"
                      min="1"
                      max="24"
                      value={form.durationMonths}
                      onChange={handleChange}
                      className="form-control"
                    />
                  </Field>
                </div>
                <div className="col-md-6">
                  <Field
                    htmlFor="availablePositions"
                    label={t("Available positions")}
                    note={t("How many students you intend to take.")}
                  >
                    <input
                      id="availablePositions"
                      name="availablePositions"
                      type="number"
                      min="1"
                      value={form.availablePositions}
                      onChange={handleChange}
                      className="form-control"
                    />
                  </Field>
                </div>
              </div>
            </Section>

            <Section
              n="3"
              tone="pay"
              title={t("Pay and deadline")}
              hint={t("Leave the deadline empty if you do not want a cut-off.")}
            >
              <div className="row g-3">
                <div className="col-md-6">
                  <Field
                    htmlFor="stipendAmount"
                    label={t("Stipend amount")}
                    note={t("A stated stipend, even a small one, attracts more applicants than a blank field.")}
                  >
                    <input
                      id="stipendAmount"
                      name="stipendAmount"
                      type="number"
                      min="0"
                      value={form.stipendAmount}
                      onChange={handleChange}
                      className="form-control"
                    />
                  </Field>
                </div>
                <div className="col-md-6">
                  <Field htmlFor="stipendCurrency" label={t("Stipend currency")}>
                    <input
                      id="stipendCurrency"
                      name="stipendCurrency"
                      value={form.stipendCurrency}
                      onChange={handleChange}
                      className="form-control"
                      maxLength={10}
                    />
                  </Field>
                </div>
                <div className="col-md-6">
                  <Field
                    htmlFor="applicationDeadline"
                    label={t("Application deadline")}
                    note={t("After this date students can no longer apply and the vacancy stops appearing.")}
                  >
                    <DatePicker
                      id="applicationDeadline"
                      value={form.applicationDeadline}
                      onChange={(value) => set("applicationDeadline", value)}
                      ariaLabel={t("Application deadline")}
                    />
                  </Field>
                </div>
                <div className="col-md-6">
                  <Field
                    label={t("Status")}
                    note={t("Draft keeps it hidden. Open publishes it once your company is approved.")}
                  >
                    <Select
                      value={form.status}
                      onChange={(value) => set("status", value)}
                      groups={[
                        {
                          label: null,
                          items: [
                            { value: "DRAFT", label: t("Draft") },
                            { value: "OPEN", label: t("Open") },
                            { value: "CLOSED", label: t("Closed") },
                          ],
                        },
                      ]}
                      ariaLabel={t("Status")}
                    />
                  </Field>
                </div>
              </div>
            </Section>
          </div>

          <div className="col-12 col-xl-4">
            <div className="ijp-post-aside">
              <Progress t={t} ready={ready} count={readyCount} />
              <Preview t={t} form={form} />

              <div className="ijp-card p-3 p-md-4">
                {message ? (
                  <div className="alert alert-success" role="status">
                    {message}
                  </div>
                ) : null}
                {error ? (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                ) : null}

                <button
                  type="submit"
                  className="btn btn-ijp-primary w-100"
                  disabled={saving}
                >
                  {saving
                    ? t("Saving...")
                    : isEdit
                      ? t("Save changes")
                      : form.status === "OPEN"
                        ? t("Publish internship")
                        : t("Save draft")}
                </button>

                <p className="ijp-field-note mt-2 mb-0">
                  {form.status === "OPEN"
                    ? t("Students see it once your company is approved.")
                    : t("A draft is visible only to you.")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </form>
    </>
  );
}

/* ---------------------------------------------------------------- pieces */

/** One labelled field, with an optional note explaining what it affects. */
function Field({ htmlFor, label, note, required, children }) {
  return (
    <div className="ijp-field">
      <label className="form-label" htmlFor={htmlFor}>
        {label}
        {required ? <span className="ijp-req"> *</span> : null}
      </label>
      {children}
      {note ? <p className="ijp-field-note">{note}</p> : null}
    </div>
  );
}

/** A numbered, colour-accented group of fields. */
function Section({ n, tone, title, hint, children }) {
  return (
    <div className={`ijp-form-section ijp-form-section--${tone}`}>
      <div className="ijp-form-section-head">
        <span className="ijp-form-section-n">{n}</span>
        <div>
          <p className="ijp-form-section-title">{title}</p>
          <p className="ijp-form-section-hint">{hint}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

/** Which sections are ready, so the employer is not guessing. */
function Progress({ t, ready, count }) {
  const steps = [
    ["role", t("The role"), t("Title and description")],
    ["where", t("Where and how"), t("Location and work mode")],
    ["pay", t("Pay and deadline"), t("A stipend or a closing date")],
  ];
  return (
    <div className="ijp-card p-3 p-md-4 mb-4">
      <p className="ijp-label mb-1">{t("Progress")}</p>
      <p className="ijp-muted small mb-3">
        {t("{n} of 3 sections ready", { n: count })}
      </p>
      <ul className="ijp-steps">
        {steps.map(([key, label, note], i) => (
          <li className={`ijp-step${ready[key] ? " ijp-step--done" : ""}`} key={key}>
            <span className="ijp-step-mark">
              {ready[key] ? <i className="bi bi-check-lg" aria-hidden="true" /> : i + 1}
            </span>
            <span>
              <span className="ijp-step-label">{label}</span>
              <span className="ijp-step-note">{note}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * The vacancy as a student will see it in the listing.
 *
 * Deliberately plain: it resembles the student's list rather than being a
 * second design, and it answers "what does this field do" by showing the
 * effect instead of describing it.
 */
function Preview({ t, form }) {
  return (
    <div className="ijp-card p-3 p-md-4 mb-4">
      <p className="ijp-label mb-1">{t("How students will see it")}</p>
      <p className="ijp-muted small mb-3">{t("This updates as you type.")}</p>

      <div className="ijp-preview">
        <p className="ijp-preview-title">
          {form.title.trim() || t("Untitled vacancy")}
        </p>

        <div className="ijp-preview-chips">
          {form.location.trim() ? (
            <span className="ijp-preview-chip">
              <i className="bi bi-geo-alt me-1" aria-hidden="true" />
              {form.location}
            </span>
          ) : null}
          {form.workMode ? (
            <span className="ijp-preview-chip">{t(form.workMode)}</span>
          ) : null}
          {form.durationMonths ? (
            <span className="ijp-preview-chip">
              {t("{n} months", { n: form.durationMonths })}
            </span>
          ) : null}
          {form.stipendAmount ? (
            <span className="ijp-preview-chip ijp-preview-chip--pay">
              {form.stipendAmount} {form.stipendCurrency}
            </span>
          ) : null}
        </div>

        <p className="ijp-preview-body">
          {form.description.trim() || t("No description yet.")}
        </p>

        <p className="ijp-preview-foot">
          {form.applicationDeadline
            ? t("Closes {d}", { d: form.applicationDeadline })
            : t("No closing date")}
        </p>
      </div>
    </div>
  );
}

/** Four things worth knowing before writing a vacancy, and what happens after. */
function Briefing({ t, onStart }) {
  // Colour follows what the point is about - discovery, waiting, something
  // closing, something safe to change - which is the same vocabulary the
  // status badges use elsewhere, so it is familiar rather than decorative.
  const points = [
    {
      tone: "signal",
      icon: "bi-diagram-3",
      kicker: t("Matching"),
      head: t("Required skills decide who sees it"),
      body: t("Students are matched to vacancies by comparing their recorded skills against the ones you require."),
      todo: t("List three to five skills. A vacancy with none cannot be matched to anybody, and that is the most common reason a listing attracts nothing."),
    },
    {
      tone: "pending",
      icon: "bi-hourglass-split",
      kicker: t("Approval"),
      head: t("Your company must be approved first"),
      body: t("A vacancy stays a draft until an administrator has approved your company registration."),
      todo: t("Write and save it now. Students see it the moment approval comes through, and you are notified when it does."),
    },
    {
      tone: "rejected",
      icon: "bi-calendar-x",
      kicker: t("Deadline"),
      head: t("The deadline closes it automatically"),
      body: t("Once the application deadline passes, students can no longer apply and the vacancy stops appearing in their search."),
      todo: t("Two to four weeks suits a student term. Leave it empty if you do not want a cut-off at all."),
    },
    {
      tone: "verified",
      icon: "bi-pencil-square",
      kicker: t("Changes"),
      head: t("You can edit it after publishing"),
      body: t("Nothing here is final, and applications already received are kept when you change a vacancy."),
      todo: t("Publish and refine rather than delay. An unpublished vacancy reaches nobody."),
    },
  ];

  const flow = [
    ["bi-pencil", t("You write it"), t("Saved as a draft")],
    ["bi-patch-check", t("Company approved"), t("An administrator checks it")],
    ["bi-eye", t("Students see it"), t("Matched on required skills")],
    ["bi-inbox", t("Applications arrive"), t("With verified certificates")],
  ];

  return (
    <>
      <PageHeader
        title="Post an internship"
        subtitle="Before you start, four things worth knowing."
      />

      <div className="ijp-brief-lead">
        <i className="bi bi-megaphone ijp-brief-lead-icon" aria-hidden="true" />
        <div>
          <p className="ijp-brief-lead-head">
            {t("A vacancy takes about five minutes to write.")}
          </p>
          <p className="ijp-brief-lead-body">
            {t("Only a title is required. Everything else can be added later, and a vacancy with more detail is matched to more students.")}
          </p>
        </div>
      </div>

      <div className="ijp-brief-grid">
        {points.map((p, i) => (
          <article className={`ijp-brief ijp-brief--${p.tone}`} key={p.head}>
            <span className="ijp-brief-icon" aria-hidden="true">
              <i className={`bi ${p.icon}`} />
            </span>

            <div className="ijp-brief-main">
              <p className="ijp-brief-kicker">
                <span className="ijp-brief-n">{i + 1}</span>
                {p.kicker}
              </p>
              <h2 className="ijp-brief-head">{p.head}</h2>
              <p className="ijp-brief-body">{p.body}</p>
              <p className="ijp-brief-todo">
                <i className="bi bi-arrow-return-right" aria-hidden="true" />
                <span>{p.todo}</span>
              </p>
            </div>
          </article>
        ))}
      </div>

      <div className="ijp-card p-3 p-md-4 mt-4">
        <p className="ijp-label mb-3">{t("What happens after you publish")}</p>
        <ol className="ijp-flow">
          {flow.map(([icon, label, note], i) => (
            <li className="ijp-flow-step" key={label}>
              <span className="ijp-flow-mark">
                <i className={`bi ${icon}`} aria-hidden="true" />
              </span>
              <span className="ijp-flow-label">{label}</span>
              <span className="ijp-flow-note">{note}</span>
              {i < flow.length - 1 ? (
                <i className="bi bi-chevron-right ijp-flow-arrow" aria-hidden="true" />
              ) : null}
            </li>
          ))}
        </ol>
      </div>

      <div className="d-flex flex-wrap gap-2 mt-4">
        <button type="button" className="btn btn-ijp-primary" onClick={onStart}>
          {t("Start writing the vacancy")}
          <i className="bi bi-arrow-right ms-1" aria-hidden="true" />
        </button>
        <Link className="btn btn-ijp-quiet" to="/employer/internships">
          {t("Back to my vacancies")}
        </Link>
      </div>
    </>
  );
}
