package com.internshipjp.backend.controller;

import com.internshipjp.backend.dto.response.ApiMessageResponse;
import com.internshipjp.backend.entity.User;
import com.internshipjp.backend.exception.NotFoundException;
import com.internshipjp.backend.repository.UserRepository;
import com.internshipjp.backend.security.CurrentUserService;
import com.internshipjp.backend.service.AccountService;
import com.internshipjp.backend.storage.FileStorageService;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;

/**
 * Profile photos, for every role.
 *
 * The column has existed since V8 and nothing ever wrote to it. One controller
 * for all three roles, because a photo is a photo: a student, an employer and
 * an administrator all have the same thing to upload and the same rule about
 * whose they may change.
 *
 * WHO MAY CHANGE ONE
 *   Only its owner. There is no administrative override, because changing
 *   somebody else's photograph is not a moderation action - removing it would
 *   be, and an administrator who needs that can suspend the account.
 *
 * WHO MAY SEE ONE
 *   Any signed-in user. A photo is shown beside a name wherever the name
 *   already appears: an employer reviewing an applicant, an administrator
 *   reviewing a certificate. Restricting it further would mean the avatar
 *   silently failed to load in half the product.
 */
@RestController
@RequestMapping("/api/account/photo")
public class ProfilePhotoController {

    private final AccountService accountService;
    private final CurrentUserService currentUserService;
    private final FileStorageService fileStorageService;
    private final UserRepository userRepository;

    public ProfilePhotoController(AccountService accountService,
                                  CurrentUserService currentUserService,
                                  FileStorageService fileStorageService,
                                  UserRepository userRepository) {
        this.accountService = accountService;
        this.currentUserService = currentUserService;
        this.fileStorageService = fileStorageService;
        this.userRepository = userRepository;
    }

    /** Uploads or replaces the caller's own photo. */
    @PostMapping
    public ApiMessageResponse upload(@RequestParam("file") MultipartFile file) {
        accountService.replacePhoto(currentUserService.requireUserId(), file);
        return new ApiMessageResponse("Photo updated.");
    }

    /** Removes the caller's own photo. */
    @DeleteMapping
    public ApiMessageResponse remove() {
        accountService.removePhoto(currentUserService.requireUserId());
        return new ApiMessageResponse("Photo removed.");
    }

    /**
     * Streams somebody's photo.
     *
     * A 404 when there is none, rather than a placeholder image: the interface
     * decides what to draw in its absence, and it already has initials for
     * exactly that.
     */
    @GetMapping("/{userId}")
    public ResponseEntity<Resource> photo(@PathVariable Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> NotFoundException.of("User", userId));

        if (user.getPhotoPath() == null) {
            return ResponseEntity.notFound().build();
        }

        Resource resource = fileStorageService.loadAsResource(user.getPhotoPath());
        return ResponseEntity.ok()
                // Not cached by the browser.
                //
                // It was, for ten minutes, which seemed right for an image that
                // appears on every row of every table. It also meant a deleted
                // photo kept being served from the browser's own cache: the
                // version counter that was supposed to defeat that lives in
                // memory, so a page reload reset it to zero and asked for the
                // exact address the old image was cached under.
                //
                // Repeat requests within a page are already prevented by the
                // in-memory cache in the Avatar component, so the HTTP cache was
                // solving a problem that was already solved.
                .cacheControl(CacheControl.noStore())
                .contentType(MediaType.IMAGE_JPEG)
                .body(resource);
    }
}
