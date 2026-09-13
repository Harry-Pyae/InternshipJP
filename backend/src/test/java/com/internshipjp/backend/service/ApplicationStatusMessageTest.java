package com.internshipjp.backend.service;

import com.internshipjp.backend.entity.ApplicationStatus;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * The student is told why, not only what.
 *
 * The employer's note was already captured and written to
 * application_status_history. It simply never reached the person it was
 * written for: the notification said the status had changed and stopped there.
 */
class ApplicationStatusMessageTest {

    @Test
    void theEmployerNoteIsIncludedAndAttributed() {
        String message = ApplicationService.statusMessage(
                "Backend Intern",
                ApplicationStatus.REJECTED,
                "Khit Kyaw",
                "We filled the position internally this year.");

        assertTrue(message.contains("Backend Intern"));
        assertTrue(message.contains("rejected"));
        assertTrue(message.contains("Khit Kyaw"),
                "a reason should be attributed to somebody, not appear anonymously");
        assertTrue(message.contains("We filled the position internally this year."));
    }

    @Test
    void withoutANoteTheMessageIsJustTheStatus() {
        String message = ApplicationService.statusMessage(
                "Backend Intern", ApplicationStatus.SHORTLISTED, "Khit Kyaw", null);

        assertTrue(message.contains("shortlisted"));
        assertFalse(message.contains("wrote:"),
                "no note means no dangling attribution");
    }

    @Test
    void aBlankNoteIsTreatedAsNoNote() {
        String message = ApplicationService.statusMessage(
                "Backend Intern", ApplicationStatus.UNDER_REVIEW, "Khit Kyaw", "   ");

        assertFalse(message.contains("wrote:"));
    }

    /** UNDER_REVIEW should read as words, not as a database constant. */
    @Test
    void underscoresBecomeSpaces() {
        String message = ApplicationService.statusMessage(
                "Backend Intern", ApplicationStatus.UNDER_REVIEW, "Khit Kyaw", null);

        assertTrue(message.contains("under review"));
        assertFalse(message.contains("UNDER_REVIEW"));
    }
}
