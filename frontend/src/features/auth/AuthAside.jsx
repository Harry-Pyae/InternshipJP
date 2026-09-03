import AuthIllustration from "./AuthIllustration.jsx";

/**
 * The left panel on the sign-in and sign-up pages.
 *
 * It used to be an illustration floating in an empty slab. Now it says what
 * the product actually does - and each line is something the platform really
 * enforces, not marketing:
 *
 *   matching     the score comes from comparing skills, calculated in Java
 *   verified     employers genuinely cannot see an unverified certificate
 *   guidance     the assistant reads real profile data, never invents it
 *
 * Shared by both auth pages so they cannot drift apart.
 */
const POINTS = [
  {
    icon: "bi-ui-checks-grid",
    tone: "signal",
    title: "Matched on real skills",
    text: "Every internship is scored against what you can actually do, and the score explains itself.",
  },
  {
    icon: "bi-patch-check",
    tone: "verified",
    title: "Verified qualifications",
    text: "Employers only ever see certificates an administrator has checked.",
  },
  {
    icon: "bi-stars",
    tone: "accent",
    title: "Guidance that reads your profile",
    text: "The assistant works from your own data - what to learn next, and what is missing.",
  },
];

export default function AuthAside() {
  return (
    <aside className="ijp-auth-aside">
      <div className="ijp-auth-aside-head">
        <span className="ijp-sidebar-mark" aria-hidden="true">
          <i className="bi bi-mortarboard-fill" />
        </span>
        <span className="ijp-brand" style={{ fontSize: "1.15rem" }}>
          Internship<span className="ijp-brand-mark">JP</span>
        </span>
      </div>

      <p className="ijp-auth-tagline">Find opportunities. Build your future.</p>

      <AuthIllustration />

      <ul className="ijp-auth-points">
        {POINTS.map((point) => (
          <li key={point.title}>
            <span className={`ijp-auth-point-icon ijp-auth-point-icon--${point.tone}`} aria-hidden="true">
              <i className={`bi ${point.icon}`} />
            </span>
            <span>
              <span className="ijp-auth-point-title">{point.title}</span>
              <span className="ijp-auth-point-text">{point.text}</span>
            </span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
