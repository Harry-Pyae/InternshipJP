package com.internshipjp.backend.entity;

/**
 * What kind of skill this is, so the assistants can reason about
 * them separately.
 *
 * PROGRAMMING_LANGUAGE  Java, PHP, TypeScript, Python ...
 * TECHNICAL             frameworks, tools and platforms: Spring Boot, Docker, Git
 * SOFT                  teamwork, communication, presenting
 * SPOKEN_LANGUAGE       English, Burmese, Japanese ...
 *
 * Added after V1 shipped and cost no migration, because skill_type is a
 * VARCHAR rather than a MariaDB ENUM. Existing TECHNICAL rows stay valid.
 */
public enum SkillType {
    PROGRAMMING_LANGUAGE,
    TECHNICAL,
    SOFT,
    SPOKEN_LANGUAGE
}
