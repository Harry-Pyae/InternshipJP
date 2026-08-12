package com.internshipjp.backend.security;

import com.internshipjp.backend.entity.AccountStatus;
import com.internshipjp.backend.entity.Role;
import com.internshipjp.backend.entity.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

/**
 * What Spring Security keeps in the session for a signed-in user.
 *
 * It holds the user id and role so controllers never have to trust an id sent
 * by the browser. It never holds anything secret beyond the hash Spring needs
 * for authentication.
 */
public class AppUserDetails implements UserDetails {

    private final Long id;
    private final String email;
    private final String passwordHash;
    private final Role role;
    private final AccountStatus accountStatus;

    public AppUserDetails(User user) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.passwordHash = user.getPasswordHash();
        this.role = user.getRole();
        this.accountStatus = user.getAccountStatus();
    }

    public Long getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public Role getRole() {
        return role;
    }

    public AccountStatus getAccountStatus() {
        return accountStatus;
    }

    /**
     * Spring's hasRole("ADMIN") looks for the authority "ROLE_ADMIN",
     * so the prefix is added here.
     */
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public String getPassword() {
        return passwordHash;
    }

    /** Spring calls the login identifier "username"; ours is the email address. */
    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return accountStatus != AccountStatus.SUSPENDED;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    /**
     * A PENDING employer may sign in - they need to see "waiting for approval".
     * Only SUSPENDED accounts are refused.
     */
    @Override
    public boolean isEnabled() {
        return accountStatus != AccountStatus.SUSPENDED;
    }
}
