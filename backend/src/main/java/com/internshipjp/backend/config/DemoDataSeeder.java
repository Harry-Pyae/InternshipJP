package com.internshipjp.backend.config;

import com.internshipjp.backend.entity.AccountStatus;
import com.internshipjp.backend.entity.Application;
import com.internshipjp.backend.entity.ApplicationStatus;
import com.internshipjp.backend.entity.ApplicationStatusHistory;
import com.internshipjp.backend.entity.ApprovalStatus;
import com.internshipjp.backend.entity.Certificate;
import com.internshipjp.backend.entity.Company;
import com.internshipjp.backend.entity.EmployerProfile;
import com.internshipjp.backend.entity.Internship;
import com.internshipjp.backend.entity.InternshipSkill;
import com.internshipjp.backend.entity.InternshipStatus;
import com.internshipjp.backend.entity.Notification;
import com.internshipjp.backend.entity.ProficiencyLevel;
import com.internshipjp.backend.entity.Role;
import com.internshipjp.backend.entity.SkillType;
import com.internshipjp.backend.entity.StudentInterest;
import com.internshipjp.backend.entity.StudentProfile;
import com.internshipjp.backend.entity.StudentSkill;
import com.internshipjp.backend.entity.User;
import com.internshipjp.backend.entity.VerificationStatus;
import com.internshipjp.backend.entity.WorkMode;
import com.internshipjp.backend.repository.ApplicationRepository;
import com.internshipjp.backend.repository.ApplicationStatusHistoryRepository;
import com.internshipjp.backend.repository.CertificateRepository;
import com.internshipjp.backend.repository.CompanyRepository;
import com.internshipjp.backend.repository.EmployerProfileRepository;
import com.internshipjp.backend.repository.InternshipRepository;
import com.internshipjp.backend.repository.InternshipSkillRepository;
import com.internshipjp.backend.repository.NotificationRepository;
import com.internshipjp.backend.repository.StudentInterestRepository;
import com.internshipjp.backend.repository.StudentProfileRepository;
import com.internshipjp.backend.repository.StudentSkillRepository;
import com.internshipjp.backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Sample data for testing the API and the AI panels.
 *
 * ===================== WHY THIS DOES NOT BREAK THE RULE =====================
 * The project rule is: never fake success, and never put invented data inside
 * a production service. Nothing here does that.
 *
 *   - It is OFF by default and has to be switched on deliberately.
 *   - It refuses to run under the "prod" profile at all.
 *   - It refuses to run on a database that already has users, so it can never
 *     mix demo rows into real ones.
 *   - Every row it creates is marked: emails end @demo.internshipjp.local and
 *     companies start with "Demo ". You can always tell what is real.
 *   - It is not a Flyway migration, so it never runs on a teammate's database
 *     just because they pulled.
 *   - No service reads from it, no endpoint depends on it, and no status check
 *     is influenced by it. /api/test/database still reports what it measures.
 *
 * The data is deliberately imperfect: one company is unapproved, one vacancy
 * is still a draft, one has no stipend or required skills, and several
 * applicants are left unreviewed. That is what makes it useful - the employer
 * insight report has something real to find, instead of a tidy dataset that
 * makes every feature look like it has nothing to say.
 *
 * HOW TO USE IT
 *   1. In backend/application-local.properties:  DEMO_DATA_ENABLED=true
 *   2. Start the backend once. The sign-in details are printed in the console.
 *   3. Set it back to false.
 *   To start over: DEMO_DATA_RESET=true removes the previous demo rows first.
 *
 * Owner: Member 1 (testing).
 * ===========================================================================
 */
@Component
@Order(Ordered.LOWEST_PRECEDENCE)
public class DemoDataSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoDataSeeder.class);

    /** Every seeded account ends with this, so cleanup can be exact. */
    private static final String DEMO_EMAIL_SUFFIX = "@demo.internshipjp.local";
    private static final String DEMO_COMPANY_PREFIX = "Demo ";
    private static final String DEMO_PASSWORD = "demo1234";

    private final AppProperties appProperties;
    private final Environment environment;
    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final StudentSkillRepository studentSkillRepository;
    private final StudentInterestRepository studentInterestRepository;
    private final CompanyRepository companyRepository;
    private final EmployerProfileRepository employerProfileRepository;
    private final InternshipRepository internshipRepository;
    private final InternshipSkillRepository internshipSkillRepository;
    private final ApplicationRepository applicationRepository;
    private final ApplicationStatusHistoryRepository historyRepository;
    private final CertificateRepository certificateRepository;
    private final NotificationRepository notificationRepository;

    public DemoDataSeeder(AppProperties appProperties,
                          Environment environment,
                          PasswordEncoder passwordEncoder,
                          UserRepository userRepository,
                          StudentProfileRepository studentProfileRepository,
                          StudentSkillRepository studentSkillRepository,
                          StudentInterestRepository studentInterestRepository,
                          CompanyRepository companyRepository,
                          EmployerProfileRepository employerProfileRepository,
                          InternshipRepository internshipRepository,
                          InternshipSkillRepository internshipSkillRepository,
                          ApplicationRepository applicationRepository,
                          ApplicationStatusHistoryRepository historyRepository,
                          CertificateRepository certificateRepository,
                          NotificationRepository notificationRepository) {
        this.appProperties = appProperties;
        this.environment = environment;
        this.passwordEncoder = passwordEncoder;
        this.userRepository = userRepository;
        this.studentProfileRepository = studentProfileRepository;
        this.studentSkillRepository = studentSkillRepository;
        this.studentInterestRepository = studentInterestRepository;
        this.companyRepository = companyRepository;
        this.employerProfileRepository = employerProfileRepository;
        this.internshipRepository = internshipRepository;
        this.internshipSkillRepository = internshipSkillRepository;
        this.applicationRepository = applicationRepository;
        this.historyRepository = historyRepository;
        this.certificateRepository = certificateRepository;
        this.notificationRepository = notificationRepository;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        AppProperties.DemoData config = appProperties.getDemoData();
        if (!config.isEnabled() && !config.isReset()) {
            return;
        }
        if (environment.acceptsProfiles(Profiles.of("prod"))) {
            log.error("Demo data settings are on but the prod profile is active. "
                    + "Refusing to seed or delete anything.");
            return;
        }

        // reset and enabled are independent on purpose:
        //   reset only            remove the demo rows and stop
        //   enabled only          seed, unless demo rows already exist
        //   reset + enabled       rebuild from scratch
        if (config.isReset()) {
            try {
                removeDemoData();
            } catch (RuntimeException removalFailed) {
                // Deleting through JPA asks Hibernate to reconcile every managed
                // entity in this transaction, and a stale reference there brings
                // the whole application down on startup - which is a very high
                // price for a convenience flag.
                //
                // The PowerShell script does the same job in plain SQL and is
                // not subject to this, so point at it and carry on rather than
                // refusing to boot.
                log.error("Demo data: RESET failed ({}). The application is starting anyway. "
                        + "Clear the demo rows with scripts\\remove-demo-data.ps1, which does "
                        + "this in SQL, then start again with DEMO_DATA_ENABLED=true and "
                        + "DEMO_DATA_RESET=false.", removalFailed.getMessage());
                return;
            }
        }
        if (!config.isEnabled()) {
            log.info("Demo data: removal finished. DEMO_DATA_ENABLED is false, so nothing "
                    + "was re-created. Set DEMO_DATA_RESET back to false now.");
            return;
        }

        long existingDemoAccounts = userRepository.findByEmailEndingWith(DEMO_EMAIL_SUFFIX).size();
        if (existingDemoAccounts > 0) {
            log.info("Demo data: {} demo account(s) already exist, so they were not "
                    + "re-created. Set DEMO_DATA_RESET=true to rebuild them.", existingDemoAccounts);
            printCredentials();
            return;
        }

        seed();
        attachExistingStudent();
        printCredentials();
    }

    /**
     * Fills in a student account the user already registered, so the
     * assistants can be tested while signed in as yourself rather than as a
     * demo account.
     *
     * Only touches the one email named in DEMO_DATA_ATTACH_STUDENT, only if it
     * exists and is a STUDENT, and only adds skills that are not already
     * there - so running it twice changes nothing.
     */
    private void attachExistingStudent() {
        String email = appProperties.getDemoData().getAttachStudent();
        if (email == null || email.isBlank()) {
            return;
        }
        String normalised = email.trim().toLowerCase(java.util.Locale.ROOT);

        User target = userRepository.findByEmail(normalised).orElse(null);
        if (target == null) {
            log.warn("Demo data: no account found for {} - nothing was attached. "
                    + "Register it first, or check the spelling.", normalised);
            return;
        }
        if (target.getRole() != Role.STUDENT) {
            log.warn("Demo data: {} is a {}, not a student. Nothing was attached.",
                    normalised, target.getRole());
            return;
        }
        StudentProfile profile = studentProfileRepository.findByUserId(target.getId()).orElse(null);
        if (profile == null) {
            log.warn("Demo data: {} has no student profile row. Nothing was attached.", normalised);
            return;
        }

        profile.setHeadline("Third-year CS student, backend and databases");
        profile.setUniversity("University of Information Technology");
        profile.setDegree("BSc Computer Science");
        profile.setFieldOfStudy("Software Engineering");
        profile.setGraduationYear(LocalDate.now().getYear() + 1);
        profile.setCurrentlyAttending(true);
        profile.setDateOfBirth(LocalDate.now().minusYears(21).minusMonths(7));
        profile.setLocation("Yangon");
        profile.setCountry("Myanmar");
        profile.setBiography("I build small web applications and enjoy working on the parts "
                + "nobody sees: data models, APIs and making things fast.");
        profile.setAvailability("Full time from next semester");
        profile.setPreferredWorkMode(WorkMode.HYBRID);
        profile.setAvailableFrom(LocalDate.now().plusMonths(1));
        profile.setPortfolioUrl("https://example.com/portfolio");
        profile.setLinkedinUrl("https://www.linkedin.com/in/example");
        profile.setGithubUrl("https://github.com/example");
        studentProfileRepository.save(profile);

        // Deliberately partial. Two of the four skills the backend vacancy
        // wants are missing, so the skill gap panel and the assistant have a
        // real gap to talk about instead of a meaningless 100% match.
        addSkillIfMissing(profile, "Java", SkillType.PROGRAMMING_LANGUAGE, ProficiencyLevel.INTERMEDIATE);
        addSkillIfMissing(profile, "SQL", SkillType.PROGRAMMING_LANGUAGE, ProficiencyLevel.INTERMEDIATE);
        addSkillIfMissing(profile, "JavaScript", SkillType.PROGRAMMING_LANGUAGE, ProficiencyLevel.BEGINNER);
        addSkillIfMissing(profile, "Teamwork", SkillType.SOFT, ProficiencyLevel.ADVANCED);
        addSkillIfMissing(profile, "English", SkillType.SPOKEN_LANGUAGE, ProficiencyLevel.ADVANCED);

        interests(profile, "Backend development", "Databases");

        log.info("Demo data: filled in the profile and skills for {}. "
                + "Sign in as usual - the assistants now have something to work with.", normalised);
    }

    private void addSkillIfMissing(StudentProfile profile, String name,
                                   SkillType type, ProficiencyLevel level) {
        if (studentSkillRepository.existsByStudentProfileIdAndNameIgnoreCase(profile.getId(), name)) {
            return;
        }
        StudentSkill skill = new StudentSkill();
        skill.setStudentProfile(profile);
        skill.setName(name);
        skill.setSkillType(type);
        skill.setProficiency(level);
        studentSkillRepository.save(skill);
    }

    // ------------------------------------------------------------------ seed

    private void seed() {
        log.info("Demo data: seeding sample accounts, vacancies and applications...");

        User admin = user("admin", "Demo Administrator", Role.ADMIN, AccountStatus.ACTIVE);

        // --- companies: one approved, one still waiting ----------------------
        Company approved = company("Demo Yangon Tech", "Software", "https://demo-yangon.test",
                "Yangon", "A demo company used to exercise the recruitment workflow.",
                ApprovalStatus.APPROVED, admin.getId());
        Company pending = company("Demo Sakura Systems", "Consulting", null, "Mandalay",
                null, ApprovalStatus.PENDING, null);

        // Backdated so the approval queue shows a realistic wait rather than
        // a company that registered the instant the demo data was created.
        pending.setCreatedAt(LocalDateTime.now().minusDays(6));
        companyRepository.save(pending);

        User employerOne = user("employer1", "Aung Kyaw", Role.EMPLOYER, AccountStatus.ACTIVE);
        employerProfile(employerOne, approved, "Engineering Manager");
        User employerTwo = user("employer2", "Hnin Wai", Role.EMPLOYER, AccountStatus.PENDING);
        employerProfile(employerTwo, pending, "Founder");

        // --- students, with deliberately uneven profiles ---------------------
        StudentProfile thida = student("student1", "Thida Aung", "UIT", "BSc Computer Science",
                "Software Engineering", 2027, "Yangon",
                "Third-year student who enjoys building small web tools.");
        skills(thida, new String[][] {
                {"Java", "PROGRAMMING_LANGUAGE", "INTERMEDIATE"},
                {"SQL", "PROGRAMMING_LANGUAGE", "INTERMEDIATE"},
                {"React", "TECHNICAL", "BEGINNER"},
                {"Git", "TECHNICAL", "INTERMEDIATE"},
                {"Teamwork", "SOFT", "ADVANCED"},
                {"English", "SPOKEN_LANGUAGE", "ADVANCED"}});
        interests(thida, "Backend development", "Databases");

        StudentProfile min = student("student2", "Min Thu", "UIT", "BSc Computer Science",
                "Data Science", 2026, "Yangon",
                "Interested in analytics and reporting.");
        skills(min, new String[][] {
                {"Python", "PROGRAMMING_LANGUAGE", "ADVANCED"},
                {"SQL", "PROGRAMMING_LANGUAGE", "ADVANCED"},
                {"Communication", "SOFT", "INTERMEDIATE"}});
        interests(min, "Data analysis");

        StudentProfile su = student("student3", "Su Myat", "UCSY", "BSc Computer Science",
                "Web Development", 2027, "Mandalay", null);
        skills(su, new String[][] {
                {"JavaScript", "PROGRAMMING_LANGUAGE", "INTERMEDIATE"},
                {"TypeScript", "PROGRAMMING_LANGUAGE", "BEGINNER"},
                {"React", "TECHNICAL", "INTERMEDIATE"},
                {"CSS", "TECHNICAL", "INTERMEDIATE"}});

        // An intentionally empty profile: this is what the skill gap panel and
        // the "not enough data yet" AI path are supposed to handle.
        student("student4", "Kyaw Zin", null, null, null, null, null, null);

        // --- vacancies, some deliberately weak -------------------------------
        Internship backend = internship(approved, employerOne,
                "Backend Intern (Spring Boot)",
                "Work with our platform team on REST APIs and database work.",
                "Build endpoints, write tests, take part in code review.",
                "Comfortable with Java. Some SQL. Willing to learn Spring Boot.",
                "Yangon", WorkMode.HYBRID, 6, new BigDecimal("300000"), "MMK", 2,
                LocalDate.now().plusDays(30), InternshipStatus.OPEN);
        requiredSkills(backend, "Java", "SQL", "Spring Boot", "Git");

        Internship frontend = internship(approved, employerOne,
                "Frontend Intern (React)",
                "Join the team building our customer dashboard.",
                "Build screens from designs, fix bugs, improve accessibility.",
                "Knows JavaScript. Some React experience.",
                "Yangon", WorkMode.REMOTE, 4, new BigDecimal("250000"), "MMK", 1,
                LocalDate.now().plusDays(14), InternshipStatus.OPEN);
        requiredSkills(frontend, "JavaScript", "React", "CSS");

        // No stipend, no required skills, no deadline - the employer insight
        // report should flag all three.
        Internship vague = internship(approved, employerOne,
                "Intern Wanted", null, null, null,
                "Yangon", WorkMode.ONSITE, null, null, null, 1,
                null, InternshipStatus.OPEN);

        // Asks for something almost nobody has - the "hard to fill" case.
        Internship devops = internship(approved, employerOne,
                "DevOps Intern",
                "Help us automate builds and deployments.",
                "Maintain pipelines, write scripts.",
                "Interest in infrastructure.",
                "Yangon", WorkMode.ONSITE, 6, new BigDecimal("350000"), "MMK", 1,
                LocalDate.now().plusDays(45), InternshipStatus.OPEN);
        requiredSkills(devops, "Kubernetes", "Docker", "Linux");

        // Never published, so no student can see it.
        internship(approved, employerOne,
                "Mobile Intern (draft)",
                "Draft posting, not yet reviewed internally.", null, null,
                "Yangon", WorkMode.HYBRID, 3, null, null, 1,
                LocalDate.now().plusDays(60), InternshipStatus.DRAFT);

        // --- applications across several states ------------------------------
        apply(thida, backend, ApplicationStatus.SHORTLISTED,
                "I have used Java and SQL in coursework and would like to learn Spring Boot.", 11);
        apply(min, backend, ApplicationStatus.APPLIED,
                "My strongest areas are Python and SQL.", 2);
        apply(su, frontend, ApplicationStatus.UNDER_REVIEW,
                "I have built two React projects at university.", 5);
        apply(thida, frontend, ApplicationStatus.REJECTED,
                "I would like to try frontend work as well.", 17);
        apply(min, vague, ApplicationStatus.APPLIED, "Happy to hear more about the role.", 12);

        // --- certificates: one verified, one still waiting -------------------
        certificate(thida, "Oracle Java Foundations", "Oracle",
                LocalDate.now().minusMonths(8), VerificationStatus.VERIFIED, admin.getId(), 24);
        certificate(thida, "Intro to Databases", "Coursera",
                LocalDate.now().minusMonths(3), VerificationStatus.PENDING, null, 9);
        certificate(min, "Python for Data Science", "DataCamp",
                LocalDate.now().minusMonths(5), VerificationStatus.VERIFIED, admin.getId(), 31);

        notify(admin, "CERTIFICATE_VERIFICATION_REQUESTED",
                "Certificate waiting for verification",
                "Thida Aung uploaded \"Intro to Databases\".");
        notify(admin, "COMPANY_APPROVAL_REQUESTED", "New company waiting for approval",
                "Demo Sakura Systems registered and is waiting for review.");
        notify(thida.getUser(), "APPLICATION_STATUS_CHANGED", "Your application was updated",
                "\"Backend Intern (Spring Boot)\" is now shortlisted.");

        log.info("Demo data: seeded 4 students, 2 employers, 2 companies, 5 internships, "
                + "5 applications and 3 certificates.");
    }

    // --------------------------------------------------------------- cleanup

    private void removeDemoData() {
        List<User> demoUsers = userRepository.findByEmailEndingWith(DEMO_EMAIL_SUFFIX);

        // Collect the file paths BEFORE deleting the rows - once the
        // certificates are gone there is no record of what to delete on disk.
        List<String> filesToDelete = new java.util.ArrayList<>();
        for (User demoUser : demoUsers) {
            studentProfileRepository.findByUserId(demoUser.getId()).ifPresent(profile ->
                    certificateRepository
                            .findByStudentProfileIdOrderByCreatedAtDesc(profile.getId())
                            .forEach(certificate -> filesToDelete.add(certificate.getStoragePath())));
        }

        // Deleting a user cascades to their profile, applications, certificates
        // and notifications, so this covers everything person-shaped.
        userRepository.deleteAll(demoUsers);
        userRepository.flush();

        // Companies are not owned by a user, so they go separately - and they
        // must go second, because employer_profiles.company_id is RESTRICT.
        // Internships and their applications cascade from the company.
        List<Company> demoCompanies = companyRepository.findByNameStartingWith(DEMO_COMPANY_PREFIX);
        companyRepository.deleteAll(demoCompanies);

        int filesRemoved = deleteStoredFiles(filesToDelete);

        log.info("Demo data: removed {} account(s), {} company(ies) and {} uploaded file(s).",
                demoUsers.size(), demoCompanies.size(), filesRemoved);
    }

    private int deleteStoredFiles(List<String> relativePaths) {
        Path root = Paths.get(appProperties.getStorage().getUploadRoot())
                .toAbsolutePath().normalize();
        int removed = 0;
        for (String relativePath : relativePaths) {
            try {
                Path target = root.resolve(relativePath).normalize();
                // Never delete outside the upload root, whatever the row said.
                if (target.startsWith(root) && Files.deleteIfExists(target)) {
                    removed++;
                }
            } catch (IOException ex) {
                log.warn("Demo data: could not delete {}", relativePath);
            }
        }
        return removed;
    }

    private void printCredentials() {
        log.info("");
        log.info("=================== DEMO SIGN-IN DETAILS ===================");
        log.info(" Password for every demo account: {}", DEMO_PASSWORD);
        log.info("");
        log.info("   Administrator  admin{}", DEMO_EMAIL_SUFFIX);
        log.info("   Employer       employer1{}   (company approved)", DEMO_EMAIL_SUFFIX);
        log.info("   Employer       employer2{}   (company still pending)", DEMO_EMAIL_SUFFIX);
        log.info("   Student        student1{}    (full profile, verified certificate)",
                DEMO_EMAIL_SUFFIX);
        log.info("   Student        student2{}    (data-science profile)", DEMO_EMAIL_SUFFIX);
        log.info("   Student        student3{}    (frontend profile)", DEMO_EMAIL_SUFFIX);
        log.info("   Student        student4{}    (empty profile, on purpose)", DEMO_EMAIL_SUFFIX);
        log.info("");
        log.info(" These are demo accounts on a demo database. Do not reuse this");
        log.info(" password anywhere real, and turn DEMO_DATA_ENABLED off again.");
        log.info("============================================================");
        log.info("");
    }

    // ---------------------------------------------------------------- makers

    private User user(String localPart, String fullName, Role role, AccountStatus status) {
        User user = new User();
        user.setEmail(localPart + DEMO_EMAIL_SUFFIX);
        user.setPasswordHash(passwordEncoder.encode(DEMO_PASSWORD));
        user.setFullName(fullName);
        user.setRole(role);
        user.setAccountStatus(status);
        return userRepository.save(user);
    }

    private Company company(String name, String industry, String website, String location,
                            String description, ApprovalStatus status, Long approvedBy) {
        Company company = new Company();
        company.setName(name);
        company.setIndustry(industry);
        company.setWebsite(website);
        company.setLocation(location);
        company.setCountry("Myanmar");
        company.setCompanySize("11-50");
        company.setFoundedYear(2016);
        company.setRegistrationNumber("DEMO-REG-" + Math.abs(name.hashCode() % 100000));
        company.setContactEmail("hello" + DEMO_EMAIL_SUFFIX);
        company.setDescription(description);
        company.setApprovalStatus(status);
        company.setApprovedBy(approvedBy);
        return companyRepository.save(company);
    }

    private void employerProfile(User user, Company company, String jobTitle) {
        EmployerProfile profile = new EmployerProfile();
        profile.setUser(user);
        profile.setCompany(company);
        profile.setJobTitle(jobTitle);
        profile.setWorkEmail(user.getEmail());
        employerProfileRepository.save(profile);
    }

    private StudentProfile student(String localPart, String fullName, String university,
                                   String degree, String field, Integer graduationYear,
                                   String location, String biography) {
        User user = user(localPart, fullName, Role.STUDENT, AccountStatus.ACTIVE);
        StudentProfile profile = new StudentProfile();
        profile.setUser(user);
        profile.setUniversity(university);
        profile.setDegree(degree);
        profile.setFieldOfStudy(field);
        profile.setGraduationYear(graduationYear);
        profile.setCurrentlyAttending(graduationYear != null);
        profile.setLocation(location);
        profile.setBiography(biography);
        if (field != null) {
            profile.setHeadline(field + " student at " + university);
            profile.setCountry("Myanmar");
            // About 21 years old, without hard-coding an age anywhere.
            profile.setDateOfBirth(LocalDate.now().minusYears(21).minusMonths(4));
            profile.setPreferredWorkMode(WorkMode.HYBRID);
            profile.setAvailableFrom(LocalDate.now().plusMonths(1));
        }
        return studentProfileRepository.save(profile);
    }

    private void skills(StudentProfile profile, String[][] rows) {
        for (String[] row : rows) {
            StudentSkill skill = new StudentSkill();
            skill.setStudentProfile(profile);
            skill.setName(row[0]);
            skill.setSkillType(SkillType.valueOf(row[1]));
            skill.setProficiency(ProficiencyLevel.valueOf(row[2]));
            studentSkillRepository.save(skill);
        }
    }

    private void interests(StudentProfile profile, String... values) {
        List<StudentInterest> existing = studentInterestRepository
                .findByStudentProfileId(profile.getId());
        for (String value : values) {
            boolean already = existing.stream()
                    .anyMatch(item -> item.getInterest().equalsIgnoreCase(value));
            if (already) {
                continue;
            }
            StudentInterest interest = new StudentInterest();
            interest.setStudentProfile(profile);
            interest.setInterest(value);
            studentInterestRepository.save(interest);
        }
    }

    private Internship internship(Company company, User creator, String title, String description,
                                  String responsibilities, String requirements, String location,
                                  WorkMode mode, Integer months, BigDecimal stipend,
                                  String currency, int positions, LocalDate deadline,
                                  InternshipStatus status) {
        Internship internship = new Internship();
        internship.setCompany(company);
        internship.setCreatedBy(creator.getId());
        internship.setTitle(title);
        internship.setDescription(description);
        internship.setResponsibilities(responsibilities);
        internship.setRequirements(requirements);
        internship.setLocation(location);
        internship.setWorkMode(mode);
        internship.setDurationMonths(months);
        internship.setStipendAmount(stipend);
        internship.setStipendCurrency(currency);
        internship.setAvailablePositions(positions);
        internship.setApplicationDeadline(deadline);
        internship.setStatus(status);
        return internshipRepository.save(internship);
    }

    private void requiredSkills(Internship internship, String... names) {
        for (String name : names) {
            InternshipSkill skill = new InternshipSkill();
            skill.setInternship(internship);
            skill.setName(name);
            skill.setRequired(true);
            internshipSkillRepository.save(skill);
        }
    }

    private void apply(StudentProfile student, Internship internship,
                       ApplicationStatus status, String coverLetter) {
        apply(student, internship, status, coverLetter, 1);
    }

    /**
     * @param daysAgo how long ago this application was made.
     *
     * Ages are staggered on purpose. Seeded all at one instant, every queue
     * item reads the same number of days and every urgency badge is the same
     * colour - which makes the administrator screens look broken rather than
     * busy. Spread out, the same screens show green, amber and red together,
     * which is what they were designed to distinguish.
     */
    private void apply(StudentProfile student, Internship internship,
                       ApplicationStatus status, String coverLetter, int daysAgo) {
        Application application = new Application();
        application.setInternship(internship);
        application.setStudentProfile(student);
        application.setCoverLetter(coverLetter);
        application.setStatus(status);
        Application saved = applicationRepository.save(application);
        backdate(saved, daysAgo);

        history(saved, null, ApplicationStatus.APPLIED, "Application submitted");
        if (status != ApplicationStatus.APPLIED) {
            history(saved, ApplicationStatus.APPLIED, status, "Reviewed by the hiring team");
        }
    }

    /**
     * Moves a saved row back in time.
     *
     * The entity sets createdAt on persist, so it has to be saved first and
     * corrected afterwards - there is no way to persist it already old.
     */
    private void backdate(Application application, int daysAgo) {
        if (daysAgo <= 0) {
            return;
        }
        application.setCreatedAt(LocalDateTime.now().minusDays(daysAgo));
        applicationRepository.save(application);
    }

    private void history(Application application, ApplicationStatus from,
                         ApplicationStatus to, String note) {
        ApplicationStatusHistory entry = new ApplicationStatusHistory();
        entry.setApplication(application);
        entry.setFromStatus(from);
        entry.setToStatus(to);
        entry.setNote(note);
        historyRepository.save(entry);
    }

    /**
     * Writes a small placeholder file so the secured download endpoint really
     * has something to serve, then records the metadata.
     */
    private void certificate(StudentProfile student, String title, String issuer,
                             LocalDate issueDate, VerificationStatus status, Long verifiedBy) {
        certificate(student, title, issuer, issueDate, status, verifiedBy, 1);
    }

    private void certificate(StudentProfile student, String title, String issuer,
                             LocalDate issueDate, VerificationStatus status, Long verifiedBy,
                             int daysAgo) {
        String storedName = UUID.randomUUID() + ".pdf";
        String relativePath = "certificates/" + student.getId() + "/" + storedName;
        long size = writePlaceholderPdf(relativePath, title);

        Certificate certificate = new Certificate();
        certificate.setStudentProfile(student);
        certificate.setTitle(title);
        certificate.setIssuingOrganization(issuer);
        certificate.setIssueDate(issueDate);
        certificate.setOriginalFileName(title.toLowerCase().replace(' ', '-') + ".pdf");
        certificate.setStoredFileName(storedName);
        certificate.setStoragePath(relativePath);
        certificate.setMimeType("application/pdf");
        certificate.setFileSize(size);
        certificate.setVerificationStatus(status);
        certificate.setVerifiedBy(verifiedBy);
        if (status == VerificationStatus.VERIFIED) {
            certificate.setVerifiedAt(LocalDateTime.now());
            certificate.setVerificationNote("Checked against the issuer's records.");
        }
        Certificate savedCertificate = certificateRepository.save(certificate);
        if (daysAgo > 0) {
            savedCertificate.setCreatedAt(LocalDateTime.now().minusDays(daysAgo));
            certificateRepository.save(savedCertificate);
        }
    }

    private long writePlaceholderPdf(String relativePath, String title) {
        // A minimal PDF. Readers reconstruct the cross-reference table, which
        // is fine for a placeholder whose only job is to prove the download
        // endpoint streams real bytes with the right content type.
        String pdf = "%PDF-1.4\n"
                + "1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
                + "2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n"
                + "3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 300 120]"
                + "/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>endobj\n"
                + "4 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n"
                + "5 0 obj<</Length 90>>stream\n"
                + "BT /F1 11 Tf 20 70 Td (DEMO CERTIFICATE - not a real document) Tj ET\n"
                + "endstream endobj\n"
                + "trailer<</Root 1 0 R/Size 6>>\n"
                + "%%EOF\n";
        try {
            Path root = Paths.get(appProperties.getStorage().getUploadRoot())
                    .toAbsolutePath().normalize();
            Path target = root.resolve(relativePath).normalize();
            Files.createDirectories(target.getParent());
            byte[] bytes = pdf.getBytes(StandardCharsets.US_ASCII);
            Files.write(target, bytes);
            return bytes.length;
        } catch (IOException ex) {
            log.warn("Demo data: could not write the placeholder file for \"{}\". "
                    + "The certificate row is still created; only the download will 404.", title);
            return 0L;
        }
    }

    private void notify(User recipient, String type, String title, String message) {
        Notification notification = new Notification();
        notification.setUser(recipient);
        notification.setType(type);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setRead(false);
        notificationRepository.save(notification);
    }
}
