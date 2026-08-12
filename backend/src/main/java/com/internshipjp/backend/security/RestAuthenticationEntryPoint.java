package com.internshipjp.backend.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.internshipjp.backend.dto.response.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.LocalDateTime;

/**
 * Returns a JSON 401 instead of redirecting to a login page.
 *
 * Without this, an expired session would send React the HTML of a login form
 * and Axios would fail with a confusing parse error.
 */
@Component
public class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper;

    public RestAuthenticationEntryPoint(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                         AuthenticationException authException) throws IOException {
        ErrorResponse body = new ErrorResponse();
        body.setTimestamp(LocalDateTime.now().toString());
        body.setStatus(HttpStatus.UNAUTHORIZED.value());
        body.setError("Unauthorized");
        body.setMessage("You are not signed in, or your session has expired.");
        body.setPath(request.getRequestURI());

        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        objectMapper.writeValue(response.getWriter(), body);
    }
}
