package com.internshipjp.backend.storage;

import com.internshipjp.backend.config.AppProperties;
import com.internshipjp.backend.exception.BadRequestException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Upload validation. Runs without Spring and without a database.
 *
 * These are the checks that stop a malicious or careless upload, so they are
 * worth testing properly rather than trusting by eye.
 */
class FileStorageServiceTest {

    @TempDir
    Path tempDir;

    private FileStorageService storage;

    @BeforeEach
    void setUp() {
        AppProperties properties = new AppProperties();
        properties.getStorage().setUploadRoot(tempDir.toString());
        storage = new FileStorageService(properties);
        storage.createRootFolder();
    }

    @Test
    void savesAnAllowedPdfAndGivesItAGeneratedName() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "my certificate.pdf", "application/pdf", "%PDF-1.4 fake".getBytes());

        StoredFile stored = storage.store(file, "certificates", 7L);

        assertEquals("my certificate.pdf", stored.getOriginalFileName());
        // The stored name must NOT be the name the browser sent.
        assertTrue(stored.getStoredFileName().endsWith(".pdf"));
        assertTrue(stored.getStoredFileName().length() > 20);
        assertTrue(stored.getStoragePath().startsWith("certificates/7/"));
        assertTrue(Files.exists(tempDir.resolve(stored.getStoragePath())));
    }

    @Test
    void rejectsAnEmptyUpload() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "empty.pdf", "application/pdf", new byte[0]);
        assertThrows(BadRequestException.class, () -> storage.store(file, "certificates", 1L));
    }

    @Test
    void rejectsAnExecutableDisguisedByItsMimeType() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "payload.exe", "application/pdf", "MZ".getBytes());
        assertThrows(BadRequestException.class, () -> storage.store(file, "certificates", 1L));
    }

    @Test
    void rejectsADisallowedMimeType() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "notes.txt", "text/plain", "hello".getBytes());
        assertThrows(BadRequestException.class, () -> storage.store(file, "certificates", 1L));
    }

    @Test
    void rejectsAFilenameThatTriesToEscapeTheFolder() {
        MockMultipartFile file = new MockMultipartFile(
                "file", "../../application-local.properties", "application/pdf", "x".getBytes());
        assertThrows(BadRequestException.class, () -> storage.store(file, "certificates", 1L));
    }

    @Test
    void rejectsAFileOverTheSizeLimit() {
        AppProperties properties = new AppProperties();
        properties.getStorage().setUploadRoot(tempDir.toString());
        properties.getStorage().setMaxFileSizeBytes(10);
        FileStorageService smallLimit = new FileStorageService(properties);
        smallLimit.createRootFolder();

        MockMultipartFile file = new MockMultipartFile(
                "file", "big.pdf", "application/pdf", new byte[64]);
        assertThrows(BadRequestException.class, () -> smallLimit.store(file, "certificates", 1L));
    }

    @Test
    void refusesToReadOutsideTheStorageRoot() {
        assertThrows(BadRequestException.class,
                () -> storage.loadAsResource("../../../etc/passwd"));
    }
}
