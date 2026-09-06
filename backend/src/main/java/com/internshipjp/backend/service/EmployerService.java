package com.internshipjp.backend.service;

import com.internshipjp.backend.dto.request.UpdateCompanyRequest;
import com.internshipjp.backend.dto.request.UpdateEmployerProfileRequest;
import com.internshipjp.backend.dto.response.EmployerDashboardResponse;
import com.internshipjp.backend.entity.ApplicationStatus;
import com.internshipjp.backend.entity.InternshipStatus;
import com.internshipjp.backend.repository.ApplicationRepository;
import com.internshipjp.backend.repository.InternshipRepository;
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
private final InternshipRepository internshipRepository;
private final ApplicationRepository applicationRepository;
private final CompanyMapper companyMapper;
    public EmployerService(EmployerProfileRepository employerProfileRepository,
                       CompanyRepository companyRepository,
                       InternshipRepository internshipRepository,
                       ApplicationRepository applicationRepository,
                       CompanyMapper companyMapper) {
        this.employerProfileRepository = employerProfileRepository;
        this.companyRepository = companyRepository;
	this.internshipRepository = internshipRepository;
	this.applicationRepository = applicationRepository;
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
        profile.setDepartment(request.getDepartment());
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
        company.setCompanySize(request.getCompanySize());
        company.setFoundedYear(request.getFoundedYear());
        company.setRegistrationNumber(request.getRegistrationNumber());
        company.setWebsite(request.getWebsite());
        company.setContactEmail(request.getContactEmail());
        company.setContactPhone(request.getContactPhone());
        company.setLinkedinUrl(request.getLinkedinUrl());
        company.setLocation(request.getLocation());
        company.setAddress(request.getAddress());
        company.setCountry(request.getCountry());
        company.setDescription(request.getDescription());
        return companyMapper.toCompany(companyRepository.save(company));
    }
@Transactional(readOnly = true)
public EmployerDashboardResponse getDashboard(Long userId) {
    Company company = requireProfile(userId).getCompany();
    Long companyId = company.getId();

    long openVacancies =
            internshipRepository.countByCompanyIdAndStatus(
                    companyId, InternshipStatus.OPEN);

    long totalApplicants =
            applicationRepository.countByInternship_Company_Id(companyId);

    long acceptedApplicants =
            applicationRepository.countByInternship_Company_IdAndStatus(
                    companyId, ApplicationStatus.ACCEPTED);

    double conversionRate = totalApplicants == 0
            ? 0.0
            : ((double) acceptedApplicants / totalApplicants) * 100.0;

    EmployerDashboardResponse response = new EmployerDashboardResponse();
    response.setOpenVacancies(openVacancies);
    response.setTotalApplicants(totalApplicants);
    response.setAcceptedApplicants(acceptedApplicants);
    response.setConversionRate(conversionRate);

    return response;
}
}
