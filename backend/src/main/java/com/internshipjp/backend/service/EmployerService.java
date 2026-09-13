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
import com.internshipjp.backend.storage.FileStorageService;
import com.internshipjp.backend.storage.StoredFile;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import java.time.Duration;

/**
 * Employer profile and company details.
 *
 * requireProfile() and requireApprovedCompany() are the two guards the rest
 * of the employer module builds on - they turn "the signed-in user" into
 * "the company this request is allowed to touch".
 *
 * Future work: add company logo upload (FileStorageService already supports
 * it), multiple recruiters per company, and employer dashboard statistics.
 */
@Service
public class EmployerService {

private final EmployerProfileRepository employerProfileRepository;
private final CompanyRepository companyRepository;
private final InternshipRepository internshipRepository;
private final ApplicationRepository applicationRepository;
private final CompanyMapper companyMapper;
private final FileStorageService fileStorageService;
    public EmployerService(EmployerProfileRepository employerProfileRepository,
                       CompanyRepository companyRepository,
                       InternshipRepository internshipRepository,
                       ApplicationRepository applicationRepository,
                       CompanyMapper companyMapper,
                           FileStorageService fileStorageService) {
        this.fileStorageService = fileStorageService;
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
     * Future work: decide whether changing the company name or website
     * should send the company back to PENDING for re-review.
     */
    /**
     * The company logo, or 404.
     *
     * A 404 rather than a placeholder image: the interface decides what to
     * draw when there is none, and it already has a building icon for that.
     */
    @Transactional(readOnly = true)
    public ResponseEntity<Resource> ownCompanyLogo(Long userId) {
        Company company = requireProfile(userId).getCompany();
        if (company == null || company.getLogoPath() == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .contentType(MediaType.IMAGE_JPEG)
                .body(fileStorageService.loadAsResource(company.getLogoPath()));
    }

    /** Removes the company logo and the file behind it. */
    @Transactional
    public CompanyResponse removeCompanyLogo(Long userId) {
        Company company = requireProfile(userId).getCompany();
        String previous = company.getLogoPath();
        if (previous == null) {
            return companyMapper.toCompany(company);
        }
        company.setLogoPath(null);
        Company saved = companyRepository.save(company);
        fileStorageService.delete(previous);
        return companyMapper.toCompany(saved);
    }

    /**
     * Replaces the company logo.
     *
     * Only an employer of that company may change it. Stored exactly like a
     * profile photo and a certificate: under the upload root, outside the
     * served directory, with the storage service checking the first bytes
     * rather than the extension.
     */
    @Transactional
    public CompanyResponse replaceCompanyLogo(Long userId, MultipartFile file) {
        Company company = requireProfile(userId).getCompany();
        String previous = company.getLogoPath();

        StoredFile stored = fileStorageService.store(file, "logos", company.getId());
        company.setLogoPath(stored.getStoragePath());
        Company saved = companyRepository.save(company);

        // After the save, not before: if it fails, the company still has the
        // logo it had.
        if (previous != null && !previous.equals(stored.getStoragePath())) {
            fileStorageService.delete(previous);
        }
        return companyMapper.toCompany(saved);
    }

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
