package com.internshipjp.backend.exception;

import com.internshipjp.backend.dto.response.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Turns every exception into the one JSON error shape the React side expects:
 *
 * {
 *   "timestamp": "...", "status": 400, "error": "Validation Error",
 *   "message": "...", "path": "/api/...", "fieldErrors": { "email": "..." }
 * }
 *
 * Rule: stack traces and SQL never reach the browser. Unexpected errors are
 * logged in full on the server and reported to the client as a plain 500.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    private ResponseEntity<ErrorResponse> build(HttpStatus status, String error, String message,
                                                HttpServletRequest request, Map<String, String> fieldErrors) {
        ErrorResponse body = new ErrorResponse();
        body.setTimestamp(LocalDateTime.now().toString());
        body.setStatus(status.value());
        body.setError(error);
        body.setMessage(message);
        body.setPath(request.getRequestURI());
        body.setFieldErrors(fieldErrors);
        return ResponseEntity.status(status).body(body);
    }

    /** Anything the application threw on purpose. */
    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ErrorResponse> handleApi(ApiException ex, HttpServletRequest request) {
        return build(ex.getStatus(), ex.getError(), ex.getMessage(), request, null);
    }

    /** @Valid failure on a request body - includes the per-field messages. */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex,
                                                          HttpServletRequest request) {
        Map<String, String> fields = new LinkedHashMap<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            fields.putIfAbsent(fieldError.getField(), fieldError.getDefaultMessage());
        }
        return build(HttpStatus.BAD_REQUEST, "Validation Error",
                "Some fields are not valid. Check fieldErrors for details.", request, fields);
    }

    /** @Validated failure on a path variable or request parameter. */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponse> handleConstraint(ConstraintViolationException ex,
                                                          HttpServletRequest request) {
        Map<String, String> fields = new LinkedHashMap<>();
        for (ConstraintViolation<?> violation : ex.getConstraintViolations()) {
            fields.putIfAbsent(String.valueOf(violation.getPropertyPath()), violation.getMessage());
        }
        return build(HttpStatus.BAD_REQUEST, "Validation Error",
                "Some values are not valid.", request, fields);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleUnreadable(HttpMessageNotReadableException ex,
                                                          HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST, "Bad Request",
                "The request body is missing or is not valid JSON.", request, null);
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ErrorResponse> handleMissingParam(MissingServletRequestParameterException ex,
                                                            HttpServletRequest request) {
        return build(HttpStatus.BAD_REQUEST, "Bad Request",
                "Required parameter '" + ex.getParameterName() + "' is missing.", request, null);
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ErrorResponse> handleUploadSize(MaxUploadSizeExceededException ex,
                                                          HttpServletRequest request) {
        return build(HttpStatus.PAYLOAD_TOO_LARGE, "File Too Large",
                "The uploaded file is larger than the allowed limit.", request, null);
    }

    /** Thrown by @PreAuthorize. Filter-level denials are handled by RestAccessDeniedHandler. */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex,
                                                            HttpServletRequest request) {
        return build(HttpStatus.FORBIDDEN, "Forbidden",
                "Your role is not allowed to perform this action.", request, null);
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ErrorResponse> handleAuthentication(AuthenticationException ex,
                                                              HttpServletRequest request) {
        return build(HttpStatus.UNAUTHORIZED, "Unauthorized",
                "Email or password is incorrect.", request, null);
    }

    /**
     * A database constraint stopped the write. The message stays generic on
     * purpose - the underlying text contains table and column names.
     */
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrity(DataIntegrityViolationException ex,
                                                             HttpServletRequest request) {
        log.warn("Database constraint violated on {}: {}", request.getRequestURI(), ex.getMostSpecificCause().getMessage());
        return build(HttpStatus.CONFLICT, "Conflict",
                "That record already exists or is still referenced by other data.", request, null);
    }

    /** Last resort. Log everything, tell the user nothing technical. */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnexpected(Exception ex, HttpServletRequest request) {
        log.error("Unhandled error on {} {}", request.getMethod(), request.getRequestURI(), ex);
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error",
                "Something went wrong on the server. Please try again.", request, null);
    }
}
