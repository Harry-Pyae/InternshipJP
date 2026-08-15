package com.internshipjp.backend.dto.response;

import java.util.List;

/**
 * "What should I learn to get hired?" - answered with numbers, not opinions.
 *
 * Every figure comes from data already on the platform: the skills this student
 * lists, and the skills the currently open internships ask for. Nothing here
 * involves an AI provider, so it works with no API key.
 */
public class SkillGapResponse {

    /** 0-100. How much of the profile an employer would actually see filled in. */
    private int profileCompleteness;

    /** Plain descriptions of what is still empty, e.g. "No skills added yet". */
    private List<String> profileGaps;

    /** Skills to learn next, most in demand first. */
    private List<SkillDemandItem> skillsToLearn;

    /** Skills the student already has that employers are asking for. */
    private List<SkillDemandItem> strengths;

    /** Skills on the profile that no open internship currently asks for. */
    private List<String> skillsNotInDemand;

    private int openInternshipCount;
    private int verifiedCertificateCount;
    private int applicationCount;

    /** One deterministic paragraph summarising the above. */
    private String summary;

    public int getProfileCompleteness() {
        return profileCompleteness;
    }

    public void setProfileCompleteness(int profileCompleteness) {
        this.profileCompleteness = profileCompleteness;
    }

    public List<String> getProfileGaps() {
        return profileGaps;
    }

    public void setProfileGaps(List<String> profileGaps) {
        this.profileGaps = profileGaps;
    }

    public List<SkillDemandItem> getSkillsToLearn() {
        return skillsToLearn;
    }

    public void setSkillsToLearn(List<SkillDemandItem> skillsToLearn) {
        this.skillsToLearn = skillsToLearn;
    }

    public List<SkillDemandItem> getStrengths() {
        return strengths;
    }

    public void setStrengths(List<SkillDemandItem> strengths) {
        this.strengths = strengths;
    }

    public List<String> getSkillsNotInDemand() {
        return skillsNotInDemand;
    }

    public void setSkillsNotInDemand(List<String> skillsNotInDemand) {
        this.skillsNotInDemand = skillsNotInDemand;
    }

    public int getOpenInternshipCount() {
        return openInternshipCount;
    }

    public void setOpenInternshipCount(int openInternshipCount) {
        this.openInternshipCount = openInternshipCount;
    }

    public int getVerifiedCertificateCount() {
        return verifiedCertificateCount;
    }

    public void setVerifiedCertificateCount(int verifiedCertificateCount) {
        this.verifiedCertificateCount = verifiedCertificateCount;
    }

    public int getApplicationCount() {
        return applicationCount;
    }

    public void setApplicationCount(int applicationCount) {
        this.applicationCount = applicationCount;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }
}
