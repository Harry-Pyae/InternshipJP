package com.internshipjp.backend.dto.response;


/**
 * GET /api/test/database - the values come from a real query.
 */
public class DatabaseStatusResponse {
    private boolean connected;

    private String database;

    private String productVersion;

    private Integer tableCount;

    private String error;

    public boolean isConnected() {
        return connected;
    }

    public void setConnected(boolean connected) {
        this.connected = connected;
    }

    public String getDatabase() {
        return database;
    }

    public void setDatabase(String database) {
        this.database = database;
    }

    public String getProductVersion() {
        return productVersion;
    }

    public void setProductVersion(String productVersion) {
        this.productVersion = productVersion;
    }

    public Integer getTableCount() {
        return tableCount;
    }

    public void setTableCount(Integer tableCount) {
        this.tableCount = tableCount;
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }
}
