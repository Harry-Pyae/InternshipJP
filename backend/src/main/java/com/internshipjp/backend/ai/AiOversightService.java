package com.internshipjp.backend.ai;

import com.internshipjp.backend.dto.response.AiUsageLogResponse;
import com.internshipjp.backend.dto.response.AiUsageSummaryResponse;
import com.internshipjp.backend.dto.response.PageResponse;
import com.internshipjp.backend.entity.AiUsageLog;
import com.internshipjp.backend.repository.AiUsageLogRepository;
import com.internshipjp.backend.util.Dates;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Read-only view of AI usage, for administrators.
 *
 * WHAT THIS IS FOR
 *   Answering "is the assistant actually working?", "how often is it failing?"
 *   and "how much are we calling it?" without anyone having to read the server
 *   log or open the database.
 *
 * WHAT IT DELIBERATELY CANNOT DO
 *   Show anyone's conversations. The ai_usage_logs table holds no prompt text
 *   and no answers, so an administrator with full access to this screen still
 *   cannot read a student's chat. That is a property of the schema, not a rule
 *   this class chooses to follow.
 *
 * Owner: Member 1 (AI usage logging). Rendered by Member 4 on the admin
 * dashboard.
 */
@Service
public class AiOversightService {

    private final AiUsageLogRepository usageLogRepository;
    private final AiProviderClient providerClient;

    public AiOversightService(AiUsageLogRepository usageLogRepository,
                              AiProviderClient providerClient) {
        this.usageLogRepository = usageLogRepository;
        this.providerClient = providerClient;
    }

    @Transactional(readOnly = true)
    public PageResponse<AiUsageLogResponse> listUsage(Pageable pageable) {
        return PageResponse.from(
                usageLogRepository.findAllByOrderByCreatedAtDesc(pageable),
                this::toResponse);
    }

    /**
     * Headline counts. isConfigured() is a local check of the configuration -
     * it makes no network call, so opening the admin dashboard never costs an
     * API request.
     */
    @Transactional(readOnly = true)
    public AiUsageSummaryResponse summary() {
        long successful = usageLogRepository.countBySuccess(true);
        long failed = usageLogRepository.countBySuccess(false);

        AiUsageSummaryResponse summary = new AiUsageSummaryResponse();
        summary.setSuccessfulCalls(successful);
        summary.setFailedCalls(failed);
        summary.setTotalCalls(successful + failed);
        summary.setProvider(providerClient.providerName());
        summary.setConfigured(providerClient.isConfigured());
        return summary;
    }

    private AiUsageLogResponse toResponse(AiUsageLog entry) {
        AiUsageLogResponse dto = new AiUsageLogResponse();
        dto.setId(entry.getId());
        dto.setUserId(entry.getUserId());
        dto.setFeature(entry.getFeature());
        dto.setProvider(entry.getProvider());
        dto.setModel(entry.getModel());
        dto.setSuccess(entry.isSuccess());
        dto.setErrorCode(entry.getErrorCode());
        dto.setTotalTokens(entry.getTotalTokens());
        dto.setDurationMs(entry.getDurationMs());
        dto.setCreatedAt(Dates.format(entry.getCreatedAt()));
        return dto;
    }
}
