/**
 * Turns any status string in this product into a consistent coloured badge.
 *
 *   <StatusBadge value={application.status} />
 *   <StatusBadge value={certificate.verificationStatus} />
 *   <StatusBadge value={company.approvalStatus} />
 *
 * Use this everywhere rather than writing your own colours. A student seeing
 * amber on their certificate queue and an admin seeing amber on the approval
 * queue should mean the same thing: waiting on someone.
 *
 * Owner: Member 4.
 */
const TONES = {
  // good / finished
  VERIFIED: "ok",
  APPROVED: "ok",
  ACTIVE: "ok",
  ACCEPTED: "ok",
  OPEN: "ok",
  // waiting on someone
  PENDING: "warn",
  APPLIED: "warn",
  UNDER_REVIEW: "warn",
  SHORTLISTED: "warn",
  INTERVIEW: "warn",
  MORE_INFO_REQUIRED: "warn",
  DRAFT: "warn",
  // stopped
  REJECTED: "bad",
  SUSPENDED: "bad",
  WITHDRAWN: "bad",
  CLOSED: "bad",
};

export default function StatusBadge({ value }) {
  if (!value) {
    return null;
  }
  const tone = TONES[value] ?? "unknown";
  const label = value.toLowerCase().replace(/_/g, " ");

  return (
    <span className={`ijp-badge ijp-badge--${tone}`}>
      {label.charAt(0).toUpperCase() + label.slice(1)}
    </span>
  );
}
