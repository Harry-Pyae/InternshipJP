/**
 * Where a notification goes when you click it.
 *
 * Two tables. ROUTES opens the queue a notification belongs to; RECORD_ROUTES
 * opens the record it is actually about. Shared by the notifications page and
 * the bell in the top bar, because the same notification should lead to the
 * same place from either.
 */

/**
 * Where to go when a notification names the record it is about.
 *
 * ROUTES, below, opens the queue. This one opens the thing itself, which is
 * what somebody clicking "your application was updated" actually wants - the
 * queue only tells them to go and find it.
 *
 * A notification created before reference_id existed has none, so it falls
 * back to the queue. That is the behaviour it was created under.
 */
export const RECORD_ROUTES = {
  APPLICATION_STATUS_CHANGED: { STUDENT: (id) => `/student/applications?open=${id}` },
  APPLICATION_MESSAGE: {
    STUDENT: (id) => `/student/applications?open=${id}`,
    // A student's reply reaches the employer as the same type. Without this
    // line it led nowhere, which is why replying looked impossible from the
    // employer's side - the page it lands on has the message box.
    // The hash takes the employer to the exchange rather than to the top of a
    // long page, where the reply they clicked is three screens down.
    EMPLOYER: (id) => `/employer/applications/${id}#messages`,
  },
  APPLICATION_RECEIVED: { EMPLOYER: (id) => `/employer/applications/${id}` },
  CERTIFICATE_VERIFICATION_REQUESTED: { ADMIN: (id) => `/admin/certificates/${id}` },
  COMPANY_APPROVAL_REQUESTED: { ADMIN: (id) => `/admin/employers/${id}` },
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
  APPLICATION_STATUS_CHANGED: { STUDENT: "/student/applications" },
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
  const exact = RECORD_ROUTES[item?.type]?.[role];
  if (exact && item?.referenceId) {
    return exact(item.referenceId);
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
