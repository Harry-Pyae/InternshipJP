package com.internshipjp.backend.exception;

import org.springframework.http.HttpStatus;

/** 409 - the request collides with something that already exists. */
public class ConflictException extends ApiException {

    public ConflictException(String message) {
        super(HttpStatus.CONFLICT, "Conflict", message);
    }
}
