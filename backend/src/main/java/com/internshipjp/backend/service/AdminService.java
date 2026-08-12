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

    public AdminService(CompanyRepository companyRepository,
                        EmployerProfileRepository employerProfileRepository,
                        UserRepository userRepository,
                        NotificationService notificationService,
                        CompanyMapper companyMapper,
                        UserMapper userMapper) {
        this.companyRepository = companyRepository;
        this.employerProfileRepository = employerProfileRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.companyMapper = companyMapper;
        this.userMapper = userMapper;
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
}
