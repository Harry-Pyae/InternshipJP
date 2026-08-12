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
}
