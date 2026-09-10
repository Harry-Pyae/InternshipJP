package com.internshipjp.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Something a user wants to tell the people running the platform. */
public class FeedbackRequest {

    @NotBlank(message = "Write your feedback before sending it.")
    @Size(max = 2000, message = "Please keep feedback under 2000 characters.")
    private String message;

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
