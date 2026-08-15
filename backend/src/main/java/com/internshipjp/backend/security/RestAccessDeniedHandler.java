package com.internshipjp.backend.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.internshipjp.backend.dto.response.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.csrf.CsrfException;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.LocalDateTime;

/**
 * Returns a JSON 403 when a request is refused by the filter chain.
 *
 * TWO VERY DIFFERENT CAUSES END UP HERE, so they get different messages:
 *
 *   CsrfException - the CSRF token was missing or stale. This is a browser or
 *                   client-configuration problem and says nothing about who
 *                   the caller is. It happens on endpoints that are open to
 *                   everyone, which makes a message about roles actively
 *                   misleading.
 *
 *   anything else - a signed-in user hit an endpoint their role cannot use.
 *
 * The first version of this class reported both as "your role is not allowed",
 * which sent someone hunting through SecurityConfig for a permissions bug that
 * did not exist. An error message that names the wrong cause is worse than a
 * vague one.
 */
@Component
public class RestAccessDeniedHandler implements AccessDeniedHandler {

    private final ObjectMapper objectMapper;

    public RestAccessDeniedHandler(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response,
                       AccessDeniedException accessDeniedException) throws IOException {
        boolean csrfFailure = accessDeniedException instanceof CsrfException;

        ErrorResponse body = new ErrorResponse();
        body.setTimestamp(LocalDateTime.now().toString());
        body.setStatus(HttpStatus.FORBIDDEN.value());
        body.setError(csrfFailure ? "Invalid Security Token" : "Forbidden");
        body.setMessage(csrfFailure
                ? "Your security token is missing or has expired. Reload the page and try again. "
                        + "(If you are calling the API directly: send a GET first to receive the "
                        + "XSRF-TOKEN cookie, then return it in the X-XSRF-TOKEN header.)"
                : "Your role is not allowed to perform this action.");
        body.setPath(request.getRequestURI());

        response.setStatus(HttpStatus.FORBIDDEN.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        objectMapper.writeValue(response.getWriter(), body);
    }
}
