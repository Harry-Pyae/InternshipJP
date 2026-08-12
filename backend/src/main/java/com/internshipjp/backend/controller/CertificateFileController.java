package com.internshipjp.backend.controller;

import com.internshipjp.backend.entity.Certificate;
import com.internshipjp.backend.service.CertificateService;
import com.internshipjp.backend.security.CurrentUserService;
import com.internshipjp.backend.storage.FileStorageService;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * The one and only way to download a certificate file.
 *
 * WHY THERE IS A SINGLE ENDPOINT FOR ALL THREE ROLES
 *   The uploads folder is not served as static content, so a file can only be
 *   read through here. One endpoint means one place where the permission rule
 *   lives, and no chance of a second route being added later without the check.
 *
 * The decision itself is made by CertificateService.requireDownloadAccess:
 *   student  - own files only
 *   admin    - any file, for verification
 *   employer - VERIFIED files only, and only for someone who applied to one of
 *              their own internships
 *
 * Owner: Member 1 (endpoint) / rule shared with Member 4.
 */
@RestController
@RequestMapping("/api/certificates")
public class CertificateFileController {

    private final CertificateService certificateService;
    private final FileStorageService fileStorageService;
    private final CurrentUserService currentUserService;

    public CertificateFileController(CertificateService certificateService,
                                     FileStorageService fileStorageService,
                                     CurrentUserService currentUserService) {
        this.certificateService = certificateService;
        this.fileStorageService = fileStorageService;
        this.currentUserService = currentUserService;
    }

    @GetMapping("/{id}/file")
    public ResponseEntity<Resource> download(@PathVariable Long id) {
        // Permission first. Nothing is read from disk until this returns.
        Certificate certificate = certificateService
                .requireDownloadAccess(currentUserService.requireDetails(), id);

        Resource resource = fileStorageService.loadAsResource(certificate.getStoragePath());
        MediaType contentType = certificate.getMimeType() == null
                ? MediaType.APPLICATION_OCTET_STREAM
                : MediaType.parseMediaType(certificate.getMimeType());

        return ResponseEntity.ok()
                .contentType(contentType)
                // "inline" lets the browser preview a PDF; the filename shown is
                // the original one, not our internal UUID name.
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "inline; filename=\"" + certificate.getOriginalFileName() + "\"")
                .body(resource);
    }
}
