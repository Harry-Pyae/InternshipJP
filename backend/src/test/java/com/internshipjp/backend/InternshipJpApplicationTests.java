package com.internshipjp.backend;

import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

/**
 * Does the whole application actually start?
 *
 * This single test catches most configuration mistakes at once: a missing
 * bean, a broken @ConfigurationProperties binding, a Flyway migration that
 * fails, or a JPA entity that does not match its table (because
 * ddl-auto=validate runs during startup).
 *
 * IT NEEDS A DATABASE
 *   MariaDB must be running and internshipjp_db must exist, so it is tagged
 *   "requires-db" and skipped by a plain `mvn test`.
 *
 *   Run it with:  mvn test -Dgroups=requires-db
 */
@SpringBootTest
@Tag("requires-db")
class InternshipJpApplicationTests {

    @Test
    void contextLoads() {
        // Reaching this line means the context started and Hibernate validated
        // every entity against the real schema. No assertion needed.
    }
}
