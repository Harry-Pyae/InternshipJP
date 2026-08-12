package com.internshipjp.backend.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.internshipjp.backend.dto.response.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.LocalDateTime;

/**
 * Returns a JSON 403 when a signed-in user hits an endpoint their role is not
 * allowed to use, or when a CSRF token is missing.
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
        ErrorResponse body = new ErrorResponse();
        body.setTimestamp(LocalDateTime.now().toString());
        body.setStatus(HttpStatus.FORBIDDEN.value());
        body.setError("Forbidden");
        body.setMessage("Your role is not allowed to perform this action.");
        body.setPath(request.getRequestURI());

        response.setStatus(HttpStatus.FORBIDDEN.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        objectMapper.writeValue(response.getWriter(), body);
    }
}
