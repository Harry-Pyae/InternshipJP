package com.internshipjp.backend.dto.response;

import java.util.List;

/**
 * "What should I work on today?" - the administrator's calculated report.
 *
 * The counterpart to the student's skill gaps and the employer's company
 * review. It answers the question an admin actually has when they sign in:
 * what is waiting on me, and what has been waiting too long?
 *
 * AGE IS THE POINT
 *   A queue of five certificates tells you nothing. A certificate that has
 *   been pending for eleven days tells you a student has been stuck for eleven
 *   days, unable to show that qualification to any employer. So every work
 *   item carries daysWaiting, and the lists are ordered oldest first.
 *
 * All calculated from the database. No AI provider is involved.
 */
public class AdminWorkloadResponse {

    private String generatedAt;

    private long certificatesPending;
    private long companiesPending;
    private long applicationsStalled;

    private long totalStudents;
    private long totalEmployers;
    private long suspendedAccounts;

    /** Certificates waiting for review, longest first. */
    private List<WorkItem> oldestCertificates;

    /** Companies waiting for approval, longest first. */
    private List<WorkItem> oldestCompanies;

    /**
     * Applications no employer has looked at. Not the admin's to decide, but
     * theirs to notice - a student waiting three weeks for a first response is
     * a platform problem, not an employer preference.
     */
    private List<WorkItem> stalledApplications;

    /** Ordered actions, each traceable to a number above. */
    private List<String> priorities;

    private String summary;

    /** One thing waiting on somebody, with how long it has waited. */
    public static class WorkItem {

        private Long id;
        private String label;
        private String detail;
        private int daysWaiting;
        /** ok / warn / bad, from the age. Drives the colour in the UI. */
        private String urgency;

        public WorkItem() {
        }

        public WorkItem(Long id, String label, String detail, int daysWaiting, String urgency) {
            this.id = id;
            this.label = label;
            this.detail = detail;
            this.daysWaiting = daysWaiting;
            this.urgency = urgency;
        }

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getLabel() {
            return label;
        }

        public void setLabel(String label) {
            this.label = label;
        }

        public String getDetail() {
            return detail;
        }

        public void setDetail(String detail) {
            this.detail = detail;
        }

        public int getDaysWaiting() {
            return daysWaiting;
        }

        public void setDaysWaiting(int daysWaiting) {
            this.daysWaiting = daysWaiting;
        }

        public String getUrgency() {
            return urgency;
        }

        public void setUrgency(String urgency) {
            this.urgency = urgency;
        }
    }

    public String getGeneratedAt() {
        return generatedAt;
    }

    public void setGeneratedAt(String generatedAt) {
        this.generatedAt = generatedAt;
    }

    public long getCertificatesPending() {
        return certificatesPending;
    }

    public void setCertificatesPending(long certificatesPending) {
        this.certificatesPending = certificatesPending;
    }

    public long getCompaniesPending() {
        return companiesPending;
    }

    public void setCompaniesPending(long companiesPending) {
        this.companiesPending = companiesPending;
    }

    public long getApplicationsStalled() {
        return applicationsStalled;
    }

    public void setApplicationsStalled(long applicationsStalled) {
        this.applicationsStalled = applicationsStalled;
    }

    public long getTotalStudents() {
        return totalStudents;
    }

    public void setTotalStudents(long totalStudents) {
        this.totalStudents = totalStudents;
    }

    public long getTotalEmployers() {
        return totalEmployers;
    }

    public void setTotalEmployers(long totalEmployers) {
        this.totalEmployers = totalEmployers;
    }

    public long getSuspendedAccounts() {
        return suspendedAccounts;
    }

    public void setSuspendedAccounts(long suspendedAccounts) {
        this.suspendedAccounts = suspendedAccounts;
    }

    public List<WorkItem> getOldestCertificates() {
        return oldestCertificates;
    }

    public void setOldestCertificates(List<WorkItem> oldestCertificates) {
        this.oldestCertificates = oldestCertificates;
    }

    public List<WorkItem> getOldestCompanies() {
        return oldestCompanies;
    }

    public void setOldestCompanies(List<WorkItem> oldestCompanies) {
        this.oldestCompanies = oldestCompanies;
    }

    public List<WorkItem> getStalledApplications() {
        return stalledApplications;
    }

    public void setStalledApplications(List<WorkItem> stalledApplications) {
        this.stalledApplications = stalledApplications;
    }

    public List<String> getPriorities() {
        return priorities;
    }

    public void setPriorities(List<String> priorities) {
        this.priorities = priorities;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }
}
