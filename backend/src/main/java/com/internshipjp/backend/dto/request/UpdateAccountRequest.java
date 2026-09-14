package com.internshipjp.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;

/**
 * Editable fields shared by all three roles (PUT /api/account/me).
 */
public class UpdateAccountRequest {
    @NotBlank
    @Size(max = 150)
    private String fullName;

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
    private String phone;

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }
}
