package com.internshipjp.backend.ai;

import com.internshipjp.backend.entity.AiUsageLog;
import com.internshipjp.backend.repository.AiUsageLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Writes one row to ai_usage_logs per provider call.
 *
 * WHY THIS IS A SEPARATE CLASS
 *   REQUIRES_NEW only works when the call arrives through Spring's proxy. If
 *   AiService called its own method, the annotation would be silently ignored
 *   and a failed AI call would be rolled back together with everything else -
 *   losing exactly the records we most want to keep. A separate bean makes the
 *   new transaction real.
 *
 * WHAT IS RECORDED
 *   Provider, model, success, timing and token counts. Never prompt text,
 *   never the API key, never anything about the user beyond their id.
 */
@Service
public class AiUsageRecorder {

    private final AiUsageLogRepository usageLogRepository;

    public AiUsageRecorder(AiUsageLogRepository usageLogRepository) {
        this.usageLogRepository = usageLogRepository;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordSuccess(Long userId, String feature, String provider, AiCompletion completion) {
        AiUsageLog entry = base(userId, feature, provider, true);
        entry.setModel(completion.getModel());
        entry.setDurationMs(completion.getDurationMs());
        entry.setPromptTokens(completion.getPromptTokens());
        entry.setCompletionTokens(completion.getCompletionTokens());
        entry.setTotalTokens(completion.getTotalTokens());
        usageLogRepository.save(entry);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordFailure(Long userId, String feature, String provider,
                              String errorCode, String model, Long durationMs) {
        AiUsageLog entry = base(userId, feature, provider, false);
        entry.setErrorCode(errorCode);
        entry.setModel(model);
        entry.setDurationMs(durationMs);
        usageLogRepository.save(entry);
    }

    /**
     * Records the result of a connection check (GET /api/test/ai), so we can
     * see later whether the provider was flaky during a demo.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordStatusCheck(String provider, boolean configured, boolean reachable,
                                  String model, Long latencyMs) {
        AiUsageLog entry = base(null, "CONNECTION_TEST", provider, reachable);
        entry.setModel(model);
        entry.setDurationMs(latencyMs);
        if (!reachable) {
            entry.setErrorCode(configured ? "PROVIDER_UNREACHABLE" : "MISSING_API_KEY");
        }
        usageLogRepository.save(entry);
    }

    private AiUsageLog base(Long userId, String feature, String provider, boolean success) {
        AiUsageLog entry = new AiUsageLog();
        entry.setUserId(userId);
        entry.setFeature(feature);
        entry.setProvider(provider);
        entry.setSuccess(success);
        return entry;
    }
}
