import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import PageHeader from "../../components/shared/PageHeader.jsx";
import ErrorAlert from "../../components/shared/ErrorAlert.jsx";
import LoadingBlock from "../../components/shared/LoadingBlock.jsx";
import SectionCard from "../../components/shared/SectionCard.jsx";
import { describeApiError } from "../../api/axiosClient.js";
import { studentEducationApi } from "../../api/studentEducationApi.js";
import { useLanguage } from "../../config/languageContext.jsx";
import ConfirmDialog from "../../components/shared/ConfirmDialog.jsx";
import CharCount from "../../components/shared/CharCount.jsx";

export default function EditStudentEducationPage() {
  const { t } = useLanguage();
    const navigate = useNavigate();
  const [education, setEducation] = useState([]);
  const [confirming, setConfirming] = useState(null);
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

  async function doDelete(id) {
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
        title={t("Edit education")}
        subtitle={t("Add, update, or remove your education records.")}
      />

      {error ? <ErrorAlert message={error} /> : null}

      {loading ? <LoadingBlock /> : null}

      {!loading ? (
        <div className="d-grid gap-4">
          <SectionCard title={t("Your education")}>
            {education.length === 0 ? (
              <div className="text-muted">{t("No education records added yet.")}</div>
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
                          {item.endYear || t("Present")}
                        </div>

                        {item.grade ? (
                          <div className="text-muted">
                            {t("Grade: {grade}", { grade: item.grade })}
                          </div>
                        ) : null}
                      </div>

                      <div className="d-flex gap-2">
                        <button
                          type="button"
                          className="btn btn-ijp-primary btn-sm"
                          onClick={() => startEdit(item)}
                        >{t("Edit")}</button>

                        <button
                          type="button"
                          className="btn btn-ijp-quiet ijp-btn-danger btn-sm"
                          onClick={() =>
                            setConfirming(item.id)
                          }
                          disabled={saving}
                        >{t("Delete")}</button>
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
                  <label htmlFor="institution" className="form-label">{t("Institution")}</label>

                  <input
                    type="text"
                    id="institution"
                  name="institution"
                    className="form-control"
                    value={form.institution}
                    onChange={handleChange}
                    maxLength={150}
                    required
                  />
                  <CharCount value={form.institution} max={150} />
                </div>

                <div className="col-md-6">
                  <label htmlFor="degree" className="form-label">{t("Degree")}</label>

                  <input
                    type="text"
                    id="degree"
                  name="degree"
                    className="form-control"
                    value={form.degree}
                    onChange={handleChange}
                    maxLength={150}
                    required
                  />
                    <CharCount value={form.degree} max={150} />
                </div>

                <div className="col-md-6">
                  <label htmlFor="fieldOfStudy" className="form-label">{t("Field of study")}</label>

                  <input
                    type="text"
                    id="fieldOfStudy"
                  name="fieldOfStudy"
                    className="form-control"
                    value={form.fieldOfStudy}
                    onChange={handleChange}
                    maxLength={150}
                    required
                  />
                    <CharCount value={form.fieldOfStudy} max={150} />
                </div>

                <div className="col-md-4">
                  <label htmlFor="startYear" className="form-label">{t("Start year")}</label>

                  <input
                    type="number"
                    id="startYear"
                  name="startYear"
                    className="form-control"
                    value={form.startYear}
                    onChange={handleChange}
                    min={1950}
                    max={2100}
                    required
                  />
                </div>

                <div className="col-md-4">
                  <label htmlFor="endYear" className="form-label">{t("End year")}</label>

                  <input
                    type="number"
                    id="endYear"
                  name="endYear"
                    className="form-control"
                    value={form.endYear}
                    onChange={handleChange}
                    min={1950}
                    max={2100}
                    required
                  />
                </div>

                <div className="col-md-4">
                  {/* A CGPA is a decimal - 3.33, 3.45 - so the field accepts
                      one. As a text box it took anything at all. */}
                  <label htmlFor="grade" className="form-label">{t("CGPA")}</label>

                  <input
                    id="grade"
                    type="number"
                    step="0.01"
                    min="0"
                    max="5"
                  name="grade"
                    className="form-control"
                    value={form.grade}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-12 d-flex gap-2">
  <button
    type="submit"
    className="btn btn-ijp-primary"
    disabled={saving}
  >
    {t(saving
      ? "Saving..."
      : editingId
        ? "Update education"
        : "Add education")}
  </button>

  {editingId ? (
    <button
      type="button"
      className="btn btn-ijp-quiet"
      onClick={resetForm}
      disabled={saving}
    >{t("Cancel")}</button>
  ) : null}

  <button
    type="button"
    className="btn btn-ijp-quiet"
    onClick={() => navigate("/student/profile")}
    disabled={saving}
  >{t("Back to My Profile")}</button>
</div>
              </div>
            </form>
          </SectionCard>
        </div>
      ) : null}
      <ConfirmDialog
        open={confirming !== null}
        tone="danger"
        title={t("Remove this education record?")}
        message={t("It leaves your profile and stops being sent with applications. This cannot be undone.")}
        confirmLabel={t("Remove")}
        busy={saving}
        onCancel={() => setConfirming(null)}
        onConfirm={async () => {
          await doDelete(confirming);
          setConfirming(null);
        }}
      />

    </>
  );
}