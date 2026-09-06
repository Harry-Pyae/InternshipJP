import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../components/shared/PageHeader.jsx";
import SectionCard from "../../components/shared/SectionCard.jsx";
import ErrorAlert from "../../components/shared/ErrorAlert.jsx";
import LoadingBlock from "../../components/shared/LoadingBlock.jsx";
import Avatar from "../../components/shared/Avatar.jsx";
import { studentApi } from "../../api/studentApi.js";
import { studentEducationApi } from "../../api/studentEducationApi.js";
import { describeApiError } from "../../api/axiosClient.js";

/**
 * The student's profile, read-only.
 */
const SKILL_GROUPS = [
  { type: "PROGRAMMING_LANGUAGE", label: "Programming languages" },
  { type: "TECHNICAL", label: "Technical" },
  { type: "SOFT", label: "Soft skills" },
  { type: "SPOKEN_LANGUAGE", label: "Languages" },
];

export default function StudentProfilePage() {
  const [profile, setProfile] = useState(null);
  const [skills, setSkills] = useState([]);
  const [education, setEducation] = useState([]);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [p, s, e] = await Promise.all([
        studentApi.getProfile(),
        studentApi.listSkills(),
        studentEducationApi.list(),
      ]);
      setProfile(p);
      setSkills(unwrap(s));
      setEducation(unwrap(e));
    } catch (requestError) {
      setError(describeApiError(requestError));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (profile === null && !error) {
    return <LoadingBlock label="Loading your profile..." />;
  }

  return (
    <>
      <PageHeader
        title="My profile"
        subtitle="What employers see when you apply."
        action={
          <Link className="btn btn-sm btn-ijp-primary" to="/student/profile/edit">
            <i className="bi bi-pencil me-1" aria-hidden="true" />
            Edit profile
          </Link>
        }
      />

      <ErrorAlert message={error} onRetry={load} />

      {profile ? (
        <>
          <div className="ijp-card p-3 p-md-4 mb-4">
            <div className="d-flex align-items-center gap-3 flex-wrap">
              <Avatar name={profile.fullName} />
              <div style={{ minWidth: 0 }}>
                <p className="h5 mb-1">{profile.fullName}</p>
                <p className="ijp-muted mb-0">
                  {profile.headline || "No headline yet"}
                </p>
              </div>
            </div>
          </div>

          <div className="row g-4">
            <div className="col-12 col-xl-6">
              <SectionCard title="Personal information">
                <dl className="ijp-detail-grid ijp-detail mb-0">
                  <Row label="Email" value={profile.email} mono />
                  <Row label="Date of birth" value={profile.dateOfBirth} mono />
                  <Row label="Age" value={profile.age} mono />
                  <Row label="City" value={profile.location} />
                  <Row label="Country" value={profile.country} />
                  <Row label="Available from" value={profile.availableFrom} mono />
                  <Row label="Preferred work mode" value={pretty(profile.preferredWorkMode)} />
                  <Row label="Availability" value={pretty(profile.availability)} />
                </dl>
              </SectionCard>
            </div>

            <div className="col-12 col-xl-6">
              <SectionCard title="Links">
                <dl className="ijp-detail-grid ijp-detail mb-0">
                  <Row label="Portfolio" value={profile.portfolioUrl} link />
                  <Row label="LinkedIn" value={profile.linkedinUrl} link />
                  <Row label="GitHub" value={profile.githubUrl} link />
                </dl>
                {profile.biography ? (
                  <div className="mt-4">
                    <p className="ijp-label mb-1">About</p>
                    <p className="mb-0" style={{ lineHeight: 1.6 }}>
                      {profile.biography}
                    </p>
                  </div>
                ) : null}
              </SectionCard>
            </div>

            <div className="col-12">
              <SectionCard
                title="Skills"
                action={
                  <Link className="btn btn-sm btn-ijp-quiet" to="/student/skills/edit">
                    Edit skills
                  </Link>
                }
              >
                {skills.length === 0 ? (
                  <p className="ijp-muted mb-0">
                    No skills yet. They are what the assistant matches you to vacancies with.
                  </p>
                ) : (
                  SKILL_GROUPS.map((group) => {
                    const inGroup = skills.filter((s) => s.skillType === group.type);
                    if (inGroup.length === 0) {
                      return null;
                    }
                    return (
                      <div className="mb-3" key={group.type}>
                        <p className="ijp-label mb-2">{group.label}</p>
                        <div className="ijp-pill-row">
                          {inGroup.map((skill) => (
                            <span
                              className="ijp-pill-skill ijp-pill-skill--have"
                              key={skill.id ?? skill.name}
                            >
                              {skill.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </SectionCard>
            </div>

            <div className="col-12">
              <SectionCard
                title="Education"
                action={
                  <Link className="btn btn-sm btn-ijp-quiet" to="/student/education/edit">
                    Edit education
                  </Link>
                }
              >
                {education.length === 0 ? (
                  <p className="ijp-muted mb-0">No education added yet.</p>
                ) : (
                  <ul className="ijp-gap-grid mb-0">
                    {education.map((item) => (
                      <li className="ijp-gap-row" key={item.id}>
                        <span className="ijp-gap-text">
                          <span className="ijp-gap-skill">
                            {item.degree || "Qualification"}
                            {item.fieldOfStudy ? ` · ${item.fieldOfStudy}` : ""}
                          </span>
                          <span className="ijp-muted">
                            {item.institution || "Institution not given"}
                            {item.graduationYear ? ` · ${item.graduationYear}` : ""}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </SectionCard>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}

/** One labelled value, with a visible "Not set" rather than a blank gap. */
function Row({ label, value, mono, link }) {
  const empty = value === null || value === undefined || value === "";
  return (
    <div>
      <dt>{label}</dt>
      {empty ? (
        <dd className="ijp-detail--empty" />
      ) : link ? (
        <dd className="text-truncate">
          <a href={String(value)} target="_blank" rel="noreferrer noopener">
            {String(value)}
          </a>
        </dd>
      ) : (
        <dd className={mono ? "ijp-data" : undefined}>{String(value)}</dd>
      )}
    </div>
  );
}

function pretty(value) {
  if (!value) {
    return value;
  }
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/** Her API modules return either the axios response or the body. */
function unwrap(result) {
  const body = result?.data ?? result;
  return Array.isArray(body) ? body : (body?.content ?? []);
}
