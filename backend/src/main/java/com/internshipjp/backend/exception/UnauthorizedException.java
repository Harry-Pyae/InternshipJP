package com.internshipjp.backend.exception;

import org.springframework.http.HttpStatus;

/** 401 - nobody is signed in, or the session expired. */
public class UnauthorizedException extends ApiException {

    public UnauthorizedException(String message) {
        super(HttpStatus.UNAUTHORIZED, "Unauthorized", message);
    }
}
