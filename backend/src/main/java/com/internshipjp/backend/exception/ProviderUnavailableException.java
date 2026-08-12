package com.internshipjp.backend.exception;

import org.springframework.http.HttpStatus;

/**
 * 503 - an external provider (Groq, SMTP) could not be reached.
 *
 * This is deliberately separate from a 500: it tells the frontend that the
 * platform itself is fine and the user should simply continue without the
 * optional feature.
 */
public class ProviderUnavailableException extends ApiException {

    public ProviderUnavailableException(String message) {
        super(HttpStatus.SERVICE_UNAVAILABLE, "Provider Unavailable", message);
    }
}
