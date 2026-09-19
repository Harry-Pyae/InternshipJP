package com.internshipjp.backend.integration;

import com.internshipjp.backend.dto.response.DataCompactionResponse;
import com.internshipjp.backend.service.DataMaintenanceService;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * The export, run against the real schema.
 *
 * DataMaintenanceTest covers the arithmetic with mocked repositories, which
 * cannot catch the half of this that is SQL: reading the table list out of
 * information_schema, sorting it by its foreign keys, and selecting every
 * column of every table. All three are the kind of thing that works on a
 * whiteboard and fails against a database.
 *
 * Needs a database (the context has to start), so:
 *   mvn test -Dgroups=requires-db
 */
@SpringBootTest
@Tag("requires-db")
class DataExportTest {

    @Autowired
    private DataMaintenanceService dataMaintenanceService;

    @Test
    @SuppressWarnings("unchecked")
    void theExportCoversEveryTableAndNamesEveryColumn() {
        Map<String, Object> export = dataMaintenanceService.exportEverything();

        assertEquals("InternshipJP", export.get("application"));
        assertNotNull(export.get("exportedAt"));
        assertNotNull(export.get("database"));

        Map<String, Object> tables = (Map<String, Object>) export.get("tables");
        // Every migration adds tables; the number only ever grows. Asserting a
        // count here would mean editing this test on every schema change, which
        // is how a test stops being read and starts being updated by reflex.
        assertTrue(tables.size() >= 15, "expected the whole schema, got " + tables.size());
        assertEquals(tables.size(), export.get("tableCount"));

        // Flyway's own table is deliberately left out.
        assertFalse(tables.containsKey("flyway_schema_history"));

        for (Map.Entry<String, Object> entry : tables.entrySet()) {
            Map<String, Object> table = (Map<String, Object>) entry.getValue();
            List<String> columns = (List<String>) table.get("columns");
            List<List<Object>> rows = (List<List<Object>>) table.get("rows");

            // An empty table still has to name its columns, or the file cannot
            // be loaded back.
            assertFalse(columns.isEmpty(), entry.getKey() + " named no columns");

            for (List<Object> row : rows) {
                assertEquals(columns.size(), row.size(),
                        entry.getKey() + " has a row that does not match its columns");
            }
        }
    }

    /**
     * Parents before children, which is what makes the file loadable in the
     * order it gives. users comes before everything that points at a user.
     */
    @Test
    @SuppressWarnings("unchecked")
    void tablesAreOrderedParentsFirst() {
        Map<String, Object> export = dataMaintenanceService.exportEverything();
        List<String> order = List.copyOf(((Map<String, Object>) export.get("tables")).keySet());

        int users = order.indexOf("users");
        assertTrue(users >= 0, "users is missing from the export");

        for (String child : List.of("student_profiles", "notifications", "applications",
                "certificates", "ai_conversations")) {
            int at = order.indexOf(child);
            if (at >= 0) {
                assertTrue(users < at, child + " came before users");
            }
        }

        int conversations = order.indexOf("ai_conversations");
        int messages = order.indexOf("ai_messages");
        if (conversations >= 0 && messages >= 0) {
            assertTrue(conversations < messages, "ai_messages came before its conversations");
        }
    }

    /** The preview really runs its five queries and adds them up. */
    @Test
    void thePreviewRunsAgainstTheRealSchema() {
        DataCompactionResponse preview = dataMaintenanceService.preview(90);

        assertFalse(preview.isApplied());
        assertEquals(90, preview.getRetentionDays());
        assertEquals(preview.getExpiredOtpChallenges()
                        + preview.getAiUsageLogs()
                        + preview.getReadNotifications()
                        + preview.getAiConversations()
                        + preview.getAiMessages(),
                preview.getTotalRows());
    }
}
