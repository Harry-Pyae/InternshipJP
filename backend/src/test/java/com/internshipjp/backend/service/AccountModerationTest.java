package com.internshipjp.backend.service;

import com.internshipjp.backend.dto.request.UpdateUserStatusRequest;
import com.internshipjp.backend.entity.AccountStatus;
import com.internshipjp.backend.entity.Role;
import com.internshipjp.backend.entity.User;
import com.internshipjp.backend.exception.BadRequestException;
import com.internshipjp.backend.mapper.CompanyMapper;
import com.internshipjp.backend.mapper.UserMapper;
import com.internshipjp.backend.repository.CompanyRepository;
import com.internshipjp.backend.repository.EmployerProfileRepository;
import com.internshipjp.backend.repository.UserRepository;
import com.internshipjp.backend.security.LoginAttemptService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import com.internshipjp.backend.repository.StudentProfileRepository;

/**
 * Moderation rules: a suspension must say why, and a deletion cannot happen
 * without one first.
 *
 * Both exist for the same reason. A decision about somebody's account should
 * reach them with its reason attached, and an irreversible decision should not
 * be one click away from a working account.
 */
class AccountModerationTest {

    private UserRepository userRepository;
    private NotificationService notificationService;
    private AdminService adminService;

    private User admin;
    private User student;

    @BeforeEach
    void setUp() {
        userRepository = Mockito.mock(UserRepository.class);
        notificationService = Mockito.mock(NotificationService.class);

        adminService = new AdminService(
                Mockito.mock(CompanyRepository.class),
                Mockito.mock(EmployerProfileRepository.class),
                userRepository,
                notificationService,
                Mockito.mock(CompanyMapper.class),
                Mockito.mock(UserMapper.class),
                Mockito.mock(AccountMailService.class),
                Mockito.mock(LoginAttemptService.class),
                Mockito.mock(StudentProfileRepository.class));

        admin = new User();
        admin.setId(1L);
        admin.setRole(Role.ADMIN);
        admin.setAccountStatus(AccountStatus.ACTIVE);

        student = new User();
        student.setId(2L);
        student.setEmail("student@example.com");
        student.setRole(Role.STUDENT);
        student.setAccountStatus(AccountStatus.ACTIVE);

        Mockito.when(userRepository.findById(2L)).thenReturn(Optional.of(student));
        Mockito.when(userRepository.save(Mockito.any(User.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
    }

    private UpdateUserStatusRequest request(String status, String reason) {
        UpdateUserStatusRequest r = new UpdateUserStatusRequest();
        r.setStatus(status);
        r.setReason(reason);
        return r;
    }

    @Test
    void suspendingWithoutAReasonIsRefused() {
        BadRequestException thrown = assertThrows(BadRequestException.class,
                () -> adminService.updateUserStatus(1L, 2L, request("SUSPENDED", null)));

        assertTrue(thrown.getMessage().toLowerCase().contains("reason"));
        Mockito.verify(userRepository, Mockito.never()).save(Mockito.any());
    }

    @Test
    void suspendingWithABlankReasonIsRefused() {
        assertThrows(BadRequestException.class,
                () -> adminService.updateUserStatus(1L, 2L, request("SUSPENDED", "   ")));
    }

    /** The reason is not merely stored: the user is sent it. */
    @Test
    void theReasonReachesTheUser() {
        adminService.updateUserStatus(1L, 2L, request("SUSPENDED", "Duplicate account"));

        ArgumentCaptor<String> message = ArgumentCaptor.forClass(String.class);
        Mockito.verify(notificationService).create(
                Mockito.eq(student),
                Mockito.eq("ACCOUNT_STATUS_CHANGED"),
                Mockito.anyString(),
                message.capture());

        assertTrue(message.getValue().contains("Duplicate account"),
                "the suspension reason should appear in the notification");
    }

    /** Reactivation needs no explanation. */
    @Test
    void reactivatingNeedsNoReason() {
        student.setAccountStatus(AccountStatus.SUSPENDED);
        adminService.updateUserStatus(1L, 2L, request("ACTIVE", null));
        assertEquals(AccountStatus.ACTIVE, student.getAccountStatus());
    }

    @Test
    void anActiveAccountCannotBeDeletedInOneStep() {
        BadRequestException thrown = assertThrows(BadRequestException.class,
                () -> adminService.deleteUser(1L, 2L));

        assertTrue(thrown.getMessage().toLowerCase().contains("suspend"));
        Mockito.verify(userRepository, Mockito.never()).delete(Mockito.any());
    }

    @Test
    void aSuspendedAccountCanBeDeleted() {
        student.setAccountStatus(AccountStatus.SUSPENDED);
        adminService.deleteUser(1L, 2L);
        Mockito.verify(userRepository).delete(student);
    }

    @Test
    void anAdministratorStillCannotDeleteThemselves() {
        assertThrows(BadRequestException.class, () -> adminService.deleteUser(1L, 1L));
    }
}
