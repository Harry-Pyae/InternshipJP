package com.internshipjp.backend.security;

import com.internshipjp.backend.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Loads an account for Spring Security during sign-in.
 *
 * The same message is used whether the email is unknown or the password is
 * wrong, so the endpoint cannot be used to discover which emails are registered.
 */
@Service
public class AppUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public AppUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return userRepository.findByEmail(email.trim().toLowerCase())
                .map(AppUserDetails::new)
                .orElseThrow(() -> new UsernameNotFoundException("Invalid email or password"));
    }
}
