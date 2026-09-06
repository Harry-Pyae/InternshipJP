import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import PageHeader from "../../components/shared/PageHeader.jsx";
import ErrorAlert from "../../components/shared/ErrorAlert.jsx";
import LoadingBlock from "../../components/shared/LoadingBlock.jsx";
import SectionCard from "../../components/shared/SectionCard.jsx";
import { describeApiError } from "../../api/axiosClient.js";
import { studentApi } from "../../api/studentApi.js";
import Select from "../../components/shared/Select.jsx";
import { useLanguage } from "../../config/languageContext.jsx";

/** The four types the backend accepts, in the order they are worth reading. */
const SKILL_GROUPS = [
  { type: "PROGRAMMING_LANGUAGE", label: "Programming languages" },
  { type: "TECHNICAL", label: "Technical" },
  { type: "SOFT", label: "Soft skills" },
  { type: "SPOKEN_LANGUAGE", label: "Languages" },
];

export default function EditStudentSkillsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    skillType: "PROGRAMMING_LANGUAGE",
  });

  const [editingId, setEditingId] = useState(null);

  async function loadSkills() {
    try {
      setLoading(true);
      setError("");

      const data = await studentApi.listSkills();
      setSkills(data);
    } catch (err) {
      setError(describeApiError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSkills();
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
      name: "",
      skillType: "PROGRAMMING_LANGUAGE",
    });

    setEditingId(null);
  }

  function startEdit(skill) {
    setEditingId(skill.id);

    setForm({
      name: skill.name || "",
      skillType: skill.skillType || "PROGRAMMING_LANGUAGE",
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const payload = {
        name: form.name,
        skillType: form.skillType,
      };

      if (editingId) {
        const updated = await studentApi.updateSkill(editingId, payload);

        setSkills((current) =>
          current.map((skill) =>
            skill.id === editingId ? updated : skill
          )
        );
      } else {
        const created = await studentApi.addSkill(payload);

        setSkills((current) => [...current, created]);
      }

      resetForm();
    } catch (err) {
      setError(describeApiError(err));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to remove this skill?")) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      await studentApi.deleteSkill(id);

      setSkills((current) =>
        current.filter((skill) => skill.id !== id)
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
        title="Edit skills"
        subtitle="Add, update, or remove your skills."
      />

      {error ? <ErrorAlert message={error} /> : null}

      {loading ? <LoadingBlock /> : null}

      {!loading ? (
        <div className="d-grid gap-4">
          <SectionCard title="Your skills">
            {skills.length === 0 ? (
              <p className="ijp-muted mb-0">
                {t("No skills yet. They are what the assistant matches you to vacancies with.")}
              </p>
            ) : (
              SKILL_GROUPS.map((group) => {
                const inGroup = skills.filter((s) => s.skillType === group.type);
                if (inGroup.length === 0) {
                  return null;
                }
                return (
                  <div className="mb-3" key={group.type}>
                    <p className="ijp-label mb-2">{t(group.label)}</p>
                    <div className="ijp-pill-row">
                      {inGroup.map((skill) => (
                        // The pill IS the control: press it to edit, press the
                        // x to remove. Two outline buttons per skill turned six
                        // skills into a screenful of chrome.
                        <span
                          className={`ijp-skill-chip${
                            editingId === skill.id ? " ijp-skill-chip--editing" : ""
                          }`}
                          key={skill.id}
                        >
                          <button
                            type="button"
                            className="ijp-skill-chip-name"
                            onClick={() => startEdit(skill)}
                            title={t("Edit")}
                          >
                            {skill.name}
                          </button>
                          <button
                            type="button"
                            className="ijp-skill-chip-x"
                            onClick={() => handleDelete(skill.id)}
                            aria-label={`${t("Remove")} ${skill.name}`}
                          >
                            <i className="bi bi-x" aria-hidden="true" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </SectionCard>

          <SectionCard title={editingId ? "Edit skill" : "Add a skill"}>
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">
                    Skill name
                  </label>

                  <input
                    type="text"
                    name="name"
                    className="form-control"
                    value={form.name}
                    onChange={handleChange}
                    maxLength={100}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">
                    Skill type
                  </label>

                  <Select
                    value={form.skillType}
                    onChange={(value) => setForm((c) => ({ ...c, skillType: value }))}
                    groups={[{ label: null, items: SKILL_GROUPS.map((g) => ({
                      value: g.type,
                      label: t(g.label),
                    })) }]}
                    ariaLabel={t("Skill type")}
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
        ? "Update skill"
        : "Add skill"}
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