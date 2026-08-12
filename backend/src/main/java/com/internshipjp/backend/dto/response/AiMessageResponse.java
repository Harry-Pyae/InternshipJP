package com.internshipjp.backend.dto.response;


/**
 * One message inside an AI thread.
 */
public class AiMessageResponse {
    private Long id;

    private String messageRole;

    private String content;

    private String createdAt;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getMessageRole() {
        return messageRole;
    }

    public void setMessageRole(String messageRole) {
        this.messageRole = messageRole;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }
}
