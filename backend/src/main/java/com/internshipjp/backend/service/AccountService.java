package com.internshipjp.backend.service;

import com.internshipjp.backend.dto.request.ChangePasswordRequest;
import com.internshipjp.backend.dto.request.UpdateAccountRequest;
import com.internshipjp.backend.dto.response.AccountResponse;
import com.internshipjp.backend.entity.User;
import com.internshipjp.backend.exception.BadRequestException;
import com.internshipjp.backend.exception.NotFoundException;
import com.internshipjp.backend.mapper.UserMapper;
import com.internshipjp.backend.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.internshipjp.backend.dto.request.DeleteAccountRequest;
import com.internshipjp.backend.entity.AccountStatus;
import com.internshipjp.backend.entity.Role;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.internshipjp.backend.storage.FileStorageService;
import com.internshipjp.backend.storage.StoredFile;
import org.springframework.web.multipart.MultipartFile;

/**
 * Account settings shared by all three roles.
 *
 * Every method takes the user id from the caller (which comes from the
 * session, never from the request body), so a signed-in user can only ever
 * change their own account.
 */
@Service
public class AccountService {

    private static final Logger log = LoggerFactory.getLogger(AccountService.class);

    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;

    public AccountService(UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          UserMapper userMapper,
                          FileStorageService fileStorageService) {
        this.fileStorageService = fileStorageService;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.userMapper = userMapper;
    }

    @Transactional(readOnly = true)
    public AccountResponse getAccount(Long userId) {
        return userMapper.toAccount(loadUser(userId));
    }

    @Transactional
    public AccountResponse updateAccount(Long userId, UpdateAccountRequest request) {
        User user = loadUser(userId);
        user.setFullName(request.getFullName().trim());
        user.setPhone(request.getPhone());
        return userMapper.toAccount(userRepository.save(user));
    }

    /**
     * Changing a password always requires the current one, so a hijacked open
     * session cannot lock the real owner out.
     */
    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = loadUser(userId);

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Your current password is not correct.");
        }
        if (passwordEncoder.matches(request.getNewPassword(), user.getPasswordHash())) {
            throw new BadRequestException("The new password must be different from the current one.");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // Future work: invalidate the user's other sessions here once we add
        // session tracking, and send a "your password was changed" notification.
    }

    /**
     * Deletes the caller's own account, permanently.
     *
     * Two guards. The password must be correct, because deletion cannot be
     * undone and an unattended browser should not be enough to trigger it. And
     * the last active administrator cannot remove themselves, since there would
     * then be no one able to verify a certificate or approve a company, and no
     * way to create a replacement through the interface.
     *
     * Everything owned by the account goes with it: profile, applications,
     * certificates and notifications, by the cascade rules in the schema.
     */
    @Transactional
    public void deleteOwnAccount(Long userId, DeleteAccountRequest request) {
        User user = loadUser(userId);

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadRequestException("That password is not correct.");
        }
        if (user.getRole() == Role.ADMIN
                && userRepository.countByRoleAndAccountStatus(Role.ADMIN, AccountStatus.ACTIVE) <= 1) {
            throw new BadRequestException(
                    "You are the last active administrator. Create another one before "
                            + "deleting this account.");
        }

        log.info("Account {} deleted itself.", user.getEmail());
        userRepository.delete(user);
    }

    /**
     * Replaces the caller's profile photo.
     *
     * Stored the same way a certificate is: under the upload root, outside the
     * served web directory, with only the path in the database. The storage
     * service checks the first bytes of the file rather than trusting the
     * extension or the Content-Type header, both of which the caller chooses.
     *
     * The old file is deleted after the new path is saved, not before: if the
     * save fails, the person still has the photo they had.
     */
    @Transactional
    public String replacePhoto(Long userId, MultipartFile file) {
        User user = loadUser(userId);
        String previous = user.getPhotoPath();

        StoredFile stored = fileStorageService.store(file, "photos", userId);
        user.setPhotoPath(stored.getStoragePath());
        userRepository.save(user);

        if (previous != null && !previous.equals(stored.getStoragePath())) {
            fileStorageService.delete(previous);
        }
        return stored.getStoragePath();
    }

    /** Removes the photo and the file behind it. */
    @Transactional
    public void removePhoto(Long userId) {
        User user = loadUser(userId);
        String previous = user.getPhotoPath();
        if (previous == null) {
            return;
        }
        user.setPhotoPath(null);
        userRepository.save(user);
        fileStorageService.delete(previous);
    }

    private User loadUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> NotFoundException.of("Account", userId));
    }
}
