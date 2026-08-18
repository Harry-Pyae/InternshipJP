package com.internshipjp.backend.integration;

import com.internshipjp.backend.entity.AccountStatus;
import com.internshipjp.backend.entity.ApprovalStatus;
import com.internshipjp.backend.entity.Company;
import com.internshipjp.backend.entity.EmployerProfile;
import com.internshipjp.backend.entity.Internship;
import com.internshipjp.backend.entity.InternshipStatus;
import com.internshipjp.backend.entity.Role;
import com.internshipjp.backend.entity.User;
import com.internshipjp.backend.entity.WorkMode;
import com.internshipjp.backend.repository.CompanyRepository;
import com.internshipjp.backend.repository.EmployerProfileRepository;
import com.internshipjp.backend.repository.InternshipRepository;
import com.internshipjp.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * The whole student journey, through the real HTTP layer.
 *
 * register -> sign in -> edit profile -> add a skill -> apply -> try to apply
 * again -> read the application history -> sign out
 *
 * WHY THIS TEST EARNS ITS KEEP
 *   Every other test checks one class. This one checks that the pieces fit:
 *   security config, CSRF, sessions, validation, the service rules and the
 *   database constraints, in the order a real user hits them. It is the test
 *   most likely to catch a change that "works on my machine".
 *
 * WHAT IT NEEDS
 *   A running MariaDB with internshipjp_db, so it is tagged "requires-db":
 *
 *       mvn test -Dgroups=requires-db
 *
 * WHY IT DOES NOT POLLUTE YOUR DATABASE
 *   @Transactional rolls the whole test back afterwards, so running it does not
 *   leave test students and companies behind for the next person.
 *
 * Owner: Member 1 (integration and end-to-end testing).
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@Tag("requires-db")
class EndToEndFlowTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private CompanyRepository companyRepository;
    @Autowired
    private EmployerProfileRepository employerProfileRepository;
    @Autowired
    private InternshipRepository internshipRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;

    private String studentEmail;
    private Long openInternshipId;
    private MockHttpSession session;

    @BeforeEach
    void setUp() {
        // A fresh email per run, so a failed rollback cannot break the next run.
        studentEmail = "e2e-" + UUID.randomUUID().toString().substring(0, 8) + "@test.local";
        session = new MockHttpSession();
        openInternshipId = seedOpenInternship();
    }

    /**
     * Creates an approved company with one open vacancy, directly through the
     * repositories. Going through the employer API would mean also creating an
     * administrator to approve the company - that belongs in its own test.
     */
    private Long seedOpenInternship() {
        User employer = new User();
        employer.setEmail("e2e-employer-" + UUID.randomUUID().toString().substring(0, 8) + "@test.local");
        employer.setPasswordHash(passwordEncoder.encode("password123"));
        employer.setFullName("E2E Employer");
        employer.setRole(Role.EMPLOYER);
        employer.setAccountStatus(AccountStatus.ACTIVE);
        employer = userRepository.save(employer);

        Company company = new Company();
        company.setName("E2E Test Company");
        company.setApprovalStatus(ApprovalStatus.APPROVED);
        company = companyRepository.save(company);

        EmployerProfile profile = new EmployerProfile();
        profile.setUser(employer);
        profile.setCompany(company);
        employerProfileRepository.save(profile);

        Internship internship = new Internship();
        internship.setCompany(company);
        internship.setCreatedBy(employer.getId());
        internship.setTitle("E2E Backend Intern");
        internship.setDescription("Seeded by EndToEndFlowTest.");
        internship.setWorkMode(WorkMode.HYBRID);
        internship.setStatus(InternshipStatus.OPEN);
        internship.setAvailablePositions(2);
        return internshipRepository.save(internship).getId();
    }

    private String json(String body) {
        return body;
    }

    @Test
    void aStudentCanRegisterSignInApplyAndSeeTheirApplication() throws Exception {
        // 1. Register. The response must never echo the password back.
        mockMvc.perform(post("/api/auth/register/student").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json("{\"email\":\"" + studentEmail + "\","
                                + "\"password\":\"password123\","
                                + "\"fullName\":\"E2E Student\","
                                + "\"university\":\"Test University\"}")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value(studentEmail))
                .andExpect(jsonPath("$.role").value("STUDENT"))
                .andExpect(jsonPath("$.accountStatus").value("ACTIVE"))
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.passwordHash").doesNotExist());

        // 2. The same email twice is a conflict, not a second account.
        mockMvc.perform(post("/api/auth/register/student").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json("{\"email\":\"" + studentEmail + "\","
                                + "\"password\":\"password123\",\"fullName\":\"Impostor\"}")))
                .andExpect(status().isConflict());

        // 3. Before signing in, protected endpoints must refuse.
        mockMvc.perform(get("/api/students/me"))
                .andExpect(status().isUnauthorized());

        // 4. Sign in. Everything after this reuses the same session.
        mockMvc.perform(post("/api/auth/login").with(csrf()).session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json("{\"email\":\"" + studentEmail + "\",\"password\":\"password123\"}")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("STUDENT"));

        // 5. The session really carries over to the next request.
        mockMvc.perform(get("/api/auth/me").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(studentEmail));

        // 6. Registration created the profile in the same transaction.
        mockMvc.perform(get("/api/students/me").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.university").value("Test University"));

        // 7. Add a skill, then prove the duplicate rule works.
        mockMvc.perform(post("/api/students/me/skills").with(csrf()).session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json("{\"name\":\"Java\",\"skillType\":\"TECHNICAL\","
                                + "\"proficiency\":\"INTERMEDIATE\"}")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Java"));

        mockMvc.perform(post("/api/students/me/skills").with(csrf()).session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json("{\"name\":\"Java\",\"skillType\":\"TECHNICAL\"}")))
                .andExpect(status().isConflict());

        // 8. Apply to the open internship.
        mockMvc.perform(post("/api/internships/" + openInternshipId + "/applications")
                        .with(csrf()).session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json("{\"coverLetter\":\"I would like to apply.\"}")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("APPLIED"))
                .andExpect(jsonPath("$.internshipId").value(openInternshipId));

        // 9. The rule that matters: one student, one application per vacancy.
        mockMvc.perform(post("/api/internships/" + openInternshipId + "/applications")
                        .with(csrf()).session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json("{\"coverLetter\":\"Trying again.\"}")))
                .andExpect(status().isConflict());

        // 10. It appears in the student's own history.
        mockMvc.perform(get("/api/student/applications").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.content[0].internshipTitle").value("E2E Backend Intern"))
                .andExpect(jsonPath("$.content[0].companyName").value("E2E Test Company"));

        // 11. Recommendations work with no AI key configured at all.
        mockMvc.perform(get("/api/ai/recommendations").session(session))
                .andExpect(status().isOk());

        // 12. Signing out really ends the session.
        mockMvc.perform(post("/api/auth/logout").with(csrf()).session(session))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/students/me").session(session))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void aStudentCannotApplyToAnInternshipThatIsNotOpen() throws Exception {
        Internship draft = internshipRepository.findById(openInternshipId).orElseThrow();
        draft.setStatus(InternshipStatus.DRAFT);
        internshipRepository.save(draft);

        mockMvc.perform(post("/api/auth/register/student").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json("{\"email\":\"" + studentEmail + "\","
                                + "\"password\":\"password123\",\"fullName\":\"E2E Student\"}")))
                .andExpect(status().isCreated());
        mockMvc.perform(post("/api/auth/login").with(csrf()).session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json("{\"email\":\"" + studentEmail + "\",\"password\":\"password123\"}")))
                .andExpect(status().isOk());

        // A draft is invisible to students...
        mockMvc.perform(get("/api/internships/" + openInternshipId))
                .andExpect(status().isNotFound());

        // ...and cannot be applied to even if the id is guessed.
        mockMvc.perform(post("/api/internships/" + openInternshipId + "/applications")
                        .with(csrf()).session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json("{\"coverLetter\":\"Please.\"}")))
                .andExpect(status().isBadRequest());
    }

    @Test
    void writeRequestsAreRejectedWithoutACsrfToken() throws Exception {
        // Same request as step 1, minus .with(csrf()). This is the test that
        // proves CSRF protection is actually on - it would pass silently if
        // someone "fixed" a 403 by calling csrf().disable().
        mockMvc.perform(post("/api/auth/register/student")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json("{\"email\":\"" + studentEmail + "\","
                                + "\"password\":\"password123\",\"fullName\":\"E2E Student\"}")))
                .andExpect(status().isForbidden());
    }

    @Test
    void validationFailuresReturnFieldLevelMessages() throws Exception {
        mockMvc.perform(post("/api/auth/register/student").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json("{\"email\":\"not-an-email\",\"password\":\"short\",\"fullName\":\"\"}")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Validation Error"))
                .andExpect(jsonPath("$.fieldErrors.email").exists())
                .andExpect(jsonPath("$.fieldErrors.password").exists())
                .andExpect(jsonPath("$.fieldErrors.fullName").exists())
                .andExpect(jsonPath("$.path").value("/api/auth/register/student"));
    }
}
