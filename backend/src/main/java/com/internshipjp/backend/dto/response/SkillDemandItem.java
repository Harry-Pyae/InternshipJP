package com.internshipjp.backend.dto.response;

/**
 * One skill, with how much the market wants it.
 *
 * Used by both assistants:
 *   students see it as "learn this next"
 *   employers see it as "few candidates have this"
 */
public class SkillDemandItem {

    private String skill;

    /** How many OPEN internships require it. */
    private int openInternshipsRequiring;

    /** That count as a share of all open internships that list requirements. */
    private int demandSharePercent;

    /** How many students on the platform list it. */
    private int studentsWithSkill;

    public SkillDemandItem() {
    }

    public SkillDemandItem(String skill, int openInternshipsRequiring,
                           int demandSharePercent, int studentsWithSkill) {
        this.skill = skill;
        this.openInternshipsRequiring = openInternshipsRequiring;
        this.demandSharePercent = demandSharePercent;
        this.studentsWithSkill = studentsWithSkill;
    }

    public String getSkill() {
        return skill;
    }

    public void setSkill(String skill) {
        this.skill = skill;
    }

    public int getOpenInternshipsRequiring() {
        return openInternshipsRequiring;
    }

    public void setOpenInternshipsRequiring(int openInternshipsRequiring) {
        this.openInternshipsRequiring = openInternshipsRequiring;
    }

    public int getDemandSharePercent() {
        return demandSharePercent;
    }

    public void setDemandSharePercent(int demandSharePercent) {
        this.demandSharePercent = demandSharePercent;
    }

    public int getStudentsWithSkill() {
        return studentsWithSkill;
    }

    public void setStudentsWithSkill(int studentsWithSkill) {
        this.studentsWithSkill = studentsWithSkill;
    }
}
