package com.internshipjp.backend.repository;

import com.internshipjp.backend.entity.EmailOtpChallenge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.internshipjp.backend.entity.OtpPurpose;
import java.util.Optional;

/**
 * Issued email OTP codes. Owner: Member 2.
 */
@Repository
public interface EmailOtpChallengeRepository extends JpaRepository<EmailOtpChallenge, Long> {

    /** Most recent challenge that has not been used yet. */
    Optional<EmailOtpChallenge> findTopByUserIdAndPurposeAndConsumedAtIsNullOrderByCreatedAtDesc(Long userId, OtpPurpose purpose);

}
