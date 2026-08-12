package com.internshipjp.backend.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * Two-factor preferences for one user.
 * The TOTP secret is stored encrypted (see util/SecretEncryptor) and is never logged.
 * Owner: Member 2.
 */
@Entity
@Table(name = "user_two_factor_settings")
public class UserTwoFactorSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "totp_enabled", nullable = false)
    private boolean totpEnabled;

    @Column(name = "email_otp_enabled", nullable = false)
    private boolean emailOtpEnabled;

    @Column(name = "encrypted_totp_secret", length = 512)
    private String encryptedTotpSecret;

    @Enumerated(EnumType.STRING)
    @Column(name = "preferred_method", length = 20)
    private TwoFactorMethod preferredMethod;

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

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public boolean isTotpEnabled() {
        return totpEnabled;
    }

    public void setTotpEnabled(boolean totpEnabled) {
        this.totpEnabled = totpEnabled;
    }

    public boolean isEmailOtpEnabled() {
        return emailOtpEnabled;
    }

    public void setEmailOtpEnabled(boolean emailOtpEnabled) {
        this.emailOtpEnabled = emailOtpEnabled;
    }

    public String getEncryptedTotpSecret() {
        return encryptedTotpSecret;
    }

    public void setEncryptedTotpSecret(String encryptedTotpSecret) {
        this.encryptedTotpSecret = encryptedTotpSecret;
    }

    public TwoFactorMethod getPreferredMethod() {
        return preferredMethod;
    }

    public void setPreferredMethod(TwoFactorMethod preferredMethod) {
        this.preferredMethod = preferredMethod;
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
