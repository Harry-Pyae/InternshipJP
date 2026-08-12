package com.internshipjp.backend.exception;

import org.springframework.http.HttpStatus;

/** 400 - the request is understood but breaks a business rule. */
public class BadRequestException extends ApiException {

    public BadRequestException(String message) {
        super(HttpStatus.BAD_REQUEST, "Bad Request", message);
    }
}
