package com.internshipjp.backend.security;

import com.internshipjp.backend.entity.Role;
import com.internshipjp.backend.entity.User;
import com.internshipjp.backend.exception.UnauthorizedException;
import com.internshipjp.backend.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * The one approved way to answer "who is calling?".
 *
 * IMPORTANT RULE FOR THE WHOLE TEAM
 * Never accept a user id, student id or company id from the request body or
 * the query string to decide whose data to load. Take the identity from here.
 * A browser can send any number it likes; the session cannot be faked.
 *
 * Wrong:  studentService.updateProfile(request.getStudentId(), request);
 * Right:  studentService.updateProfile(currentUserService.requireUserId(), request);
 */
@Service
public class CurrentUserService {

    private final UserRepository userRepository;

    public CurrentUserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /** Empty when the request is anonymous. */
    public Optional<AppUserDetails> currentDetails() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return Optional.empty();
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof AppUserDetails) {
            return Optional.of((AppUserDetails) principal);
        }
        // An anonymous request has the string "anonymousUser" as its principal.
        return Optional.empty();
    }

    public AppUserDetails requireDetails() {
        return currentDetails().orElseThrow(
                () -> new UnauthorizedException("You need to sign in to do that."));
    }

    public Long requireUserId() {
        return requireDetails().getId();
    }

    public Role requireRole() {
        return requireDetails().getRole();
    }

    /** Reloads the account from the database when fresh data is needed. */
    @Transactional(readOnly = true)
    public User requireUser() {
        Long id = requireUserId();
        return userRepository.findById(id).orElseThrow(
                () -> new UnauthorizedException("Your account no longer exists. Please sign in again."));
    }

    public boolean isAuthenticated() {
        return currentDetails().isPresent();
    }
}
