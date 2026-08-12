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

/**
 * Account settings shared by all three roles.
 *
 * Every method takes the user id from the caller (which comes from the
 * session, never from the request body), so a signed-in user can only ever
 * change their own account.
 */
@Service
public class AccountService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;

    public AccountService(UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          UserMapper userMapper) {
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

        // TODO MEMBER_2: invalidate the user's other sessions here once you add
        // session tracking, and send a "your password was changed" notification.
    }

    private User loadUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> NotFoundException.of("Account", userId));
    }
}
