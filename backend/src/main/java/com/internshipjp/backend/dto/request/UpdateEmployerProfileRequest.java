package com.internshipjp.backend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;

/**
 * Employer edit of their own recruiter details.
 */
public class UpdateEmployerProfileRequest {
    @Size(max = 120)
    private String jobTitle;

    @Size(max = 120)
    private String department;

    @Email
    @Size(max = 190)
    private String workEmail;

    @Size(max = 30)
    /**
     * A Myanmar number, written the way it is dialled from abroad.
     *
     * +95 then the national number with its leading zero dropped, which is
     * how Myanmar mobile numbers are written internationally: 09 7xx xxx xxx
     * becomes +959 7xx xxx xxx. Seven to ten digits, because operators here
     * issue numbers of different lengths and refusing a real one is worse
     * than accepting a short one.
     *
     * Optional: an empty field is allowed, an ill-formed one is not.
     */
    @Pattern(regexp = "^$|^\\+95[0-9]{7,10}$",
             message = "Use a Myanmar number in the form +959XXXXXXXX.")
    private String contactPhone;

    public String getJobTitle() {
        return jobTitle;
    }

    public void setJobTitle(String jobTitle) {
        this.jobTitle = jobTitle;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public String getWorkEmail() {
        return workEmail;
    }

    public void setWorkEmail(String workEmail) {
        this.workEmail = workEmail;
    }

    public String getContactPhone() {
        return contactPhone;
    }

    public void setContactPhone(String contactPhone) {
        this.contactPhone = contactPhone;
    }
}
