package com.internshipjp.backend.repository;

import com.internshipjp.backend.entity.EmailOtpChallenge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.internshipjp.backend.entity.OtpPurpose;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Issued email OTP codes. Owner: Member 2.
 */
@Repository
public interface EmailOtpChallengeRepository extends JpaRepository<EmailOtpChallenge, Long> {

    /** Most recent challenge that has not been used yet. */
    Optional<EmailOtpChallenge> findTopByUserIdAndPurposeAndConsumedAtIsNullOrderByCreatedAtDesc(Long userId, OtpPurpose purpose);

    /**
     * Spent challenges: used already, or past their expiry.
     *
     * Neither can ever be redeemed again - the finder above only looks at
     * unconsumed rows, and the verification step refuses an expired one - so
     * these are dead weight from the moment they are written. No retention
     * window applies: a code that cannot be redeemed holds nothing worth
     * keeping.
     */
    @Query("SELECT COUNT(c) FROM EmailOtpChallenge c "
            + "WHERE c.consumedAt IS NOT NULL OR c.expiresAt < :now")
    long countSpent(@Param("now") LocalDateTime now);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM EmailOtpChallenge c "
            + "WHERE c.consumedAt IS NOT NULL OR c.expiresAt < :now")
    int deleteSpent(@Param("now") LocalDateTime now);

}
