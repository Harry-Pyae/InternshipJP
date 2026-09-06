package com.internshipjp.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * One question for the AI assistant.
 *
 * conversationId - optional. Leave it null to start a new thread.
 *
 * internshipId   - chooses which employer assistant answers:
 *                    set    -> candidate mode: compare the applicants of that
 *                              vacancy against what it asked for
 *                    null   -> company mode: review the company's own listings,
 *                              pipeline and requirements
 *                  Ignored by the student assistant.
 */
public class AiChatRequest {
    @NotBlank
    @Size(max = 2000)
    private String message;

    private Long conversationId;

    private Long internshipId;

    /**
     * Which language the answer should be written in - "en" or "my".
     *
     * Sent by the interface rather than guessed from the message, because a
     * student writing English words inside a Burmese sentence is normal and
     * detecting the language from the text would flip the answer around
     * unpredictably. The toggle is an explicit choice; this carries it.
     */
    private String language;

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

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }
}
