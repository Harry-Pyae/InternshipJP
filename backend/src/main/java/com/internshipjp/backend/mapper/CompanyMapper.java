package com.internshipjp.backend.mapper;

import com.internshipjp.backend.dto.response.CompanyResponse;
import com.internshipjp.backend.dto.response.EmployerProfileResponse;
import com.internshipjp.backend.entity.Company;
import com.internshipjp.backend.entity.EmployerProfile;
import com.internshipjp.backend.util.Dates;
import org.springframework.stereotype.Component;

/** Entity -> DTO conversion for companies and recruiters. */
@Component
public class CompanyMapper {

    public CompanyResponse toCompany(Company company) {
        CompanyResponse dto = new CompanyResponse();
        dto.setId(company.getId());
        dto.setName(company.getName());
        dto.setIndustry(company.getIndustry());
        dto.setCompanySize(company.getCompanySize());
        dto.setFoundedYear(company.getFoundedYear());
        dto.setRegistrationNumber(company.getRegistrationNumber());
        dto.setWebsite(company.getWebsite());
        dto.setContactEmail(company.getContactEmail());
        dto.setContactPhone(company.getContactPhone());
        dto.setLinkedinUrl(company.getLinkedinUrl());
        dto.setLocation(company.getLocation());
        dto.setAddress(company.getAddress());
        dto.setCountry(company.getCountry());
        dto.setDescription(company.getDescription());
        dto.setApprovalStatus(company.getApprovalStatus().name());
        dto.setApprovalNote(company.getApprovalNote());
        dto.setCreatedAt(Dates.format(company.getCreatedAt()));
        return dto;
    }

    public EmployerProfileResponse toEmployerProfile(EmployerProfile profile) {
        EmployerProfileResponse dto = new EmployerProfileResponse();
        dto.setId(profile.getId());
        dto.setFullName(profile.getUser().getFullName());
        dto.setEmail(profile.getUser().getEmail());
        dto.setPhotoPath(profile.getUser().getPhotoPath());
        dto.setJobTitle(profile.getJobTitle());
        dto.setDepartment(profile.getDepartment());
        dto.setWorkEmail(profile.getWorkEmail());
        dto.setContactPhone(profile.getContactPhone());
        dto.setCompany(toCompany(profile.getCompany()));
        return dto;
    }
}
