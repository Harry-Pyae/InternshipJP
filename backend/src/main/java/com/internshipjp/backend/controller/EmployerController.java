package com.internshipjp.backend.controller;

import com.internshipjp.backend.dto.request.UpdateCompanyRequest;
import com.internshipjp.backend.dto.request.UpdateEmployerProfileRequest;
import com.internshipjp.backend.dto.response.CompanyResponse;
import com.internshipjp.backend.dto.response.EmployerProfileResponse;
import com.internshipjp.backend.security.CurrentUserService;
import com.internshipjp.backend.service.EmployerService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.internshipjp.backend.dto.response.EmployerDashboardResponse;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;

/**
 * The signed-in employer's recruiter profile and company details.
 *
 * The company is found through the session, never through an id in the URL, so
 * an employer cannot edit another company by guessing a number.
 *
 * Owner: Member 3.
 */
@RestController
@RequestMapping("/api/employer")
public class EmployerController {

    private final EmployerService employerService;
    private final CurrentUserService currentUserService;

    public EmployerController(EmployerService employerService,
                             CurrentUserService currentUserService) {
        this.employerService = employerService;
        this.currentUserService = currentUserService;
    }

    @GetMapping("/profile")
    public EmployerProfileResponse getProfile() {
        return employerService.getOwnProfile(currentUserService.requireUserId());
    }

    @PutMapping("/profile")
    public EmployerProfileResponse updateProfile(@Valid @RequestBody UpdateEmployerProfileRequest request) {
        return employerService.updateOwnProfile(currentUserService.requireUserId(), request);
    }

    @GetMapping("/company")
    public CompanyResponse getCompany() {
        return employerService.getOwnCompany(currentUserService.requireUserId());
    }

    @PutMapping("/company")
    public CompanyResponse updateCompany(@Valid @RequestBody UpdateCompanyRequest request) {
        return employerService.updateOwnCompany(currentUserService.requireUserId(), request);
    }
@GetMapping("/dashboard")
public EmployerDashboardResponse getDashboard() {
    return employerService.getDashboard(
            currentUserService.requireUserId());
}
    /** Removes this company's logo. */
    @DeleteMapping("/company/logo")
    public CompanyResponse removeCompanyLogo() {
        return employerService.removeCompanyLogo(currentUserService.requireUserId());
    }

    /** Streams this company's logo, or 404 when it has none. */
    @GetMapping("/company/logo")
    public ResponseEntity<Resource> companyLogo() {
        return employerService.ownCompanyLogo(currentUserService.requireUserId());
    }

    /** Replaces this company's logo. Employers of that company only. */
    @PostMapping("/company/logo")
    public CompanyResponse uploadCompanyLogo(@RequestParam("file") MultipartFile file) {
        return employerService.replaceCompanyLogo(currentUserService.requireUserId(), file);
    }

}
