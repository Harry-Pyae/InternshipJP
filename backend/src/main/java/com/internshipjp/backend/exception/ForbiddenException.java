package com.internshipjp.backend.exception;

import org.springframework.http.HttpStatus;

/**
 * 403 - signed in, but not allowed to touch this record.
 *
 * Use this for ownership failures: an employer opening another company's
 * application, a student editing someone else's profile.
 */
public class ForbiddenException extends ApiException {

    public ForbiddenException(String message) {
        super(HttpStatus.FORBIDDEN, "Forbidden", message);
    }
}
