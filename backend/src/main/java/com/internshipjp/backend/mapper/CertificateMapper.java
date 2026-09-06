package com.internshipjp.backend.mapper;

import com.internshipjp.backend.dto.response.CertificateResponse;
import com.internshipjp.backend.entity.Certificate;
import com.internshipjp.backend.util.Dates;
import org.springframework.stereotype.Component;

/**
 * Entity -> DTO conversion for certificates.
 *
 * Note what is NOT copied: storagePath and storedFileName stay on the server.
 * The browser only ever receives the id, and downloads go through the secured
 * download endpoint.
 */
@Component
public class CertificateMapper {

    public CertificateResponse toResponse(Certificate certificate) {
        CertificateResponse dto = new CertificateResponse();
        dto.setId(certificate.getId());
        dto.setTitle(certificate.getTitle());
        dto.setStudentName(certificate.getStudentProfile().getUser().getFullName());
        dto.setIssuingOrganization(certificate.getIssuingOrganization());
        dto.setIssueDate(Dates.format(certificate.getIssueDate()));
        dto.setOriginalFileName(certificate.getOriginalFileName());
        dto.setMimeType(certificate.getMimeType());
        dto.setFileSize(certificate.getFileSize());
        dto.setVerificationStatus(certificate.getVerificationStatus().name());
        dto.setVerificationNote(certificate.getVerificationNote());
        dto.setVerifiedAt(Dates.format(certificate.getVerifiedAt()));
        dto.setCreatedAt(Dates.format(certificate.getCreatedAt()));
        return dto;
    }
}
