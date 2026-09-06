import { useEffect, useState } from "react";

import PageHeader from "../../components/shared/PageHeader.jsx";
import ErrorAlert from "../../components/shared/ErrorAlert.jsx";
import LoadingBlock from "../../components/shared/LoadingBlock.jsx";
import SectionCard from "../../components/shared/SectionCard.jsx";
import { describeApiError } from "../../api/axiosClient.js";
import { studentApi } from "../../api/studentApi.js";

export default function EditStudentProfilePage() {
  const [form, setForm] = useState({
    headline: "",
    dateOfBirth: "",
    currentlyAttending: false,
    country: "",
    githubUrl: "",
    preferredWorkMode: "",
    availableFrom: "",
    university: "",
    degree: "",
    fieldOfStudy: "",
    graduationYear: "",
    biography: "",
    location: "",
    availability: "",
    portfolioUrl: "",
    linkedinUrl: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        setError("");

        const data = await studentApi.getProfile();

        setForm({
          headline: data.headline || "",
          dateOfBirth: data.dateOfBirth || "",
          currentlyAttending: data.currentlyAttending ?? false,
          country: data.country || "",
          githubUrl: data.githubUrl || "",
          preferredWorkMode: data.preferredWorkMode || "",
          availableFrom: data.availableFrom || "",
          university: data.university || "",
          degree: data.degree || "",
          fieldOfStudy: data.fieldOfStudy || "",
          graduationYear: data.graduationYear ?? "",
          biography: data.biography || "",
          location: data.location || "",
          availability: data.availability || "",
          portfolioUrl: data.portfolioUrl || "",
          linkedinUrl: data.linkedinUrl || "",
        });
      } catch (err) {
        setError(describeApiError(err));
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        headline: form.headline || null,
        dateOfBirth: form.dateOfBirth || null,
        currentlyAttending: form.currentlyAttending,
        country: form.country || null,
        githubUrl: form.githubUrl || null,
        preferredWorkMode: form.preferredWorkMode || null,
        availableFrom: form.availableFrom || null,
        university: form.university || null,
        degree: form.degree || null,
        fieldOfStudy: form.fieldOfStudy || null,
        graduationYear: form.graduationYear
          ? Number(form.graduationYear)
          : null,
        biography: form.biography || null,
        location: form.location || null,
        availability: form.availability || null,
        portfolioUrl: form.portfolioUrl || null,
        linkedinUrl: form.linkedinUrl || null,
      };

      await studentApi.updateProfile(payload);

      setSuccess("Profile updated successfully.");
    } catch (err) {
      setError(describeApiError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Edit profile"
        subtitle="Update your personal information and internship preferences."
      />

      {loading ? <LoadingBlock /> : null}

      {error ? <ErrorAlert message={error} /> : null}

      {success ? (
        <div className="alert alert-success">
          {success}
        </div>
      ) : null}

      {!loading && !error ? (
        <form onSubmit={handleSubmit} className="d-grid gap-4">
          <SectionCard title="Personal information">
            <div className="row g-3">
              <div className="col-12">
                <label className="form-label">Headline</label>
                <input
                  type="text"
                  name="headline"
                  className="form-control"
                  value={form.headline}
                  onChange={handleChange}
                  maxLength={150}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">Date of birth</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  className="form-control"
                  value={form.dateOfBirth}
                  onChange={handleChange}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">Country</label>
                <input
                  type="text"
                  name="country"
                  className="form-control"
                  value={form.country}
                  onChange={handleChange}
                  maxLength={100}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">Location</label>
                <input
                  type="text"
                  name="location"
                  className="form-control"
                  value={form.location}
                  onChange={handleChange}
                  maxLength={150}
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Education information">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">University</label>
                <input
                  type="text"
                  name="university"
                  className="form-control"
                  value={form.university}
                  onChange={handleChange}
                  maxLength={150}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">Degree</label>
                <input
                  type="text"
                  name="degree"
                  className="form-control"
                  value={form.degree}
                  onChange={handleChange}
                  maxLength={150}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">Field of study</label>
                <input
                  type="text"
                  name="fieldOfStudy"
                  className="form-control"
                  value={form.fieldOfStudy}
                  onChange={handleChange}
                  maxLength={150}
                />
              </div>

              <div className="col-md-6">
                <label className="form-label">Graduation year</label>
                <input
                  type="number"
                  name="graduationYear"
                  className="form-control"
                  value={form.graduationYear}
                  onChange={handleChange}
                  min={1950}
                  max={2100}
                />
              </div>

              <div className="col-12">
                <div className="form-check">
                  <input
                    type="checkbox"
                    name="currentlyAttending"
                    className="form-check-input"
                    checked={form.currentlyAttending}
                    onChange={handleChange}
                    id="currentlyAttending"
                  />

                  <label
                    className="form-check-label"
                    htmlFor="currentlyAttending"
                  >
                    Currently attending
                  </label>
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Internship preferences">
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">Availability</label>
                <input
                  type="text"
                  name="availability"
                  className="form-control"
                  value={form.availability}
                  onChange={handleChange}
                  maxLength={50}
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">Preferred work mode</label>
                <select
                  name="preferredWorkMode"
                  className="form-select"
                  value={form.preferredWorkMode}
                  onChange={handleChange}
                >
                  <option value="">Select work mode</option>
                  <option value="ONSITE">On-site</option>
                  <option value="REMOTE">Remote</option>
                  <option value="HYBRID">Hybrid</option>
                </select>
              </div>

              <div className="col-md-4">
                <label className="form-label">Available from</label>
                <input
                  type="date"
                  name="availableFrom"
                  className="form-control"
                  value={form.availableFrom}
                  onChange={handleChange}
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="About">
            <label className="form-label">Biography</label>
            <textarea
              name="biography"
              className="form-control"
              rows="5"
              value={form.biography}
              onChange={handleChange}
              maxLength={1500}
            />
          </SectionCard>

          <SectionCard title="Links">
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">Portfolio</label>
                <input
                  type="url"
                  name="portfolioUrl"
                  className="form-control"
                  value={form.portfolioUrl}
                  onChange={handleChange}
                  maxLength={255}
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">LinkedIn</label>
                <input
                  type="url"
                  name="linkedinUrl"
                  className="form-control"
                  value={form.linkedinUrl}
                  onChange={handleChange}
                  maxLength={255}
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">GitHub</label>
                <input
                  type="url"
                  name="githubUrl"
                  className="form-control"
                  value={form.githubUrl}
                  onChange={handleChange}
                  maxLength={255}
                />
              </div>
            </div>
          </SectionCard>

          <div className="d-flex gap-2">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save profile"}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => window.history.back()}
              disabled={saving}
            >
              Back to My Profile
            </button>
          </div>
        </form>
      ) : null}
    </>
  );
}