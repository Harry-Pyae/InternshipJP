package com.internshipjp.backend.security;

import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.hamcrest.Matchers.endsWith;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
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

    /**
     * The backup is the whole database in one file, password hashes included.
     * It is under /api/admin, so the rule already covers it - this is here so
     * that a future change to the path is caught by a test rather than by
     * somebody downloading the platform.
     */
    @Test
    @WithMockUser(roles = "EMPLOYER")
    void employerCannotDownloadTheDatabase() throws Exception {
        mockMvc.perform(get("/api/admin/data/export"))
                .andExpect(status().isForbidden());
    }

    @Test
    void anonymousCallerCannotDownloadTheDatabase() throws Exception {
        mockMvc.perform(get("/api/admin/data/export"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(roles = "STUDENT")
    void studentCannotCompactTheDatabase() throws Exception {
        mockMvc.perform(get("/api/admin/data/compaction"))
                .andExpect(status().isForbidden());
    }

    /**
     * And an administrator really gets a file. The header is what makes the
     * browser save it rather than render a megabyte of JSON in a tab, and it
     * is the only place the filename is decided.
     */
    @Test
    @WithMockUser(roles = "ADMIN")
    void administratorGetsTheBackupAsAnAttachment() throws Exception {
        mockMvc.perform(get("/api/admin/data/export"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition",
                        startsWith("attachment; filename=\"internshipjp-backup-")))
                .andExpect(header().string("Content-Disposition", endsWith(".json\"")))
                .andExpect(jsonPath("$.application").value("InternshipJP"))
                .andExpect(jsonPath("$.tables").exists());
    }

    /** The preview counts, and says out loud that it changed nothing. */
    @Test
    @WithMockUser(roles = "ADMIN")
    void administratorCanPreviewACompaction() throws Exception {
        mockMvc.perform(get("/api/admin/data/compaction?days=90"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.applied").value(false))
                .andExpect(jsonPath("$.retentionDays").value(90));
    }

    /** Below the floor the service refuses, rather than emptying the reports. */
    @Test
    @WithMockUser(roles = "ADMIN")
    void aRetentionWindowUnderAMonthIsRefused() throws Exception {
        mockMvc.perform(get("/api/admin/data/compaction?days=1"))
                .andExpect(status().isBadRequest());
    }
}
