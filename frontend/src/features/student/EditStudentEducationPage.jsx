import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import PageHeader from "../../components/shared/PageHeader.jsx";
import ErrorAlert from "../../components/shared/ErrorAlert.jsx";
import LoadingBlock from "../../components/shared/LoadingBlock.jsx";
import SectionCard from "../../components/shared/SectionCard.jsx";
import { describeApiError } from "../../api/axiosClient.js";
import { studentEducationApi } from "../../api/studentEducationApi.js";

export default function EditStudentEducationPage() {
    const navigate = useNavigate();
  const [education, setEducation] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    institution: "",
    degree: "",
    fieldOfStudy: "",
    startYear: "",
    endYear: "",
    grade: "",
  });

  async function loadEducation() {
    try {
      setLoading(true);
      setError("");

      const data = await studentEducationApi.list();
      setEducation(data);
    } catch (err) {
      setError(describeApiError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEducation();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function resetForm() {
    setForm({
      institution: "",
      degree: "",
      fieldOfStudy: "",
      startYear: "",
      endYear: "",
      grade: "",
    });

    setEditingId(null);
  }

  function startEdit(item) {
    setEditingId(item.id);

    setForm({
      institution: item.institution || "",
      degree: item.degree || "",
      fieldOfStudy: item.fieldOfStudy || "",
      startYear: item.startYear ?? "",
      endYear: item.endYear ?? "",
      grade: item.grade || "",
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const payload = {
        institution: form.institution,
        degree: form.degree || null,
        fieldOfStudy: form.fieldOfStudy || null,
        startYear: form.startYear
          ? Number(form.startYear)
          : null,
        endYear: form.endYear
          ? Number(form.endYear)
          : null,
        grade: form.grade || null,
      };

      if (editingId) {
        const updated = await studentEducationApi.update(
          editingId,
          payload
        );

        setEducation((current) =>
          current.map((item) =>
            item.id === editingId ? updated : item
          )
        );
      } else {
        const created = await studentEducationApi.add(payload);

        setEducation((current) => [
          ...current,
          created,
        ]);
      }

      resetForm();
    } catch (err) {
      setError(describeApiError(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (
      !window.confirm(
        "Are you sure you want to remove this education record?"
      )
    ) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      await studentEducationApi.remove(id);

      setEducation((current) =>
        current.filter((item) => item.id !== id)
      );

      if (editingId === id) {
        resetForm();
      }
    } catch (err) {
      setError(describeApiError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Edit education"
        subtitle="Add, update, or remove your education records."
      />

      {error ? <ErrorAlert message={error} /> : null}

      {loading ? <LoadingBlock /> : null}

      {!loading ? (
        <div className="d-grid gap-4">
          <SectionCard title="Your education">
            {education.length === 0 ? (
              <div className="text-muted">
                No education records added yet.
              </div>
            ) : (
              <div className="d-grid gap-3">
                {education.map((item) => (
                  <div
                    key={item.id}
                    className="border rounded p-3"
                  >
                    <div className="d-flex justify-content-between align-items-start gap-3">
                      <div>
                        <h5 className="mb-1">
                          {item.institution}
                        </h5>

                        {item.degree ? (
                          <div className="ijp-data">
                            {item.degree}
                          </div>
                        ) : null}

                        {item.fieldOfStudy ? (
                          <div className="text-muted">
                            {item.fieldOfStudy}
                          </div>
                        ) : null}

                        <div className="text-muted mt-2">
                          {item.startYear || "?"}
                          {" - "}
                          {item.endYear || "Present"}
                        </div>

                        {item.grade ? (
                          <div className="text-muted">
                            Grade: {item.grade}
                          </div>
                        ) : null}
                      </div>

                      <div className="d-flex gap-2">
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-sm"
                          onClick={() => startEdit(item)}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          onClick={() =>
                            handleDelete(item.id)
                          }
                          disabled={saving}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title={
              editingId
                ? "Edit education"
                : "Add education"
            }
          >
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label">
                    Institution
                  </label>

                  <input
                    type="text"
                    name="institution"
                    className="form-control"
                    value={form.institution}
                    onChange={handleChange}
                    maxLength={150}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">
                    Degree
                  </label>

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
                  <label className="form-label">
                    Field of study
                  </label>

                  <input
                    type="text"
                    name="fieldOfStudy"
                    className="form-control"
                    value={form.fieldOfStudy}
                    onChange={handleChange}
                    maxLength={150}
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label">
                    Start year
                  </label>

                  <input
                    type="number"
                    name="startYear"
                    className="form-control"
                    value={form.startYear}
                    onChange={handleChange}
                    min={1950}
                    max={2100}
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label">
                    End year
                  </label>

                  <input
                    type="number"
                    name="endYear"
                    className="form-control"
                    value={form.endYear}
                    onChange={handleChange}
                    min={1950}
                    max={2100}
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label">
                    Grade
                  </label>

                  <input
                    type="text"
                    name="grade"
                    className="form-control"
                    value={form.grade}
                    onChange={handleChange}
                    maxLength={50}
                  />
                </div>

                <div className="col-12 d-flex gap-2">
  <button
    type="submit"
    className="btn btn-primary"
    disabled={saving}
  >
    {saving
      ? "Saving..."
      : editingId
        ? "Update education"
        : "Add education"}
  </button>

  {editingId ? (
    <button
      type="button"
      className="btn btn-secondary"
      onClick={resetForm}
      disabled={saving}
    >
      Cancel
    </button>
  ) : null}

  <button
    type="button"
    className="btn btn-secondary"
    onClick={() => navigate("/student/profile")}
    disabled={saving}
  >
    Back to My Profile
  </button>
</div>
              </div>
            </form>
          </SectionCard>
        </div>
      ) : null}
    </>
  );
}