package com.internshipjp.backend.controller;

import com.internshipjp.backend.dto.request.CertificateUploadRequest;
import com.internshipjp.backend.dto.response.ApiMessageResponse;
import com.internshipjp.backend.dto.response.CertificateResponse;
import com.internshipjp.backend.security.CurrentUserService;
import com.internshipjp.backend.service.CertificateService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Certificate upload and management for the signed-in student.
 *
 * THE UPLOAD IS A MULTIPART REQUEST WITH TWO PARTS
 *   "metadata" - JSON matching CertificateUploadRequest
 *   "file"     - the PDF/PNG/JPG itself
 *
 * From React:
 *   const form = new FormData();
 *   form.append("metadata", new Blob([JSON.stringify(meta)], { type: "application/json" }));
 *   form.append("file", selectedFile);
 *   api.post("/api/students/me/certificates", form);
 *
 * Every upload is stored as PENDING. A student cannot mark their own
 * certificate as verified - only an administrator can.
 *
 * Owner: Member 2 (upload) / Member 4 (verification).
 */
@RestController
@RequestMapping("/api/students/me/certificates")
public class StudentCertificateController {

    private final CertificateService certificateService;
    private final CurrentUserService currentUserService;

    public StudentCertificateController(CertificateService certificateService,
                                        CurrentUserService currentUserService) {
        this.certificateService = certificateService;
        this.currentUserService = currentUserService;
    }

    @GetMapping
    public List<CertificateResponse> list() {
        return certificateService.listOwn(currentUserService.requireUserId());
    }

    @GetMapping("/{id}")
    public CertificateResponse get(@PathVariable Long id) {
        return certificateService.getOwn(currentUserService.requireUserId(), id);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<CertificateResponse> upload(
            @Valid @RequestPart("metadata") CertificateUploadRequest metadata,
            @RequestPart("file") MultipartFile file) {
        CertificateResponse created =
                certificateService.upload(currentUserService.requireUserId(), metadata, file);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @DeleteMapping("/{id}")
    public ApiMessageResponse delete(@PathVariable Long id) {
        certificateService.deleteOwn(currentUserService.requireUserId(), id);
        return new ApiMessageResponse("Certificate removed.");
    }
}
