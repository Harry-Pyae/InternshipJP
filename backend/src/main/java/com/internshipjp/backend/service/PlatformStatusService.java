package com.internshipjp.backend.service;

import com.internshipjp.backend.dto.response.DatabaseStatusResponse;
import com.internshipjp.backend.dto.response.HealthResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.sql.Connection;
import java.time.LocalDateTime;

/**
 * Backs the /api/test/health and /api/test/database endpoints.
 *
 * The database check really queries MariaDB - it asks the connection which
 * schema it is attached to and counts the tables in it. Nothing here is
 * hard-coded, so if the datasource is misconfigured the endpoint says so
 * instead of cheerfully reporting "connected".
 */
@Service
public class PlatformStatusService {

    private static final Logger log = LoggerFactory.getLogger(PlatformStatusService.class);

    private final JdbcTemplate jdbcTemplate;

    public PlatformStatusService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public HealthResponse health() {
        HealthResponse response = new HealthResponse();
        response.setStatus("UP");
        response.setApplication("InternshipJP");
        response.setTimestamp(LocalDateTime.now().toString());
        return response;
    }

    public DatabaseStatusResponse database() {
        DatabaseStatusResponse response = new DatabaseStatusResponse();
        try {
            String schema = jdbcTemplate.queryForObject("SELECT DATABASE()", String.class);
            Integer tableCount = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE()",
                    Integer.class);
            String version = jdbcTemplate.execute((Connection connection) ->
                    connection.getMetaData().getDatabaseProductName() + " "
                            + connection.getMetaData().getDatabaseProductVersion());

            response.setConnected(schema != null);
            response.setDatabase(schema);
            response.setTableCount(tableCount);
            response.setProductVersion(version);
        } catch (Exception ex) {
            log.warn("Database status check failed", ex);
            response.setConnected(false);
            // Safe to show: this endpoint is for developers and is disabled in
            // production via APP_TEST_ENDPOINTS_ENABLED.
            response.setError(ex.getClass().getSimpleName() + ": " + ex.getMessage());
        }
        return response;
    }
}
