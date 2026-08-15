package com.internshipjp.backend.dto.response;

import java.util.List;

/**
 * One recommended internship, with the reasoning shown.
 *
 * WHY THIS IS NOT AN AI RESPONSE
 *   The score is calculated in ordinary Java by comparing the student's skills
 *   with the internship's required skills. It is deterministic, it costs
 *   nothing, and it works with the AI provider switched off entirely.
 *
 *   matchedSkills and missingSkills exist so the number is never a mystery:
 *   a student who sees 40% can also see exactly which two of five skills
 *   matched and which three did not.
 *
 *   The language model's job is to talk about these results, not to invent them.
 */
public class InternshipMatchResponse {

    private Long internshipId;
    private String title;
    private String companyName;
    private String location;
    private String workMode;
    private String applicationDeadline;
    private int matchScore;
    private List<String> matchedSkills;
    private List<String> missingSkills;
    private boolean alreadyApplied;
    private String explanation;

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

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getWorkMode() {
        return workMode;
    }

    public void setWorkMode(String workMode) {
        this.workMode = workMode;
    }

    public String getApplicationDeadline() {
        return applicationDeadline;
    }

    public void setApplicationDeadline(String applicationDeadline) {
        this.applicationDeadline = applicationDeadline;
    }

    public int getMatchScore() {
        return matchScore;
    }

    public void setMatchScore(int matchScore) {
        this.matchScore = matchScore;
    }

    public List<String> getMatchedSkills() {
        return matchedSkills;
    }

    public void setMatchedSkills(List<String> matchedSkills) {
        this.matchedSkills = matchedSkills;
    }

    public List<String> getMissingSkills() {
        return missingSkills;
    }

    public void setMissingSkills(List<String> missingSkills) {
        this.missingSkills = missingSkills;
    }

    public boolean isAlreadyApplied() {
        return alreadyApplied;
    }

    public void setAlreadyApplied(boolean alreadyApplied) {
        this.alreadyApplied = alreadyApplied;
    }

    public String getExplanation() {
        return explanation;
    }

    public void setExplanation(String explanation) {
        this.explanation = explanation;
    }
}
