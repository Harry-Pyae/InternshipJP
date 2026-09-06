package com.internshipjp.backend.mapper;

import com.internshipjp.backend.dto.response.InternshipDetailResponse;
import com.internshipjp.backend.dto.response.InternshipSummaryResponse;
import com.internshipjp.backend.entity.Internship;
import com.internshipjp.backend.entity.InternshipSkill;
import com.internshipjp.backend.util.Dates;
import org.springframework.stereotype.Component;

import java.util.List;

/** Entity -> DTO conversion for internships. */
@Component
public class InternshipMapper {

    private final CompanyMapper companyMapper;

    public InternshipMapper(CompanyMapper companyMapper) {
        this.companyMapper = companyMapper;
    }

    public InternshipSummaryResponse toSummary(Internship internship) {
        InternshipSummaryResponse dto = new InternshipSummaryResponse();
        dto.setId(internship.getId());
        dto.setTitle(internship.getTitle());
        dto.setCompanyName(internship.getCompany().getName());
        dto.setLocation(internship.getLocation());
        dto.setWorkMode(internship.getWorkMode().name());
        dto.setDurationMonths(internship.getDurationMonths());
        dto.setStatus(internship.getStatus().name());
        dto.setApplicationDeadline(Dates.format(internship.getApplicationDeadline()));
        dto.setAvailablePositions(internship.getAvailablePositions());
        dto.setCreatedAt(Dates.format(internship.getCreatedAt()));
        return dto;
    }

    public InternshipDetailResponse toDetail(Internship internship, List<InternshipSkill> skills) {
        InternshipDetailResponse dto = new InternshipDetailResponse();
        dto.setId(internship.getId());
        dto.setTitle(internship.getTitle());
        dto.setDescription(internship.getDescription());
        dto.setResponsibilities(internship.getResponsibilities());
        dto.setRequirements(internship.getRequirements());
        dto.setLocation(internship.getLocation());
        dto.setWorkMode(internship.getWorkMode().name());
        dto.setDurationMonths(internship.getDurationMonths());
        dto.setStipendAmount(internship.getStipendAmount());
        dto.setStipendCurrency(internship.getStipendCurrency());
        dto.setAvailablePositions(internship.getAvailablePositions());
        dto.setApplicationDeadline(Dates.format(internship.getApplicationDeadline()));
        dto.setStatus(internship.getStatus().name());
        dto.setPublishedAt(Dates.format(internship.getPublishedAt()));
        dto.setCreatedAt(Dates.format(internship.getCreatedAt()));
        dto.setCompany(companyMapper.toCompany(internship.getCompany()));
        dto.setRequiredSkills(skills == null ? List.of()
                : skills.stream().map(InternshipSkill::getName).toList());
        return dto;
    }
}
