import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
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

export default function PostInternshipPage() {
  const { t } = useLanguage();
  // The same page creates and edits. With an id in the URL it loads that
  // internship first; without one it starts blank. One form, one set of
  // validation rules, one place to fix a bug - rather than a near-duplicate
  // EditInternshipPage that drifts out of step.
  const { id } = useParams();
  const isEdit = Boolean(id);

  useEffect(() => {
    if (!isEdit) {
      return;
    }
    employerApi
      .getInternship(id)
      .then((data) =>
        // Only the fields the form owns. Spreading the whole response would
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
          availablePositions: data.availablePositions ?? "",
          applicationDeadline: data.applicationDeadline ?? "",
          status: data.status ?? current.status,
        })),
      )
      .catch(() => setError("Could not load this internship."));
  }, [id, isEdit]);

  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const payload = {
        ...form,
        durationMonths: form.durationMonths
          ? Number(form.durationMonths)
          : null,
        stipendAmount: form.stipendAmount
          ? Number(form.stipendAmount)
          : null,
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
          ? "Changes saved."
          : form.status === "OPEN"
            ? "Internship published successfully."
            : "Internship draft created successfully.",
      );
      // Only clear the form when creating. Wiping the fields after an edit
      // would look like the change had been lost.
      if (!isEdit) {
        setForm(initialForm);
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Unable to create the internship."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Post an internship"
        subtitle="Create a vacancy for your company."
      />

      <div className="ijp-card ijp-form-card">
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label" htmlFor="title">
              Title *
            </label>
            <input
              id="title"
              name="title"
              value={form.title}
              onChange={handleChange}
              className="form-control"
              maxLength={150}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label" htmlFor="description">{t("Description")}</label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              className="form-control"
              rows="4"
              maxLength={2000}
            />
          </div>

          <div className="mb-3">
            <label className="form-label" htmlFor="responsibilities">{t("Responsibilities")}</label>
            <textarea
              id="responsibilities"
              name="responsibilities"
              value={form.responsibilities}
              onChange={handleChange}
              className="form-control"
              rows="4"
              maxLength={2000}
            />
          </div>

          <div className="mb-3">
            <label className="form-label" htmlFor="requirements">{t("Requirements")}</label>
            <textarea
              id="requirements"
              name="requirements"
              value={form.requirements}
              onChange={handleChange}
              className="form-control"
              rows="4"
              maxLength={2000}
            />
          </div>

          <div className="mb-3">
            <label className="form-label" htmlFor="location">{t("Location")}</label>
            <input
              id="location"
              name="location"
              value={form.location}
              onChange={handleChange}
              className="form-control"
              maxLength={150}
            />
          </div>

          <div className="mb-3">
            <label className="form-label" htmlFor="workMode">{t("Work mode")}</label>
            <Select
              value={form.workMode}
              onChange={(value) =>
                handleChange({ target: { name: "workMode", value } })
              }
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
              ariaLabel="Work mode"
            />
          </div>

          <div className="mb-3">
            <label className="form-label" htmlFor="durationMonths">{t("Duration (months)")}</label>
            <input
              id="durationMonths"
              name="durationMonths"
              type="number"
              min="1"
              max="36"
              value={form.durationMonths}
              onChange={handleChange}
              className="form-control"
            />
          </div>

          <div className="mb-3">
            <label className="form-label" htmlFor="stipendAmount">{t("Stipend amount")}</label>
            <input
              id="stipendAmount"
              name="stipendAmount"
              type="number"
              min="0"
              step="0.01"
              value={form.stipendAmount}
              onChange={handleChange}
              className="form-control"
            />
          </div>

          <div className="mb-3">
            <label className="form-label" htmlFor="stipendCurrency">{t("Stipend currency")}</label>
            <input
              id="stipendCurrency"
              name="stipendCurrency"
              value={form.stipendCurrency}
              onChange={handleChange}
              className="form-control"
              maxLength={10}
            />
          </div>

          <div className="mb-3">
            <label className="form-label" htmlFor="availablePositions">{t("Available positions")}</label>
            <input
              id="availablePositions"
              name="availablePositions"
              type="number"
              min="1"
              max="999"
              value={form.availablePositions}
              onChange={handleChange}
              className="form-control"
            />
          </div>

          <div className="mb-3">
            <label className="form-label" htmlFor="applicationDeadline">{t("Application deadline")}</label>
            <DatePicker
              id="applicationDeadline"
              value={form.applicationDeadline}
              onChange={(value) =>
                handleChange({ target: { name: "applicationDeadline", value } })
              }
              // A deadline in the past would be accepted by the form and then
              // make the vacancy invisible the moment it was published.
              min={new Date().toISOString().slice(0, 10)}
              placeholder={t("No deadline")}
              ariaLabel="Application deadline"
            />
          </div>
          <div className="mb-3">
  <label className="form-label" htmlFor="status">{t("Status")}</label>

  <Select
    value={form.status}
    onChange={(value) => handleChange({ target: { name: "status", value } })}
    groups={[
      {
        label: null,
        items: [
          { value: "DRAFT", label: "Draft - only you can see it" },
          { value: "OPEN", label: "Open - visible to students once approved" },
        ],
      },
    ]}
    ariaLabel="Status"
  />
</div>

          {message && (
            <div className="alert alert-success" role="alert">
              {message}
            </div>
          )}

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <button
           type="submit"
            className="btn btn-primary"
            disabled={saving}
>
            {saving
              ? "Saving..."
              : form.status === "OPEN"
                ? "Publish internship"
                : "Save draft"}
            </button>
        </form>
      </div>
    </>
  );
}