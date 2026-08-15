package com.internshipjp.backend.mapper;

import com.internshipjp.backend.dto.response.AccountResponse;
import com.internshipjp.backend.dto.response.AdminUserResponse;
import com.internshipjp.backend.dto.response.AuthUserResponse;
import com.internshipjp.backend.entity.User;
import com.internshipjp.backend.util.Dates;
import org.springframework.stereotype.Component;

/**
 * Entity -> DTO conversion for accounts.
 *
 * These plain methods replace a mapping framework on purpose: everyone on the
 * team can read them, and it is obvious at a glance that passwordHash is never
 * copied into a response.
 */
@Component
public class UserMapper {

    public AuthUserResponse toAuthUser(User user) {
        AuthUserResponse dto = new AuthUserResponse();
        dto.setId(user.getId());
        dto.setEmail(user.getEmail());
        dto.setFullName(user.getFullName());
        dto.setRole(user.getRole().name());
        dto.setAccountStatus(user.getAccountStatus().name());
        return dto;
    }

    public AccountResponse toAccount(User user) {
        AccountResponse dto = new AccountResponse();
        dto.setId(user.getId());
        dto.setEmail(user.getEmail());
        dto.setFullName(user.getFullName());
        dto.setPhone(user.getPhone());
        dto.setPhotoPath(user.getPhotoPath());
        dto.setRole(user.getRole().name());
        dto.setAccountStatus(user.getAccountStatus().name());
        dto.setCreatedAt(Dates.format(user.getCreatedAt()));
        return dto;
    }

    public AdminUserResponse toAdminUser(User user) {
        AdminUserResponse dto = new AdminUserResponse();
        dto.setId(user.getId());
        dto.setEmail(user.getEmail());
        dto.setFullName(user.getFullName());
        dto.setRole(user.getRole().name());
        dto.setAccountStatus(user.getAccountStatus().name());
        dto.setLastLoginAt(Dates.format(user.getLastLoginAt()));
        dto.setCreatedAt(Dates.format(user.getCreatedAt()));
        return dto;
    }
}
