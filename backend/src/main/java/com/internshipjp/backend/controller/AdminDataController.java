package com.internshipjp.backend.controller;

import com.internshipjp.backend.dto.response.DataCompactionResponse;
import com.internshipjp.backend.service.DataMaintenanceService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;

/**
 * Taking a copy of the database, and reclaiming the space old records hold.
 *
 * Under /api/admin, so SecurityConfig already restricts the whole tree to
 * ADMIN and no method here repeats the check.
 *
 * WHY COMPACTION IS TWO ENDPOINTS
 *     GET answers "what would go", POST does it. Same service, same counting
 *     code, so the number on the confirmation is the number that will be
 *     removed - not a second implementation that can drift from the first.
 *     It also means the screen can show the figure before anything is at
 *     stake, which is the whole point of putting a preview in front of a
 *     delete button.
 *
 * Owner: Member 4.
 */
@RestController
@RequestMapping("/api/admin/data")
public class AdminDataController {

    /**
     * Ninety days.
     *
     * Long enough that the reports screen keeps a full quarter of AI
     * telemetry, short enough that the log tables do not grow without limit.
     * The screen offers other windows; this is what it starts on.
     */
    private static final int DEFAULT_RETENTION_DAYS = 90;

    /** Sorts in a file listing, and is legal in a filename on every platform. */
    private static final DateTimeFormatter FILE_STAMP =
            DateTimeFormatter.ofPattern("yyyy-MM-dd-HHmm");

    private final DataMaintenanceService dataMaintenanceService;

    public AdminDataController(DataMaintenanceService dataMaintenanceService) {
        this.dataMaintenanceService = dataMaintenanceService;
    }

    /**
     * The whole database as one JSON file.
     *
     * Content-Disposition is "attachment", so the browser saves it instead of
     * rendering a megabyte of JSON in a tab. The header name is on the CORS
     * exposed-headers list in SecurityConfig, which is what lets the React
     * side read the filename back in development.
     */
    @GetMapping("/export")
    public ResponseEntity<Map<String, Object>> export() {
        Map<String, Object> data = dataMaintenanceService.exportEverything();
        String fileName = "internshipjp-backup-" + LocalDateTime.now().format(FILE_STAMP) + ".json";

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_JSON)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + fileName + "\"")
                // A backup is a point in time. Nothing between here and the
                // browser should hand the same file back to the next request.
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .body(data);
    }

    /** What a compaction would remove. Nothing is deleted by this call. */
    @GetMapping("/compaction")
    public DataCompactionResponse previewCompaction(
            @RequestParam(defaultValue = "" + DEFAULT_RETENTION_DAYS) int days) {
        return dataMaintenanceService.preview(days);
    }

    /** Removes it, and reports what was actually removed. */
    @PostMapping("/compaction")
    public DataCompactionResponse compact(
            @RequestParam(defaultValue = "" + DEFAULT_RETENTION_DAYS) int days) {
        return dataMaintenanceService.compact(days);
    }
}
