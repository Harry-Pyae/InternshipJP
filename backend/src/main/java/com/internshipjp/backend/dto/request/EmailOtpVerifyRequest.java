package com.internshipjp.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * The 6-digit code delivered by email.
 */
public class EmailOtpVerifyRequest {
    @NotBlank
    @Size(min = 6, max = 6)
    private String code;

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }
}
