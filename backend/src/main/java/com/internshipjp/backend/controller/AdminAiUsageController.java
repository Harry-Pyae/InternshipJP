package com.internshipjp.backend.controller;

import com.internshipjp.backend.ai.AiOversightService;
import com.internshipjp.backend.dto.response.AiUsageLogResponse;
import com.internshipjp.backend.dto.response.AiUsageSummaryResponse;
import com.internshipjp.backend.dto.response.PageResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * AI oversight for administrators.
 *
 * Sits under /api/admin/**, so SecurityConfig already restricts it to ADMIN -
 * no extra role check is needed here.
 *
 * Owner: Member 1 (the AI usage log is my area).
 * Member 4: these two endpoints are ready for the admin dashboard. /summary
 * suits a row of stat cards; /usage suits a table.
 *
 * Neither endpoint can return conversation content - see AiOversightService.
 */
@RestController
@RequestMapping("/api/admin/ai")
public class AdminAiUsageController {

    private static final int MAX_PAGE_SIZE = 100;

    private final AiOversightService aiOversightService;

    public AdminAiUsageController(AiOversightService aiOversightService) {
        this.aiOversightService = aiOversightService;
    }

    @GetMapping("/usage")
    public PageResponse<AiUsageLogResponse> usage(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        return aiOversightService.listUsage(PageRequest.of(Math.max(page, 0), safeSize));
    }

    @GetMapping("/usage/summary")
    public AiUsageSummaryResponse summary() {
        return aiOversightService.summary();
    }
}
