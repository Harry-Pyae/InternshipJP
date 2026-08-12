package com.internshipjp.backend.security;

import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Proves the role rules in SecurityConfig really work.
 *
 * This is the pattern to copy when you add endpoints: one test per rule you
 * care about. Checking authorisation by clicking around in the browser is not
 * the same thing - the browser only shows you the happy path.
 *
 * Needs a database (the context has to start), so:
 *   mvn test -Dgroups=requires-db
 */
@SpringBootTest
@AutoConfigureMockMvc
@Tag("requires-db")
class SecurityAuthorizationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void healthEndpointIsPublic() throws Exception {
        mockMvc.perform(get("/api/test/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.application").value("InternshipJP"));
    }

    @Test
    void internshipListIsPublic() throws Exception {
        mockMvc.perform(get("/api/internships"))
                .andExpect(status().isOk());
    }

    @Test
    void accountEndpointRejectsAnonymousCallers() throws Exception {
        mockMvc.perform(get("/api/account/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Unauthorized"));
    }

    @Test
    @WithMockUser(roles = "STUDENT")
    void studentCannotReachAdminArea() throws Exception {
        mockMvc.perform(get("/api/admin/users"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error").value("Forbidden"));
    }

    @Test
    @WithMockUser(roles = "EMPLOYER")
    void employerCannotReachStudentArea() throws Exception {
        mockMvc.perform(get("/api/students/me"))
                .andExpect(status().isForbidden());
    }
}
