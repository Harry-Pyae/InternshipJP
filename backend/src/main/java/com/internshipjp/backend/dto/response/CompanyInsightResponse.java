package com.internshipjp.backend.dto.response;

import java.util.List;

/**
 * "What are we doing wrong as an employer?" - answered from the company's own
 * listings and pipeline.
 *
 * This is the employer counterpart to SkillGapResponse. It looks at the
 * company's vacancies, how they are written, how many people applied, how
 * quickly those people are being reviewed, and whether the skills being asked
 * for actually exist among students on the platform.
 *
 * All figures are calculated; no AI provider is involved.
 */
public class CompanyInsightResponse {

    private String companyName;
    private String approvalStatus;

    private int totalInternships;
    private int openInternships;
    private int draftInternships;

    private long totalApplications;
    private long awaitingReview;
    private long shortlisted;
    private long accepted;
    private long rejected;

    /** Internships with something wrong or missing, worst first. */
    private List<ListingIssue> listingIssues;

    /** Skills this company asks for that very few students actually have. */
    private List<SkillDemandItem> hardToFillSkills;

    /** Concrete, ordered actions - each one traceable to a number above. */
    private List<String> recommendations;

    private String summary;

    /**
     * One thing wrong with a listing, as a code plus readable text.
     *
     * WHY BOTH
     *   The text is for the language model and for anyone reading the JSON.
     *   The code is for the UI, so it can pick an icon and a colour without
     *   pattern-matching English. Matching on prose works right up until
     *   somebody rewords a sentence, and then the icons silently go wrong with
     *   nothing failing - the worst kind of bug.
     */
    public static class Issue {

        private String code;
        private String text;

        public Issue() {
        }

        public Issue(String code, String text) {
            this.code = code;
            this.text = text;
        }

        public String getCode() {
            return code;
        }

        public void setCode(String code) {
            this.code = code;
        }

        public String getText() {
            return text;
        }

        public void setText(String text) {
            this.text = text;
        }
    }

    /** One vacancy and everything that is weak about it. */
    public static class ListingIssue {

        private Long internshipId;
        private String title;
        private String status;
        private long applicationCount;
        private List<Issue> issues;

        public ListingIssue() {
        }

        public ListingIssue(Long internshipId, String title, String status,
                            long applicationCount, List<Issue> issues) {
            this.internshipId = internshipId;
            this.title = title;
            this.status = status;
            this.applicationCount = applicationCount;
            this.issues = issues;
        }

        public Long getInternshipId() {
            return internshipId;
        }

        public void setInternshipId(Long internshipId) {
            this.internshipId = internshipId;
        }

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public long getApplicationCount() {
            return applicationCount;
        }

        public void setApplicationCount(long applicationCount) {
            this.applicationCount = applicationCount;
        }

        public List<Issue> getIssues() {
            return issues;
        }

        public void setIssues(List<Issue> issues) {
            this.issues = issues;
        }
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getApprovalStatus() {
        return approvalStatus;
    }

    public void setApprovalStatus(String approvalStatus) {
        this.approvalStatus = approvalStatus;
    }

    public int getTotalInternships() {
        return totalInternships;
    }

    public void setTotalInternships(int totalInternships) {
        this.totalInternships = totalInternships;
    }

    public int getOpenInternships() {
        return openInternships;
    }

    public void setOpenInternships(int openInternships) {
        this.openInternships = openInternships;
    }

    public int getDraftInternships() {
        return draftInternships;
    }

    public void setDraftInternships(int draftInternships) {
        this.draftInternships = draftInternships;
    }

    public long getTotalApplications() {
        return totalApplications;
    }

    public void setTotalApplications(long totalApplications) {
        this.totalApplications = totalApplications;
    }

    public long getAwaitingReview() {
        return awaitingReview;
    }

    public void setAwaitingReview(long awaitingReview) {
        this.awaitingReview = awaitingReview;
    }

    public long getShortlisted() {
        return shortlisted;
    }

    public void setShortlisted(long shortlisted) {
        this.shortlisted = shortlisted;
    }

    public long getAccepted() {
        return accepted;
    }

    public void setAccepted(long accepted) {
        this.accepted = accepted;
    }

    public long getRejected() {
        return rejected;
    }

    public void setRejected(long rejected) {
        this.rejected = rejected;
    }

    public List<ListingIssue> getListingIssues() {
        return listingIssues;
    }

    public void setListingIssues(List<ListingIssue> listingIssues) {
        this.listingIssues = listingIssues;
    }

    public List<SkillDemandItem> getHardToFillSkills() {
        return hardToFillSkills;
    }

    public void setHardToFillSkills(List<SkillDemandItem> hardToFillSkills) {
        this.hardToFillSkills = hardToFillSkills;
    }

    public List<String> getRecommendations() {
        return recommendations;
    }

    public void setRecommendations(List<String> recommendations) {
        this.recommendations = recommendations;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }
}
