package com.internshipjp.backend.dto.response;


/**
 * GET /api/test/health
 */
public class HealthResponse {
    private String status;

    private String application;

    private String timestamp;

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getApplication() {
        return application;
    }

    public void setApplication(String application) {
        this.application = application;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }
}
