package com.internshipjp.backend.ai;

/**
 * The honest answer to "is the AI provider usable right now?".
 *
 * configured = a key is present in the server configuration
 * reachable  = the provider actually answered
 *
 * Both values are measured, never assumed.
 */
public class AiProviderStatus {

    private final String provider;
    private final boolean configured;
    private final boolean reachable;
    private final String model;
    private final Long latencyMs;
    private final String error;

    public AiProviderStatus(String provider, boolean configured, boolean reachable,
                            String model, Long latencyMs, String error) {
        this.provider = provider;
        this.configured = configured;
        this.reachable = reachable;
        this.model = model;
        this.latencyMs = latencyMs;
        this.error = error;
    }

    public String getProvider() {
        return provider;
    }

    public boolean isConfigured() {
        return configured;
    }

    public boolean isReachable() {
        return reachable;
    }

    public String getModel() {
        return model;
    }

    public Long getLatencyMs() {
        return latencyMs;
    }

    public String getError() {
        return error;
    }
}
