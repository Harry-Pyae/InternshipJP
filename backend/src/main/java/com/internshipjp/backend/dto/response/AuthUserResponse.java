package com.internshipjp.backend.dto.response;


/**
 * The authenticated user, as returned by GET /api/auth/me.
 * Never contains the password hash or any 2FA secret.
 */
public class AuthUserResponse {
    private Long id;

    private String email;

    private String fullName;

    private String role;

    private String accountStatus;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getAccountStatus() {
        return accountStatus;
    }

    public void setAccountStatus(String accountStatus) {
        this.accountStatus = accountStatus;
    }
}
