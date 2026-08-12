package com.internshipjp.backend.exception;

import org.springframework.http.HttpStatus;

/** 404 - the record does not exist, or the caller is not allowed to know it does. */
public class NotFoundException extends ApiException {

    public NotFoundException(String message) {
        super(HttpStatus.NOT_FOUND, "Not Found", message);
    }

    /** Convenience for the common "X with id Y" case. */
    public static NotFoundException of(String what, Object id) {
        return new NotFoundException(what + " " + id + " was not found");
    }
}
