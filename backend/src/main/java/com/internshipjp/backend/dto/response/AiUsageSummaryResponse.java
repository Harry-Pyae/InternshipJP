package com.internshipjp.backend.dto.response;

/**
 * Headline AI numbers for the administrator dashboard.
 *
 * Member 4: this is ready to drop into a set of stat cards.
 */
public class AiUsageSummaryResponse {

    private long totalCalls;
    private long successfulCalls;
    private long failedCalls;
    private String provider;
    private boolean configured;

    public long getTotalCalls() {
        return totalCalls;
    }

    public void setTotalCalls(long totalCalls) {
        this.totalCalls = totalCalls;
    }

    public long getSuccessfulCalls() {
        return successfulCalls;
    }

    public void setSuccessfulCalls(long successfulCalls) {
        this.successfulCalls = successfulCalls;
    }

    public long getFailedCalls() {
        return failedCalls;
    }

    public void setFailedCalls(long failedCalls) {
        this.failedCalls = failedCalls;
    }

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
}
