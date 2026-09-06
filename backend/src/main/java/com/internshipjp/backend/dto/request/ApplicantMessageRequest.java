package com.internshipjp.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * An employer asking an applicant for something.
 *
 * This is deliberately one-way and short. It is not messaging - there is no
 * thread, no reply, and the student cannot answer through the platform. It
 * exists so a recruiter can say "please upload your transcript" without the
 * student having to guess why their application has gone quiet.
 *
 * Sent as a notification, which the student already sees in their Notifications
 * page, so nothing new had to be built to deliver it.
 */
public class ApplicantMessageRequest {

    @NotBlank(message = "Write a message before sending it.")
    @Size(max = 500, message = "Keep the message under 500 characters.")
    private String message;

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
