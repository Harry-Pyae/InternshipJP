package com.internshipjp.backend.service;

import com.internshipjp.backend.dto.request.UpdateCompanyRequest;
import com.internshipjp.backend.dto.request.UpdateEmployerProfileRequest;
import com.internshipjp.backend.dto.response.CompanyResponse;
import com.internshipjp.backend.dto.response.EmployerProfileResponse;
import com.internshipjp.backend.entity.ApprovalStatus;
import com.internshipjp.backend.entity.Company;
import com.internshipjp.backend.entity.EmployerProfile;
import com.internshipjp.backend.exception.ForbiddenException;
import com.internshipjp.backend.exception.NotFoundException;
import com.internshipjp.backend.mapper.CompanyMapper;
import com.internshipjp.backend.repository.CompanyRepository;
import com.internshipjp.backend.repository.EmployerProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Employer profile and company details.
 *
 * requireProfile() and requireApprovedCompany() are the two guards the rest
 * of the employer module builds on - they turn "the signed-in user" into
 * "the company this request is allowed to touch".
 *
 * TODO MEMBER_3: add company logo upload (FileStorageService already supports
 * it), multiple recruiters per company, and employer dashboard statistics.
 */
@Service
public class EmployerService {

    private final EmployerProfileRepository employerProfileRepository;
    private final CompanyRepository companyRepository;
    private final CompanyMapper companyMapper;

    public EmployerService(EmployerProfileRepository employerProfileRepository,
                           CompanyRepository companyRepository,
                           CompanyMapper companyMapper) {
        this.employerProfileRepository = employerProfileRepository;
        this.companyRepository = companyRepository;
        this.companyMapper = companyMapper;
    }

    @Transactional(readOnly = true)
    public EmployerProfile requireProfile(Long userId) {
        return employerProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new NotFoundException(
                        "No employer profile is attached to this account."));
    }

    /**
     * Used before anything that makes a vacancy visible to students.
     * An unapproved company may edit drafts, but may not publish.
     */
    @Transactional(readOnly = true)
    public Company requireApprovedCompany(Long userId) {
        Company company = requireProfile(userId).getCompany();
        if (company.getApprovalStatus() != ApprovalStatus.APPROVED) {
            throw new ForbiddenException(
                    "Your company is still waiting for administrator approval, "
                            + "so it cannot publish internships yet.");
        }
        return company;
    }

    @Transactional(readOnly = true)
    public EmployerProfileResponse getOwnProfile(Long userId) {
        return companyMapper.toEmployerProfile(requireProfile(userId));
    }

    @Transactional
    public EmployerProfileResponse updateOwnProfile(Long userId, UpdateEmployerProfileRequest request) {
        EmployerProfile profile = requireProfile(userId);
        profile.setJobTitle(request.getJobTitle());
        profile.setWorkEmail(request.getWorkEmail());
        profile.setContactPhone(request.getContactPhone());
        return companyMapper.toEmployerProfile(employerProfileRepository.save(profile));
    }

    @Transactional(readOnly = true)
    public CompanyResponse getOwnCompany(Long userId) {
        return companyMapper.toCompany(requireProfile(userId).getCompany());
    }

    /**
     * Editing company details does not reset the approval decision in this
     * baseline version.
     *
     * TODO MEMBER_4: decide whether changing the company name or website
     * should send the company back to PENDING for re-review.
     */
    @Transactional
    public CompanyResponse updateOwnCompany(Long userId, UpdateCompanyRequest request) {
        Company company = requireProfile(userId).getCompany();
        company.setName(request.getName().trim());
        company.setIndustry(request.getIndustry());
        company.setWebsite(request.getWebsite());
        company.setLocation(request.getLocation());
        company.setDescription(request.getDescription());
        return companyMapper.toCompany(companyRepository.save(company));
    }
}
