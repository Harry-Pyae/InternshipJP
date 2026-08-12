package com.internshipjp.backend.mapper;

import com.internshipjp.backend.dto.response.ApplicationStatusHistoryResponse;
import com.internshipjp.backend.dto.response.ApplicationSummaryResponse;
import com.internshipjp.backend.entity.Application;
import com.internshipjp.backend.entity.ApplicationStatusHistory;
import com.internshipjp.backend.util.Dates;
import org.springframework.stereotype.Component;

/**
 * Entity -> DTO conversion for applications.
 *
 * The full ApplicationDetailResponse is assembled in ApplicationService rather
 * than here, because it has to call CertificateService to fetch the verified
 * certificates - and that filtering is a security rule, not a mapping detail.
 */
@Component
public class ApplicationMapper {

    public ApplicationSummaryResponse toSummary(Application application) {
        ApplicationSummaryResponse dto = new ApplicationSummaryResponse();
        dto.setId(application.getId());
        dto.setStatus(application.getStatus().name());
        dto.setCreatedAt(Dates.format(application.getCreatedAt()));
        dto.setUpdatedAt(Dates.format(application.getUpdatedAt()));
        dto.setInternshipId(application.getInternship().getId());
        dto.setInternshipTitle(application.getInternship().getTitle());
        dto.setCompanyName(application.getInternship().getCompany().getName());
        dto.setStudentProfileId(application.getStudentProfile().getId());
        dto.setStudentName(application.getStudentProfile().getUser().getFullName());
        return dto;
    }

    public ApplicationStatusHistoryResponse toHistory(ApplicationStatusHistory history) {
        ApplicationStatusHistoryResponse dto = new ApplicationStatusHistoryResponse();
        dto.setId(history.getId());
        dto.setFromStatus(history.getFromStatus() == null ? null : history.getFromStatus().name());
        dto.setToStatus(history.getToStatus().name());
        dto.setNote(history.getNote());
        dto.setCreatedAt(Dates.format(history.getCreatedAt()));
        return dto;
    }
}
