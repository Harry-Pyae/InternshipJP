package com.internshipjp.backend.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.security.web.csrf.CsrfTokenRequestHandler;
import org.springframework.security.web.csrf.XorCsrfTokenRequestAttributeHandler;
import org.springframework.util.StringUtils;

import java.util.function.Supplier;

/**
 * CSRF handling for a single-page application.
 *
 * How the whole thing fits together:
 *   1. The backend stores the CSRF token in a readable cookie (XSRF-TOKEN).
 *   2. Axios reads that cookie automatically and copies the value into the
 *      X-XSRF-TOKEN header on POST/PUT/PATCH/DELETE.
 *   3. This handler validates the header.
 *
 * Why two delegates: the token written into the cookie is masked against the
 * BREACH attack. A value that arrives in a header is the raw token and is
 * compared directly; a value that arrives as a form field is still masked and
 * has to be unmasked first.
 *
 * React never has to build a token by hand - it only has to make one GET
 * request first (the app calls GET /api/auth/csrf on startup) so the cookie
 * exists.
 */
public final class SpaCsrfTokenRequestHandler implements CsrfTokenRequestHandler {

    private final CsrfTokenRequestHandler plain = new CsrfTokenRequestAttributeHandler();
    private final CsrfTokenRequestHandler masked = new XorCsrfTokenRequestAttributeHandler();

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response,
                       Supplier<CsrfToken> deferredCsrfToken) {
        this.masked.handle(request, response, deferredCsrfToken);
    }

    @Override
    public String resolveCsrfTokenValue(HttpServletRequest request, CsrfToken csrfToken) {
        String headerValue = request.getHeader(csrfToken.getHeaderName());
        if (StringUtils.hasText(headerValue)) {
            return this.plain.resolveCsrfTokenValue(request, csrfToken);
        }
        return this.masked.resolveCsrfTokenValue(request, csrfToken);
    }
}
