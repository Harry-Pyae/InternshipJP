package com.internshipjp.backend.service;

import com.internshipjp.backend.dto.response.DataCompactionResponse;
import com.internshipjp.backend.exception.BadRequestException;
import com.internshipjp.backend.repository.AiConversationRepository;
import com.internshipjp.backend.repository.AiMessageRepository;
import com.internshipjp.backend.repository.AiUsageLogRepository;
import com.internshipjp.backend.repository.EmailOtpChallengeRepository;
import com.internshipjp.backend.repository.NotificationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowCallbackHandler;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.Time;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Deque;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * The two things an administrator can do to the database as a whole: take a
 * copy of it, and reclaim the space taken by records nobody needs any more.
 *
 * WHY BOTH LIVE IN ONE SERVICE
 *     They are the same decision seen from two sides. Compaction is only safe
 *     to offer because an export exists, so the screen puts them together and
 *     so does the code behind it.
 *
 * WHAT COMPACTION WILL NEVER TOUCH
 *     Accounts, profiles, companies, internships, applications, application
 *     messages, status history and certificates. Those are the record of what
 *     happened on the platform; deleting any of them would lose something that
 *     cannot be recomputed. Only four kinds of row are removed, and each one
 *     is either unreadable already or a log:
 *
 *       - spent OTP challenges, which can never be redeemed again
 *       - AI provider telemetry older than the retention window
 *       - READ notifications older than the window (unread ones always stay)
 *       - AI chat threads untouched since the window, and their messages
 *
 *     Everything an administrator is about to delete is counted and shown
 *     first, by the same code that does the deleting.
 *
 * Owner: Member 4.
 */
@Service
public class DataMaintenanceService {

    private static final Logger log = LoggerFactory.getLogger(DataMaintenanceService.class);

    /**
     * The shortest window we will accept.
     *
     * A month of AI telemetry and read notifications is what the reports
     * screen draws its figures from, so anything shorter would empty a screen
     * somebody is looking at. There is no case for going lower, and a typo in
     * a query string should not be able to.
     */
    private static final int MIN_RETENTION_DAYS = 30;

    /** Ten years. Past this the window is not a retention rule, it is a no-op. */
    private static final int MAX_RETENTION_DAYS = 3650;

    /**
     * A ceiling per table, so one enormous table cannot exhaust the heap while
     * the export is being assembled in memory. If it is ever reached the
     * export says so in the table's own entry rather than quietly handing back
     * a short file that looks complete.
     */
    private static final int MAX_ROWS_PER_TABLE = 200_000;

    /**
     * Flyway writes this table and owns it. Restoring one database's history
     * into another is how you end up with a schema Flyway refuses to touch, so
     * it is left out - the migrations recreate it on a fresh database anyway.
     */
    private static final String FLYWAY_HISTORY_TABLE = "flyway_schema_history";

    /**
     * Identifiers are read out of information_schema for the current database,
     * so they cannot be attacker-chosen. They are still checked before being
     * put in a statement: the day someone adds a parameter to this class, the
     * check is already here.
     */
    private static final Pattern SAFE_IDENTIFIER = Pattern.compile("^[A-Za-z0-9_]+$");

    private final JdbcTemplate jdbcTemplate;
    private final EmailOtpChallengeRepository emailOtpChallengeRepository;
    private final AiUsageLogRepository aiUsageLogRepository;
    private final NotificationRepository notificationRepository;
    private final AiConversationRepository aiConversationRepository;
    private final AiMessageRepository aiMessageRepository;

    public DataMaintenanceService(JdbcTemplate jdbcTemplate,
                                  EmailOtpChallengeRepository emailOtpChallengeRepository,
                                  AiUsageLogRepository aiUsageLogRepository,
                                  NotificationRepository notificationRepository,
                                  AiConversationRepository aiConversationRepository,
                                  AiMessageRepository aiMessageRepository) {
        this.jdbcTemplate = jdbcTemplate;
        this.emailOtpChallengeRepository = emailOtpChallengeRepository;
        this.aiUsageLogRepository = aiUsageLogRepository;
        this.notificationRepository = notificationRepository;
        this.aiConversationRepository = aiConversationRepository;
        this.aiMessageRepository = aiMessageRepository;
    }

    // -----------------------------------------------------------------------
    // EXPORT
    // -----------------------------------------------------------------------

    /**
     * Every row of every table, as one JSON document.
     *
     * Read out of information_schema rather than from a hand-written list of
     * tables, so a migration added next week is in the backup without anybody
     * remembering to come back here.
     *
     * Each table is written as its column names once and then one array per
     * row. That is a third of the size of repeating every column name on every
     * row, and it is still unambiguous: position n in a row is column n.
     *
     * Tables come out parents-first, so inserting them back in the order given
     * never trips a foreign key.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> exportEverything() {
        List<String> tables = baseTables();
        List<String> ordered = parentsFirst(tables, foreignKeyEdges());

        Map<String, Object> tableData = new LinkedHashMap<>();
        long totalRows = 0;
        for (String table : ordered) {
            Map<String, Object> dumped = dumpTable(table);
            tableData.put(table, dumped);
            totalRows += ((List<?>) dumped.get("rows")).size();
        }

        Map<String, Object> export = new LinkedHashMap<>();
        export.put("application", "InternshipJP");
        export.put("formatVersion", 1);
        export.put("exportedAt", LocalDateTime.now().toString());
        export.put("database", jdbcTemplate.queryForObject("SELECT DATABASE()", String.class));
        export.put("tableCount", ordered.size());
        export.put("rowCount", totalRows);
        // Said in the file itself, because a backup is read by whoever finds
        // it, months later, without this class in front of them.
        export.put("note", "Tables are listed parents-first: inserting them in this order "
                + "satisfies every foreign key. Each table gives its column names once, "
                + "then one array per row in that same order. "
                + FLYWAY_HISTORY_TABLE + " is excluded on purpose - Flyway rebuilds it.");
        export.put("tables", tableData);

        log.info("Data export produced {} tables and {} rows.", ordered.size(), totalRows);
        return export;
    }

    /** Every real table in the current schema, views and Flyway's own excluded. */
    private List<String> baseTables() {
        List<String> tables = jdbcTemplate.queryForList(
                "SELECT table_name FROM information_schema.tables "
                        + "WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE' "
                        + "ORDER BY table_name",
                String.class);

        List<String> usable = new ArrayList<>();
        for (String table : tables) {
            if (table == null || FLYWAY_HISTORY_TABLE.equalsIgnoreCase(table)) {
                continue;
            }
            if (!SAFE_IDENTIFIER.matcher(table).matches()) {
                // Nothing in this schema is named like this. If something ever
                // is, skipping it loudly beats putting it into a statement.
                log.warn("Skipping table with an unexpected name during export: {}", table);
                continue;
            }
            usable.add(table);
        }
        return usable;
    }

    /** child table -> the tables it points at. */
    private Map<String, Set<String>> foreignKeyEdges() {
        Map<String, Set<String>> parentsOf = new HashMap<>();
        jdbcTemplate.query(
                "SELECT table_name, referenced_table_name FROM information_schema.key_column_usage "
                        + "WHERE table_schema = DATABASE() AND referenced_table_name IS NOT NULL",
                (RowCallbackHandler) (ResultSet rs) -> {
                    String child = rs.getString(1);
                    String parent = rs.getString(2);
                    // A row pointing at its own table (there are none today, but
                    // a "reports_to" column would add one) is not a dependency
                    // between tables and would deadlock the sort below.
                    if (child != null && parent != null && !child.equals(parent)) {
                        parentsOf.computeIfAbsent(child, key -> new HashSet<>()).add(parent);
                    }
                });
        return parentsOf;
    }

    /**
     * Orders tables so every table comes after the tables it references.
     *
     * A plain topological sort, with one concession to reality: if the graph
     * ever contains a cycle - two tables with foreign keys into each other -
     * the remaining tables are appended in name order instead of the method
     * throwing. A backup that is slightly awkward to restore is worth more
     * than no backup at all.
     */
    private List<String> parentsFirst(List<String> tables, Map<String, Set<String>> parentsOf) {
        Set<String> known = new HashSet<>(tables);
        List<String> ordered = new ArrayList<>();
        Set<String> placed = new HashSet<>();

        Deque<String> pending = new ArrayDeque<>(tables);
        int stuckRounds = 0;
        while (!pending.isEmpty()) {
            int before = placed.size();
            int toVisit = pending.size();
            for (int i = 0; i < toVisit; i++) {
                String table = pending.removeFirst();
                Set<String> parents = parentsOf.getOrDefault(table, Set.of());
                boolean ready = true;
                for (String parent : parents) {
                    if (known.contains(parent) && !placed.contains(parent)) {
                        ready = false;
                        break;
                    }
                }
                if (ready) {
                    ordered.add(table);
                    placed.add(table);
                } else {
                    pending.addLast(table);
                }
            }
            if (placed.size() == before) {
                stuckRounds++;
                if (stuckRounds > 1) {
                    List<String> leftovers = new ArrayList<>(pending);
                    leftovers.sort(String::compareTo);
                    log.warn("Foreign keys form a cycle; exporting {} table(s) in name order: {}",
                            leftovers.size(), leftovers);
                    ordered.addAll(leftovers);
                    break;
                }
            } else {
                stuckRounds = 0;
            }
        }
        return ordered;
    }

    /** One table: its column names, then its rows. */
    private Map<String, Object> dumpTable(String table) {
        List<String> columns = new ArrayList<>();
        List<List<Object>> rows = new ArrayList<>();
        boolean[] truncated = { false };

        jdbcTemplate.query("SELECT * FROM `" + table + "`", (RowCallbackHandler) (ResultSet rs) -> {
            if (columns.isEmpty()) {
                ResultSetMetaData meta = rs.getMetaData();
                for (int i = 1; i <= meta.getColumnCount(); i++) {
                    columns.add(meta.getColumnLabel(i));
                }
            }
            if (rows.size() >= MAX_ROWS_PER_TABLE) {
                truncated[0] = true;
                return;
            }
            List<Object> row = new ArrayList<>(columns.size());
            for (int i = 1; i <= columns.size(); i++) {
                row.add(jsonSafe(rs.getObject(i)));
            }
            rows.add(row);
        });

        // An empty table still has columns, and a restore needs them.
        if (columns.isEmpty()) {
            columns.addAll(columnNamesOf(table));
        }

        Map<String, Object> dumped = new LinkedHashMap<>();
        dumped.put("columns", columns);
        dumped.put("rows", rows);
        if (truncated[0]) {
            dumped.put("truncated", true);
            dumped.put("truncatedAfter", MAX_ROWS_PER_TABLE);
            log.warn("Table {} has more than {} rows; the export was truncated.",
                    table, MAX_ROWS_PER_TABLE);
        }
        return dumped;
    }

    private List<String> columnNamesOf(String table) {
        return jdbcTemplate.queryForList(
                "SELECT column_name FROM information_schema.columns "
                        + "WHERE table_schema = DATABASE() AND table_name = ? "
                        + "ORDER BY ordinal_position",
                String.class, table);
    }

    /**
     * A JDBC value as something JSON can carry, and a person can read.
     *
     * Dates are written with toString() rather than left to Jackson: the
     * default for java.sql.Timestamp depends on the ObjectMapper's date
     * settings, and a backup whose timestamp format changes when an unrelated
     * property is edited is not a backup you can rely on.
     */
    private Object jsonSafe(Object value) {
        if (value == null) {
            return null;
        }
        if (value instanceof Timestamp timestamp) {
            return timestamp.toLocalDateTime().toString();
        }
        if (value instanceof java.sql.Date date) {
            return date.toLocalDate().toString();
        }
        if (value instanceof Time time) {
            return time.toLocalTime().toString();
        }
        if (value instanceof byte[] bytes) {
            return Base64.getEncoder().encodeToString(bytes);
        }
        if (value instanceof Number || value instanceof Boolean || value instanceof String) {
            return value;
        }
        return value.toString();
    }

    // -----------------------------------------------------------------------
    // COMPACTION
    // -----------------------------------------------------------------------

    /** What compaction would remove, without removing any of it. */
    @Transactional(readOnly = true)
    public DataCompactionResponse preview(int retentionDays) {
        int days = checkedRetention(retentionDays);
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime cutoff = now.minusDays(days);

        DataCompactionResponse response = shell(false, days, cutoff);
        response.setExpiredOtpChallenges(emailOtpChallengeRepository.countSpent(now));
        response.setAiUsageLogs(aiUsageLogRepository.countByCreatedAtBefore(cutoff));
        response.setReadNotifications(
                notificationRepository.countByReadTrueAndCreatedAtBefore(cutoff));
        response.setAiConversations(aiConversationRepository.countByUpdatedAtBefore(cutoff));
        response.setAiMessages(aiMessageRepository.countInConversationsBefore(cutoff));
        return total(response);
    }

    /**
     * Removes what the preview listed, and reports what it actually removed.
     *
     * One transaction: either every category goes or none does, so the
     * database is never left half compacted after a failure partway through.
     *
     * Messages are deleted before their conversations. The foreign key would
     * cascade either way, but doing it in this order means the count reported
     * back is the number of rows this method removed rather than a number the
     * database quietly made true on its own.
     */
    @Transactional
    public DataCompactionResponse compact(int retentionDays) {
        int days = checkedRetention(retentionDays);
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime cutoff = now.minusDays(days);

        DataCompactionResponse response = shell(true, days, cutoff);
        response.setExpiredOtpChallenges(emailOtpChallengeRepository.deleteSpent(now));
        response.setAiUsageLogs(aiUsageLogRepository.deleteCreatedBefore(cutoff));
        response.setReadNotifications(notificationRepository.deleteReadBefore(cutoff));
        response.setAiMessages(aiMessageRepository.deleteInConversationsBefore(cutoff));
        response.setAiConversations(aiConversationRepository.deleteUpdatedBefore(cutoff));
        total(response);

        log.info("Compaction removed {} row(s) older than {} days ({} OTP, {} AI log, "
                        + "{} notification, {} AI message, {} AI thread).",
                response.getTotalRows(), days, response.getExpiredOtpChallenges(),
                response.getAiUsageLogs(), response.getReadNotifications(),
                response.getAiMessages(), response.getAiConversations());
        return response;
    }

    private DataCompactionResponse shell(boolean applied, int days, LocalDateTime cutoff) {
        DataCompactionResponse response = new DataCompactionResponse();
        response.setApplied(applied);
        response.setRetentionDays(days);
        response.setCutoff(cutoff.toString());
        return response;
    }

    private DataCompactionResponse total(DataCompactionResponse response) {
        response.setTotalRows(response.getExpiredOtpChallenges()
                + response.getAiUsageLogs()
                + response.getReadNotifications()
                + response.getAiConversations()
                + response.getAiMessages());
        return response;
    }

    private int checkedRetention(int retentionDays) {
        if (retentionDays < MIN_RETENTION_DAYS || retentionDays > MAX_RETENTION_DAYS) {
            throw new BadRequestException("Keep between " + MIN_RETENTION_DAYS + " and "
                    + MAX_RETENTION_DAYS + " days of history.");
        }
        return retentionDays;
    }
}
