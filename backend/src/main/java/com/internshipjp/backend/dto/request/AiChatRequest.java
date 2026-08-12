package com.internshipjp.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * One question for the AI assistant.
 *
 * conversationId is optional: leave it null to start a new thread.
 * internshipId is used by the employer assistant to say which vacancy the
 * candidates are being compared for.
 */
public class AiChatRequest {
    @NotBlank
    @Size(max = 2000)
    private String message;

    private Long conversationId;

    private Long internshipId;

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public Long getConversationId() {
        return conversationId;
    }

    public void setConversationId(Long conversationId) {
        this.conversationId = conversationId;
    }

    public Long getInternshipId() {
        return internshipId;
    }

    public void setInternshipId(Long internshipId) {
        this.internshipId = internshipId;
    }
}
