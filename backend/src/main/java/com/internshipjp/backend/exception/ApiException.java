package com.internshipjp.backend.exception;

import org.springframework.http.HttpStatus;

/**
 * Base class for every error this application raises on purpose.
 *
 * Services throw one of the subclasses; GlobalExceptionHandler turns it into
 * the standard JSON error body. Nothing in the codebase should build an
 * error response by hand.
 */
public class ApiException extends RuntimeException {

    private final HttpStatus status;
    private final String error;

    public ApiException(HttpStatus status, String error, String message) {
        super(message);
        this.status = status;
        this.error = error;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getError() {
        return error;
    }
}
