import { useEffect, useState } from "react";
import PageHeader from "../../components/shared/PageHeader.jsx";
import { employerApi } from "../../api/employerApi.js";

export default function EmployerProfilePage() {
  const [profile, setProfile] = useState(null);

  const [form, setForm] = useState({
    jobTitle: "",
    department: "",
    workEmail: "",
    contactPhone: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadProfile() {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const data = await employerApi.getProfile();

      setProfile(data);

      setForm({
        jobTitle: data.jobTitle || "",
        department: data.department || "",
        workEmail: data.workEmail || "",
        contactPhone: data.contactPhone || "",
      });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Unable to load your profile."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

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
    setError("");
    setSuccess("");

    try {
      const data = await employerApi.updateProfile(form);

      setProfile(data);

      setForm({
        jobTitle: data.jobTitle || "",
        department: data.department || "",
        workEmail: data.workEmail || "",
        contactPhone: data.contactPhone || "",
      });

      setSuccess("Profile updated successfully.");
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Unable to update your profile."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="My profile"
        subtitle="Manage your recruiter information."
      />

      <div className="ijp-card">
        {loading && (
          <div className="text-center py-5">
            Loading profile...
          </div>
        )}

        {!loading && (
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}

            {success && (
              <div className="alert alert-success" role="alert">
                {success}
              </div>
            )}

            <div className="mb-4">
              <h3>Personal information</h3>

              <div className="row g-3 mt-1">
                <div className="col-md-6">
                  <label className="form-label">Full name</label>

                  <input
                    type="text"
                    className="form-control"
                    value={profile?.fullName || ""}
                    disabled
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">
                    Account email
                  </label>

                  <input
                    type="email"
                    className="form-control"
                    value={profile?.email || ""}
                    disabled
                  />
                </div>
              </div>
            </div>

            <hr />

            <div className="mt-4">
              <h3>Recruiter information</h3>

              <div className="row g-3 mt-1">
                <div className="col-md-6">
                  <label
                    htmlFor="jobTitle"
                    className="form-label"
                  >
                    Job title
                  </label>

                  <input
                    id="jobTitle"
                    name="jobTitle"
                    type="text"
                    className="form-control"
                    value={form.jobTitle}
                    onChange={handleChange}
                    maxLength={120}
                    placeholder="e.g. HR Manager"
                  />
                </div>

                <div className="col-md-6">
                  <label
                    htmlFor="department"
                    className="form-label"
                  >
                    Department
                  </label>

                  <input
                    id="department"
                    name="department"
                    type="text"
                    className="form-control"
                    value={form.department}
                    onChange={handleChange}
                    maxLength={120}
                    placeholder="e.g. Human Resources"
                  />
                </div>

                <div className="col-md-6">
                  <label
                    htmlFor="workEmail"
                    className="form-label"
                  >
                    Work email
                  </label>

                  <input
                    id="workEmail"
                    name="workEmail"
                    type="email"
                    className="form-control"
                    value={form.workEmail}
                    onChange={handleChange}
                    maxLength={190}
                    placeholder="you@company.com"
                  />
                </div>

                <div className="col-md-6">
                  <label
                    htmlFor="contactPhone"
                    className="form-label"
                  >
                    Contact phone
                  </label>

                  <input
                    id="contactPhone"
                    name="contactPhone"
                    type="tel"
                    className="form-control"
                    value={form.contactPhone}
                    onChange={handleChange}
                    maxLength={30}
                    placeholder="+95..."
                  />
                </div>
              </div>
            </div>

            {profile?.company && (
              <>
                <hr />

                <div className="mt-4">
                  <h3>Company</h3>

                  <p className="mb-1">
                    <strong>{profile.company.name}</strong>
                  </p>

                  {profile.company.industry && (
                    <p className="text-muted mb-0">
                      {profile.company.industry}
                    </p>
                  )}
                </div>
              </>
            )}

            <div className="mt-4 d-flex gap-2">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save changes"}
              </button>

              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={loadProfile}
                disabled={loading || saving}
              >
                Reload
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}