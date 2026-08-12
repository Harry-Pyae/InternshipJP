package com.internshipjp.backend.dto.response;


/**
 * One AI thread in the history list.
 */
public class AiConversationResponse {
    private Long id;

    private String conversationType;

    private String title;

    private Long contextReferenceId;

    private String createdAt;

    private String updatedAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getConversationType() {
        return conversationType;
    }

    public void setConversationType(String conversationType) {
        this.conversationType = conversationType;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public Long getContextReferenceId() {
        return contextReferenceId;
    }

    public void setContextReferenceId(Long contextReferenceId) {
        this.contextReferenceId = contextReferenceId;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public String getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(String updatedAt) {
        this.updatedAt = updatedAt;
    }
}
