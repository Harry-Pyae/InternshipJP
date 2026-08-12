package com.internshipjp.backend.dto.response;


/**
 * Answer from the AI assistant.
 *
 * A response with degraded=true means the provider was unavailable and the
 * message explains what to do. The UI must still render it.
 */
public class AiChatResponse {
    private Long conversationId;

    private String answer;

    private String model;

    private boolean degraded;

    private String createdAt;

    public Long getConversationId() {
        return conversationId;
    }

    public void setConversationId(Long conversationId) {
        this.conversationId = conversationId;
    }

    public String getAnswer() {
        return answer;
    }

    public void setAnswer(String answer) {
        this.answer = answer;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public boolean isDegraded() {
        return degraded;
    }

    public void setDegraded(boolean degraded) {
        this.degraded = degraded;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }
}
