package com.internshipjp.backend.config;

import com.internshipjp.backend.entity.AccountStatus;
import com.internshipjp.backend.entity.Role;
import com.internshipjp.backend.entity.User;
import com.internshipjp.backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.Locale;

/**
 * Creates the very first administrator account.
 *
 * WHY THIS EXISTS
 *   There is no public "register as admin" endpoint - that would be an open
 *   door. And the project deliberately ships no demo-data migration, so the
 *   database starts genuinely empty.
 *
 * HOW TO USE IT (once, on a fresh database)
 *   1. In backend/application-local.properties set:
 *        BOOTSTRAP_ADMIN_ENABLED=true
 *        BOOTSTRAP_ADMIN_EMAIL=you@example.com
 *        BOOTSTRAP_ADMIN_PASSWORD=<a password you choose>
 *   2. Start the backend once.
 *   3. Set BOOTSTRAP_ADMIN_ENABLED=false again.
 *
 * The runner never overwrites an existing account, and the password is only
 * ever read from local configuration - nothing is committed to Git.
 */
@Component
public class AdminBootstrapRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminBootstrapRunner.class);

    private final AppProperties appProperties;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminBootstrapRunner(AppProperties appProperties,
                                UserRepository userRepository,
                                PasswordEncoder passwordEncoder) {
        this.appProperties = appProperties;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        AppProperties.BootstrapAdmin config = appProperties.getBootstrapAdmin();
        if (!config.isEnabled()) {
            return;
        }
        if (!StringUtils.hasText(config.getEmail()) || !StringUtils.hasText(config.getPassword())) {
            log.warn("Admin bootstrap is enabled but BOOTSTRAP_ADMIN_EMAIL or "
                    + "BOOTSTRAP_ADMIN_PASSWORD is empty. No account was created.");
            return;
        }

        String email = config.getEmail().trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmail(email)) {
            log.info("Admin bootstrap: {} already exists, nothing to do.", email);
            return;
        }

        User admin = new User();
        admin.setEmail(email);
        admin.setPasswordHash(passwordEncoder.encode(config.getPassword()));
        admin.setFullName(config.getFullName());
        admin.setRole(Role.ADMIN);
        admin.setAccountStatus(AccountStatus.ACTIVE);
        userRepository.save(admin);

        log.info("Admin bootstrap: created administrator {}. "
                + "Set BOOTSTRAP_ADMIN_ENABLED=false now.", email);
    }
}
