package com.internshipjp.backend.controller;

import com.internshipjp.backend.dto.response.InternshipDetailResponse;
import com.internshipjp.backend.dto.response.InternshipSummaryResponse;
import com.internshipjp.backend.dto.response.PageResponse;
import com.internshipjp.backend.service.InternshipService;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Public internship discovery. No sign-in required - a visitor can browse
 * vacancies before creating an account.
 *
 * Only OPEN internships are listed. Drafts stay invisible.
 *
 * TODO MEMBER_3: add the real filters (work mode, location, stipend range,
 * required skills) as extra optional request parameters here.
 *
 * Owner: Member 3.
 */
@RestController
@RequestMapping("/api/internships")
public class InternshipController {

    private static final int MAX_PAGE_SIZE = 50;

    private final InternshipService internshipService;

    public InternshipController(InternshipService internshipService) {
        this.internshipService = internshipService;
    }

    @GetMapping
    public PageResponse<InternshipSummaryResponse> list(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        return internshipService.listOpen(keyword,
                PageRequest.of(Math.max(page, 0), safeSize, Sort.by(Sort.Direction.DESC, "createdAt")));
    }

    @GetMapping("/{id}")
    public InternshipDetailResponse get(@PathVariable Long id) {
        return internshipService.getPublicDetail(id);
    }
}
