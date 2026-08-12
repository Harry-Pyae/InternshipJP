package com.internshipjp.backend.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.internshipjp.backend.config.AppProperties;
import com.internshipjp.backend.dto.response.ApiMessageResponse;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * The security foundation for the whole application.
 *
 * Decisions made here, and why:
 *
 *  SESSIONS, NOT JWT
 *      The browser gets a normal session cookie. Simpler to demonstrate,
 *      and logout genuinely ends the session on the server.
 *
 *  CSRF STAYS ON
 *      Because we authenticate with a cookie, the app would otherwise be open
 *      to cross-site request forgery. csrf.disable() is not used anywhere.
 *      See SpaCsrfTokenRequestHandler for how React sends the token.
 *
 *  ROLES ARE CHECKED HERE, OWNERSHIP IS CHECKED IN SERVICES
 *      This class answers "may an EMPLOYER call this URL at all?".
 *      It cannot answer "does THIS employer own THAT application?" - that is
 *      the job of the service layer, every time.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final AppProperties appProperties;
    private final RestAuthenticationEntryPoint authenticationEntryPoint;
    private final RestAccessDeniedHandler accessDeniedHandler;
    private final ObjectMapper objectMapper;

    public SecurityConfig(AppProperties appProperties,
                          RestAuthenticationEntryPoint authenticationEntryPoint,
                          RestAccessDeniedHandler accessDeniedHandler,
                          ObjectMapper objectMapper) {
        this.appProperties = appProperties;
        this.authenticationEntryPoint = authenticationEntryPoint;
        this.accessDeniedHandler = accessDeniedHandler;
        this.objectMapper = objectMapper;
    }

    /** BCrypt. Never store or compare a plain password anywhere else. */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration)
            throws Exception {
        return configuration.getAuthenticationManager();
    }

    /** Stores the signed-in user in the HTTP session. Used by AuthService. */
    @Bean
    public SecurityContextRepository securityContextRepository() {
        return new HttpSessionSecurityContextRepository();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(Customizer.withDefaults())
            .csrf(csrf -> csrf
                    // Readable by JavaScript so Axios can copy it into a header.
                    .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                    .csrfTokenRequestHandler(new SpaCsrfTokenRequestHandler()))
            .addFilterAfter(new CsrfCookieFilter(), BasicAuthenticationFilter.class)

            // No browser login form and no HTTP Basic popup: this is a JSON API.
            .formLogin(AbstractHttpConfigurer::disable)
            .httpBasic(AbstractHttpConfigurer::disable)

            .sessionManagement(session -> session
                    .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
                    // New session id after login, so a stolen pre-login id is useless.
                    .sessionFixation(fixation -> fixation.migrateSession()))

            .exceptionHandling(handling -> handling
                    .authenticationEntryPoint(authenticationEntryPoint)
                    .accessDeniedHandler(accessDeniedHandler))

            .authorizeHttpRequests(auth -> auth
                    // --- open to everyone -------------------------------------
                    .requestMatchers("/api/test/**").permitAll()
                    .requestMatchers(HttpMethod.GET, "/api/auth/csrf").permitAll()
                    .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
                    .requestMatchers(HttpMethod.POST, "/api/auth/register/**").permitAll()
                    // Public internship discovery. Students do not have to sign
                    // in just to browse vacancies.
                    .requestMatchers(HttpMethod.GET, "/api/internships", "/api/internships/*").permitAll()
                    .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                    // --- role-restricted areas --------------------------------
                    .requestMatchers("/api/admin/**").hasRole("ADMIN")
                    .requestMatchers("/api/employer/**").hasRole("EMPLOYER")
                    .requestMatchers("/api/students/**", "/api/student/**").hasRole("STUDENT")
                    .requestMatchers("/api/ai/**").hasAnyRole("STUDENT", "EMPLOYER")

                    // --- everything else needs a signed-in user ---------------
                    .anyRequest().authenticated())

            .logout(logout -> logout
                    .logoutUrl("/api/auth/logout")
                    .invalidateHttpSession(true)
                    .clearAuthentication(true)
                    .deleteCookies("INTERNSHIPJP_SESSION")
                    .logoutSuccessHandler((request, response, authentication) -> {
                        response.setStatus(HttpServletResponse.SC_OK);
                        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                        response.setCharacterEncoding("UTF-8");
                        objectMapper.writeValue(response.getWriter(),
                                new ApiMessageResponse("Signed out."));
                    }));

        return http.build();
    }

    /**
     * CORS for the React dev server.
     *
     * allowCredentials(true) is what lets the session cookie travel between
     * localhost:5173 and localhost:8080. It also means the allowed origin has
     * to be an exact address - "*" is rejected by browsers in that mode.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(appProperties.getFrontendOrigin()));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Content-Type", "Accept", "X-XSRF-TOKEN", "X-Requested-With"));
        configuration.setExposedHeaders(List.of("Content-Disposition"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);
        return source;
    }
}
