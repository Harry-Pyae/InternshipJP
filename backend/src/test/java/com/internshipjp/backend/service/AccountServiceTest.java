package com.internshipjp.backend.service;

import com.internshipjp.backend.dto.request.ChangePasswordRequest;
import com.internshipjp.backend.entity.AccountStatus;
import com.internshipjp.backend.entity.Role;
import com.internshipjp.backend.entity.User;
import com.internshipjp.backend.exception.BadRequestException;
import com.internshipjp.backend.mapper.UserMapper;
import com.internshipjp.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Example of testing a service rule without starting Spring or touching the
 * database: the repository is a stub, the password encoder is the real one.
 *
 * The rule under test matters - "you must know the current password to set a
 * new one" is what protects a user whose laptop was left unlocked.
 */
class AccountServiceTest {

    private static final Long USER_ID = 1L;

    private UserRepository userRepository;
    private PasswordEncoder passwordEncoder;
    private AccountService accountService;
    private User user;

    @BeforeEach
    void setUp() {
        userRepository = Mockito.mock(UserRepository.class);
        passwordEncoder = new BCryptPasswordEncoder();
        accountService = new AccountService(userRepository, passwordEncoder, new UserMapper());

        user = new User();
        user.setId(USER_ID);
        user.setEmail("student@example.com");
        user.setFullName("Test Student");
        user.setRole(Role.STUDENT);
        user.setAccountStatus(AccountStatus.ACTIVE);
        user.setPasswordHash(passwordEncoder.encode("current-password"));

        Mockito.when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
        Mockito.when(userRepository.save(Mockito.any(User.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void changesThePasswordWhenTheCurrentOneIsCorrect() {
        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword("current-password");
        request.setNewPassword("a-brand-new-password");

        accountService.changePassword(USER_ID, request);

        assertTrue(passwordEncoder.matches("a-brand-new-password", user.getPasswordHash()));
        // The stored value must be a hash, never the password itself.
        assertFalse(user.getPasswordHash().contains("a-brand-new-password"));
    }

    @Test
    void refusesWhenTheCurrentPasswordIsWrong() {
        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword("not-my-password");
        request.setNewPassword("a-brand-new-password");

        assertThrows(BadRequestException.class, () -> accountService.changePassword(USER_ID, request));
        assertTrue(passwordEncoder.matches("current-password", user.getPasswordHash()),
                "a failed attempt must leave the old password in place");
    }

    @Test
    void refusesReusingTheSamePassword() {
        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setCurrentPassword("current-password");
        request.setNewPassword("current-password");

        assertThrows(BadRequestException.class, () -> accountService.changePassword(USER_ID, request));
    }
}
