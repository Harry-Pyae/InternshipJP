package com.internshipjp.backend.controller;

import com.internshipjp.backend.ai.AiService;
import com.internshipjp.backend.dto.response.AiStatusResponse;
import com.internshipjp.backend.dto.response.DatabaseStatusResponse;
import com.internshipjp.backend.dto.response.HealthResponse;
import com.internshipjp.backend.service.PlatformStatusService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Integration test endpoints. This is Member 1's area.
 *
 * They exist so the three connections in this project can be checked
 * independently, in order:
 *
 *   GET /api/test/health     React  -> Spring Boot
 *   GET /api/test/database   Spring Boot -> MariaDB
 *   GET /api/test/ai         Spring Boot -> Groq
 *
 * Every answer is measured, never hard-coded. If MariaDB is down, /database
 * says connected=false and explains why.
 *
 * TURNING THEM OFF
 *   The whole controller disappears when APP_TEST_ENDPOINTS_ENABLED=false -
 *   the endpoints then return 404 rather than being merely hidden.
 */
@RestController
@RequestMapping("/api/test")
@ConditionalOnProperty(name = "app.test-endpoints-enabled", havingValue = "true", matchIfMissing = true)
public class TestController {

    private final PlatformStatusService platformStatusService;
    private final AiService aiService;

    public TestController(PlatformStatusService platformStatusService, AiService aiService) {
        this.platformStatusService = platformStatusService;
        this.aiService = aiService;
    }

    @GetMapping("/health")
    public HealthResponse health() {
        return platformStatusService.health();
    }

    @GetMapping("/database")
    public DatabaseStatusResponse database() {
        return platformStatusService.database();
    }

    @GetMapping("/ai")
    public AiStatusResponse ai() {
        return aiService.status();
    }
}
