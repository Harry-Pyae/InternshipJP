package com.internshipjp.backend.util;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Null-safe date formatting for response DTOs.
 *
 * Every timestamp leaves the API as an ISO-8601 string (2026-03-04T10:15:30),
 * which JavaScript can pass straight to new Date(...). Keeping the conversion
 * in one place stops three different date formats appearing in three modules.
 */
public final class Dates {

    private Dates() {
    }

    public static String format(LocalDateTime value) {
        return value == null ? null : value.toString();
    }

    public static String format(LocalDate value) {
        return value == null ? null : value.toString();
    }
}
