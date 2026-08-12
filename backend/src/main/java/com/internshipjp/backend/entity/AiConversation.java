package com.internshipjp.backend.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * An AI chat thread owned by exactly one user. A user can only ever read
 * their own conversations.
 * Owner: Member 1.
 */
@Entity
@Table(name = "ai_conversations")
public class AiConversation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_user_id", nullable = false)
    private User owner;

    @Enumerated(EnumType.STRING)
    @Column(name = "conversation_type", nullable = false, length = 30)
    private AiConversationType conversationType;

    @Column(name = "title", length = 200)
    private String title;

    // Optional focus, e.g. the internship an employer is comparing candidates for.
    @Column(name = "context_reference_id")
    private Long contextReferenceId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (this.createdAt == null) {
            this.createdAt = now;
        }
        this.updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getOwner() {
        return owner;
    }

    public void setOwner(User owner) {
        this.owner = owner;
    }

    public AiConversationType getConversationType() {
        return conversationType;
    }

    public void setConversationType(AiConversationType conversationType) {
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

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

}
