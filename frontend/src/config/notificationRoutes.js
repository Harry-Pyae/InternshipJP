/**
 * Where a notification goes when you click it.
 *
 * Two tables. ROUTES opens the queue a notification belongs to; RECORD_ROUTES
 * opens the record it is actually about. Shared by the notifications page and
 * the bell in the top bar, because the same notification should lead to the
 * same place from either.
 */

/** Builds a record route that only applies when the notification names its record. */
const byReference = (build) => (item) => (item?.referenceId ? build(item.referenceId) : null);

/**
 * Where to go when a notification names the record it is about.
 *
 * ROUTES, below, opens the queue. This one opens the thing itself, which is
 * what somebody clicking "your application was updated" actually wants - the
 * queue only tells them to go and find it.
 *
 * Each entry takes the notification and returns a path, or null to fall back
 * to the queue. A notification created before its type carried a reference
 * has none, so it opens the queue - the behaviour it was created under.
 */
export const RECORD_ROUTES = {
  // ?open= puts that application on screen and marks it; the list is paged,
  // so without it the one you clicked could be on another page entirely.
  APPLICATION_STATUS_CHANGED: {
    STUDENT: byReference((id) => `/student/applications?open=${id}`),
    // An employer receives this type too, since a student withdrawing is a
    // status change they are waiting on. Without this line it fell through to
    // the employer's notification list - not a dead row, but it left them to
    // go and find the application the notice was about.
    EMPLOYER: byReference((id) => `/employer/applications/${id}`),
  },
  APPLICATION_MESSAGE: {
    // The hash also opens the conversation, which is what the message is.
    STUDENT: byReference((id) => `/student/applications?open=${id}#messages`),
    // A student's reply reaches the employer as the same type. Without this
    // line it led nowhere, which is why replying looked impossible from the
    // employer's side - the page it lands on has the message box.
    // The hash takes the employer to the exchange rather than to the top of a
    // long page, where the reply they clicked is three screens down.
    EMPLOYER: byReference((id) => `/employer/applications/${id}#messages`),
  },
  APPLICATION_RECEIVED: {
    EMPLOYER: byReference((id) => `/employer/applications/${id}`),
  },
  CERTIFICATE_VERIFIED: {
    STUDENT: byReference((id) => `/student/certificates?open=${id}`),
  },
  CERTIFICATE_REJECTED: {
    STUDENT: byReference((id) => `/student/certificates?open=${id}`),
  },
  CERTIFICATE_VERIFICATION_REQUESTED: {
    ADMIN: byReference((id) => `/admin/certificates/${id}`),
  },
  COMPANY_APPROVAL_REQUESTED: {
    ADMIN: byReference((id) => `/admin/employers/${id}`),
  },
  // Feedback has no record behind it: the notification is the feedback, so
  // the inbox opens it by the notification's own id. Older rows work too.
  FEEDBACK: {
    ADMIN: (item) => (item?.id ? `/admin/faq?feedback=${item.id}` : null),
  },
};

/**
 * The queue each notification type belongs to, per role. Used when a
 * notification has no reference_id, or its type has no RECORD_ROUTES entry.
 */
export const ROUTES = {
  CERTIFICATE_VERIFICATION_REQUESTED: { ADMIN: "/admin/certificates" },
  COMPANY_APPROVAL_REQUESTED: { ADMIN: "/admin/employers" },
  // AdminService emits "COMPANY_" + decision.name(), so an employer receives
  // COMPANY_APPROVED or COMPANY_REJECTED. Neither was here, so the one
  // notification that tells an employer their registration was decided was
  // the one that led nowhere - while the equivalent certificate decisions
  // have always taken a student to their certificates.
  COMPANY_APPROVED: { EMPLOYER: "/employer/company" },
  COMPANY_REJECTED: { EMPLOYER: "/employer/company" },
  // MORE_INFO_REQUIRED is a permitted decision, not a hypothetical: the
  // request validator accepts APPROVED, REJECTED and MORE_INFO_REQUIRED,
  // and it is the one an employer most needs to act on.
  COMPANY_MORE_INFO_REQUIRED: { EMPLOYER: "/employer/company" },
  // Raised when a second recruiter registers with this company's
  // registration number. It goes to the company page because that is where
  // the organisation is, and an unexpected joiner is a reason to look.
  COMPANY_RECRUITER_JOINED: { EMPLOYER: "/employer/company" },
  // Raised when a student applies. It goes to the applicants list, which is
  // where the employer acts on it.
  APPLICATION_RECEIVED: { EMPLOYER: "/employer/applications" },
  FEEDBACK: { ADMIN: "/admin/faq" },
  CERTIFICATE_VERIFIED: { STUDENT: "/student/certificates" },
  CERTIFICATE_REJECTED: { STUDENT: "/student/certificates" },
  APPLICATION_STATUS_CHANGED: {
    STUDENT: "/student/applications",
    EMPLOYER: "/employer/applications",
  },
  APPLICATION_MESSAGE: { STUDENT: "/student/applications", EMPLOYER: "/employer/applications" },
  // A notice from an administrator. The ACCOUNT_ prefix files it under the
  // Account tab. It opens the notifications page, because the notice itself
  // is the whole of it: there is no record behind it and no reply to write.
  ACCOUNT_NOTICE: {
    STUDENT: "/student/notifications",
    EMPLOYER: "/employer/notifications",
    ADMIN: "/admin/notifications",
  },

  ACCOUNT_STATUS_CHANGED: {
    STUDENT: "/student/settings",
    EMPLOYER: "/employer/settings",
    ADMIN: "/admin/settings",
  },
};

/** The destination for one notification, or null when it leads nowhere. */
export function destinationFor(item, role) {
  const exact = RECORD_ROUTES[item?.type]?.[role]?.(item);
  if (exact) {
    return exact;
  }
  const queue = ROUTES[item?.type]?.[role];
  if (queue) {
    return queue;
  }

  // A row always leads somewhere.
  //
  // A type with no entry for this role used to produce a dead row - no arrow,
  // no click, no explanation. Falling back to the notifications page is worse
  // than opening the right record and far better than nothing: the person at
  // least reaches the notice in full. It also means a type added later works
  // before anybody remembers to add it to the table above.
  const base = { STUDENT: "/student", EMPLOYER: "/employer", ADMIN: "/admin" }[role];
  return base ? `${base}/notifications` : null;
}
