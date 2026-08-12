package com.internshipjp.backend.storage;

/**
 * What FileStorageService gives back after saving an upload.
 *
 * The caller copies these values into the matching entity columns
 * (original_file_name, stored_file_name, storage_path, mime_type, file_size).
 */
public class StoredFile {

    private final String originalFileName;
    private final String storedFileName;
    private final String storagePath;
    private final String mimeType;
    private final long size;

    public StoredFile(String originalFileName, String storedFileName, String storagePath,
                      String mimeType, long size) {
        this.originalFileName = originalFileName;
        this.storedFileName = storedFileName;
        this.storagePath = storagePath;
        this.mimeType = mimeType;
        this.size = size;
    }

    public String getOriginalFileName() {
        return originalFileName;
    }

    public String getStoredFileName() {
        return storedFileName;
    }

    /** Path relative to UPLOAD_ROOT, e.g. certificates/7/9f3c-...pdf */
    public String getStoragePath() {
        return storagePath;
    }

    public String getMimeType() {
        return mimeType;
    }

    public long getSize() {
        return size;
    }
}
