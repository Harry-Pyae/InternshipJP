package com.internshipjp.backend.service;

import com.internshipjp.backend.dto.request.CompanyApprovalRequest;
import com.internshipjp.backend.dto.request.UpdateUserStatusRequest;
import com.internshipjp.backend.dto.response.AdminUserResponse;
import com.internshipjp.backend.dto.response.CompanyResponse;
import com.internshipjp.backend.dto.response.PageResponse;
import com.internshipjp.backend.entity.AccountStatus;
import com.internshipjp.backend.entity.ApprovalStatus;
import com.internshipjp.backend.entity.Company;
import com.internshipjp.backend.entity.EmployerProfile;
import com.internshipjp.backend.entity.Role;
import com.internshipjp.backend.entity.User;
import com.internshipjp.backend.exception.BadRequestException;
import com.internshipjp.backend.exception.NotFoundException;
import com.internshipjp.backend.mapper.CompanyMapper;
import com.internshipjp.backend.mapper.UserMapper;
import com.internshipjp.backend.repository.CompanyRepository;
import com.internshipjp.backend.repository.EmployerProfileRepository;
import com.internshipjp.backend.repository.UserRepository;
import com.internshipjp.backend.security.LoginAttemptService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Administrator operations: approving companies and managing accounts.
 *
 * TODO MEMBER_4: yours to extend - platform reports, activity monitoring, an
 * audit log of admin actions, and the admin React screens.
 */
@Service
public class AdminService {

    private final CompanyRepository companyRepository;
    private final EmployerProfileRepository employerProfileRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final CompanyMapper companyMapper;
    private final UserMapper userMapper;
    private final AccountMailService accountMailService;
    private final LoginAttemptService loginAttemptService;

    public AdminService(CompanyRepository companyRepository,
                        EmployerProfileRepository employerProfileRepository,
                        UserRepository userRepository,
                        NotificationService notificationService,
                        CompanyMapper companyMapper,
                        UserMapper userMapper,
                        AccountMailService accountMailService,
                        LoginAttemptService loginAttemptService) {
        this.companyRepository = companyRepository;
        this.employerProfileRepository = employerProfileRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.companyMapper = companyMapper;
        this.userMapper = userMapper;
        this.accountMailService = accountMailService;
        this.loginAttemptService = loginAttemptService;
    }

    @Transactional(readOnly = true)
    public PageResponse<CompanyResponse> listPendingCompanies(Pageable pageable) {
        return PageResponse.from(
                companyRepository.findByApprovalStatus(ApprovalStatus.PENDING, pageable),
                companyMapper::toCompany);
    }

    /**
     * Approving a company also activates its recruiters, because an employer
     * account is created PENDING at registration and would otherwise stay in
     * limbo after the company itself was approved.
     */
    @Transactional
    public CompanyResponse decideCompany(Long adminUserId, Long companyId, CompanyApprovalRequest request) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> NotFoundException.of("Company", companyId));
        ApprovalStatus decision = ApprovalStatus.valueOf(request.getStatus());

        company.setApprovalStatus(decision);
        company.setApprovalNote(request.getNote());
        company.setApprovedBy(adminUserId);
        company.setApprovedAt(LocalDateTime.now());
        Company saved = companyRepository.save(company);

        List<EmployerProfile> recruiters = employerProfileRepository.findByCompanyId(companyId);
        for (EmployerProfile recruiter : recruiters) {
            User employer = recruiter.getUser();
            if (decision == ApprovalStatus.APPROVED && employer.getAccountStatus() == AccountStatus.PENDING) {
                employer.setAccountStatus(AccountStatus.ACTIVE);
                userRepository.save(employer);
            }
            notificationService.create(employer,
                    "COMPANY_" + decision.name(),
                    "Company review completed",
                    company.getName() + " is now " + decision.name().toLowerCase().replace('_', ' ') + ".");

                // Email as well as the in-app notification: a recruiter waiting on
                // approval is not sitting on the site refreshing, so the notification
                // alone would never reach them.
                //
                // AccountMailService never throws. If it did, a mail server being
                // down would roll back an approval already decided and saved.
                if (decision == ApprovalStatus.APPROVED) {
                    accountMailService.sendCompanyApproved(
                            employer.getEmail(), employer.getFullName(), company.getName());
                } else if (decision == ApprovalStatus.REJECTED) {
                    accountMailService.sendCompanyRejected(
                            employer.getEmail(), employer.getFullName(), company.getName(),
                            request.getNote());
                }
        }

        return companyMapper.toCompany(saved);
    }

    /**
     * Account list with optional role, status and free-text filters.
     * The search term is passed as a bound parameter, never concatenated.
     */
    @Transactional(readOnly = true)
    public PageResponse<AdminUserResponse> listUsers(String role, String status, String search,
                                                      Pageable pageable) {
        Page<User> page;
        if (StringUtils.hasText(search)) {
            page = userRepository.findByEmailContainingIgnoreCaseOrFullNameContainingIgnoreCase(
                    search.trim(), search.trim(), pageable);
        } else if (StringUtils.hasText(role)) {
            page = userRepository.findByRole(Role.valueOf(role), pageable);
        } else if (StringUtils.hasText(status)) {
            page = userRepository.findByAccountStatus(AccountStatus.valueOf(status), pageable);
        } else {
            page = userRepository.findAll(pageable);
        }
        return PageResponse.from(page, userMapper::toAdminUser);
    }

    @Transactional
    public AdminUserResponse updateUserStatus(Long adminUserId, Long targetUserId,
                                              UpdateUserStatusRequest request) {
        if (adminUserId.equals(targetUserId)) {
            throw new BadRequestException("You cannot change the status of your own account.");
        }
        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> NotFoundException.of("User", targetUserId));

        AccountStatus status = AccountStatus.valueOf(request.getStatus());
        user.setAccountStatus(status);
        User saved = userRepository.save(user);

        notificationService.create(saved, "ACCOUNT_STATUS_CHANGED",
                "Your account status changed",
                "An administrator set your account to " + status.name().toLowerCase() + ".");

        return userMapper.toAdminUser(saved);
    }

    /**
     * Deletes an account and everything personal attached to it.
     *
     * Every foreign key to users is CASCADE or SET NULL, so profiles,
     * applications, certificates and notifications go with it, while records
     * that merely reference the person - who approved a company, who verified
     * a certificate - keep their row and lose the pointer. Deleting an
     * administrator should not erase the audit trail of what they approved.
     *
     * Two guards, both about not locking everyone out:
     *   - you cannot delete your own account
     *   - you cannot delete the last administrator who can still sign in
     */
    public void deleteUser(Long adminUserId, Long targetUserId) {
        if (adminUserId.equals(targetUserId)) {
            throw new BadRequestException("You cannot delete your own account.");
        }
        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> NotFoundException.of("User", targetUserId));

        if (user.getRole() == Role.ADMIN
                && userRepository.countByRoleAndAccountStatus(Role.ADMIN, AccountStatus.ACTIVE) <= 1) {
            throw new BadRequestException(
                    "This is the last active administrator. Create another one first.");
        }

        userRepository.delete(user);
    }

    /** Releases a temporary sign-in lock at the person's request. */
    public void unlockSignIn(Long targetUserId) {
        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> NotFoundException.of("User", targetUserId));
        loginAttemptService.unlock(user.getEmail());
    }
}
