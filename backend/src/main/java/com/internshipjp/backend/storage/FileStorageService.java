package com.internshipjp.backend.storage;

import com.internshipjp.backend.config.AppProperties;
import com.internshipjp.backend.exception.BadRequestException;
import com.internshipjp.backend.exception.NotFoundException;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.UUID;

/**
 * Saves uploaded files on the backend filesystem and reads them back.
 *
 * WHY FILES ARE NOT STORED IN MARIADB
 *   Certificate scans are binary blobs of a few hundred kilobytes. Keeping
 *   them in the database bloats every backup and every query plan. MariaDB
 *   stores only the metadata; the bytes live under UPLOAD_ROOT.
 *
 * WHY THE FOLDER IS NOT A PUBLIC STATIC PATH
 *   If uploads/ were served as static content, anyone who guessed a filename
 *   could read another student's certificate. Every download therefore goes
 *   through a controller that checks permissions first.
 *
 * WHAT IS VALIDATED
 *   file size, MIME type, extension, and the filename itself. The name the
 *   browser sends is never used as a path - a fresh UUID name is generated,
 *   which removes filename collisions and path traversal in one step.
 */
@Service
public class FileStorageService {

    private static final Logger log = LoggerFactory.getLogger(FileStorageService.class);

    private final AppProperties appProperties;
    private Path root;

    public FileStorageService(AppProperties appProperties) {
        this.appProperties = appProperties;
    }

    @PostConstruct
    void createRootFolder() {
        this.root = Paths.get(appProperties.getStorage().getUploadRoot())
                .toAbsolutePath().normalize();
        try {
            Files.createDirectories(root);
            log.info("File storage root: {}", root);
        } catch (IOException ex) {
            throw new IllegalStateException("Could not create the upload folder at " + root, ex);
        }
    }

    /**
     * Validates and saves one upload.
     *
     * @param category logical folder, e.g. "certificates" or "resumes"
     * @param ownerId  the student profile the file belongs to
     */
    public StoredFile store(MultipartFile file, String category, Long ownerId) {
        validate(file);

        String originalName = StringUtils.cleanPath(
                file.getOriginalFilename() == null ? "upload" : file.getOriginalFilename());
        String extension = extensionOf(originalName);
        String storedName = UUID.randomUUID() + "." + extension;

        String relativePath = category + "/" + ownerId + "/" + storedName;
        Path target = root.resolve(relativePath).normalize();

        // Belt and braces: even though the name is generated, prove the final
        // path is still inside the storage root before writing anything.
        if (!target.startsWith(root)) {
            throw new BadRequestException("That file could not be stored.");
        }

        try {
            Files.createDirectories(target.getParent());
            try (InputStream in = file.getInputStream()) {
                Files.copy(in, target, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException ex) {
            log.error("Failed to write upload to {}", target, ex);
            throw new IllegalStateException("The file could not be saved. Please try again.");
        }

        return new StoredFile(originalName, storedName, relativePath,
                file.getContentType(), file.getSize());
    }

    /** Opens a stored file for download. Callers must check permissions FIRST. */
    public Resource loadAsResource(String storagePath) {
        Path target = resolveInsideRoot(storagePath);
        try {
            Resource resource = new UrlResource(target.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new NotFoundException("The stored file is missing from the server.");
            }
            return resource;
        } catch (IOException ex) {
            throw new NotFoundException("The stored file could not be read.");
        }
    }

    /** Removes a stored file. Missing files are ignored so deletes stay idempotent. */
    public void delete(String storagePath) {
        try {
            Files.deleteIfExists(resolveInsideRoot(storagePath));
        } catch (IOException ex) {
            log.warn("Could not delete stored file {}", storagePath, ex);
        }
    }

    private Path resolveInsideRoot(String storagePath) {
        Path target = root.resolve(storagePath).normalize();
        if (!target.startsWith(root)) {
            // Someone passed something like ../../application-local.properties
            throw new BadRequestException("Invalid file path.");
        }
        return target;
    }

    private void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Choose a file to upload.");
        }
        long maxSize = appProperties.getStorage().getMaxFileSizeBytes();
        if (file.getSize() > maxSize) {
            throw new BadRequestException(
                    "The file is larger than the " + (maxSize / (1024 * 1024)) + " MB limit.");
        }

        String contentType = file.getContentType();
        if (contentType == null
                || !appProperties.getStorage().getAllowedMimeTypes().contains(contentType.toLowerCase(Locale.ROOT))) {
            throw new BadRequestException("Only PDF, PNG and JPG files are accepted.");
        }

        String originalName = file.getOriginalFilename();
        if (!StringUtils.hasText(originalName)) {
            throw new BadRequestException("The file has no name.");
        }
        // Reject anything that tries to escape the folder or hide a second extension.
        if (originalName.contains("..") || originalName.contains("/") || originalName.contains("\\")) {
            throw new BadRequestException("That filename is not allowed.");
        }
        if (!appProperties.getStorage().getAllowedExtensions().contains(extensionOf(originalName))) {
            throw new BadRequestException("Only .pdf, .png, .jpg and .jpeg files are accepted.");
        }
    }

    private String extensionOf(String fileName) {
        int dot = fileName.lastIndexOf('.');
        if (dot < 0 || dot == fileName.length() - 1) {
            return "";
        }
        return fileName.substring(dot + 1).toLowerCase(Locale.ROOT);
    }
}
