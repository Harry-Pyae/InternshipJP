package com.internshipjp.backend.dto.response;


/**
 * GET /api/test/ai
 *
 * configured = an API key is present.
 * reachable  = the provider actually answered a minimal request.
 * The API key itself is never included.
 */
public class AiStatusResponse {
    private String provider;

    private boolean configured;

    private boolean reachable;

    private String model;

    private Long latencyMs;

    private String error;

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public boolean isConfigured() {
        return configured;
    }

    public void setConfigured(boolean configured) {
        this.configured = configured;
    }

    public boolean isReachable() {
        return reachable;
    }

    public void setReachable(boolean reachable) {
        this.reachable = reachable;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public Long getLatencyMs() {
        return latencyMs;
    }

    public void setLatencyMs(Long latencyMs) {
        this.latencyMs = latencyMs;
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }
}
