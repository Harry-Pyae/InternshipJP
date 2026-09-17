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

    /**
     * An international number, written the way it is dialled from abroad.
     *
     * NOT FIXED TO +95, AND THE REASON MATTERS
     *   Registration asks for a country. Enforcing a Myanmar dialling code
     *   while offering that choice contradicts it: somebody who selects
     *   Thailand and types a Thai number would be told their own number is
     *   wrong. The pattern follows the form rather than the other way round.
     *
     * A plus, then a country code that does not start with zero, then seven
     * to fourteen digits - the E.164 shape. A Myanmar number written
     * +959 7xx xxx xxx satisfies it, which is the common case here.
     *
     * Optional: an empty field is allowed, an ill-formed one is not.
     */
    // E.164 allows fifteen digits after the plus, so sixteen characters is
    // the real ceiling. A Myanmar number is thirteen of them; capping at
    // thirteen would refuse a longer number that is perfectly valid.
    @Size(max = 16, message = "A phone number is at most 16 characters.")
    @Pattern(regexp = "^$|^\\+[1-9][0-9]{6,14}$",
             message = "Use the international form, starting with + and the country code.")
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
