package com.internshipjp.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * An administrator's notice to one person.
 *
 * One way: it becomes a notification and nothing else. There is no thread and
 * no reply, because a notice about somebody's account is an instruction rather
 * than the start of a conversation.
 */
public class AdminMessageRequest {

    /** The notification title. notifications.title is VARCHAR(200). */
    @NotBlank(message = "Give the notice a subject.")
    @Size(max = 200, message = "Keep the subject under 200 characters.")
    private String subject;

    /** Matches the 500-character limit on the dialog that writes it. */
    @NotBlank(message = "Write the notice before sending it.")
    @Size(max = 500, message = "Keep the notice under 500 characters.")
    private String body;

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getBody() {
        return body;
    }

    public void setBody(String body) {
        this.body = body;
    }
}
