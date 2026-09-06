package com.internshipjp.backend.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Create or update one education record.
 *
 * Owner: Member 2.
 */
public class StudentEducationRequest {

    @NotBlank
    @Size(max = 150)
    private String institution;

    @Size(max = 150)
    private String degree;

    @Size(max = 150)
    private String fieldOfStudy;

    @Min(1950)
    @Max(2100)
    private Integer startYear;

    @Min(1950)
    @Max(2100)
    private Integer endYear;

    @Size(max = 50)
    private String grade;

    public String getInstitution() {
        return institution;
    }

    public void setInstitution(String institution) {
        this.institution = institution;
    }

    public String getDegree() {
        return degree;
    }

    public void setDegree(String degree) {
        this.degree = degree;
    }

    public String getFieldOfStudy() {
        return fieldOfStudy;
    }

    public void setFieldOfStudy(String fieldOfStudy) {
        this.fieldOfStudy = fieldOfStudy;
    }

    public Integer getStartYear() {
        return startYear;
    }

    public void setStartYear(Integer startYear) {
        this.startYear = startYear;
    }

    public Integer getEndYear() {
        return endYear;
    }

    public void setEndYear(Integer endYear) {
        this.endYear = endYear;
    }

    public String getGrade() {
        return grade;
    }

    public void setGrade(String grade) {
        this.grade = grade;
    }
}