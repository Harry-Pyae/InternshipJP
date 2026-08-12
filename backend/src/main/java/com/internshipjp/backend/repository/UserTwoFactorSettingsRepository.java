package com.internshipjp.backend.repository;

import com.internshipjp.backend.entity.UserTwoFactorSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Two-factor preferences, one row per user. Owner: Member 2.
 */
@Repository
public interface UserTwoFactorSettingsRepository extends JpaRepository<UserTwoFactorSettings, Long> {

    Optional<UserTwoFactorSettings> findByUserId(Long userId);

}
