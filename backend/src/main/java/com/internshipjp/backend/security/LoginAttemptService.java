package com.internshipjp.backend.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Slows down password guessing.
 *
 * WHY THE LOCK IS TEMPORARY, NOT A STATUS ON THE ACCOUNT
 *   Setting AccountStatus.SUSPENDED after failed logins would be worse than
 *   doing nothing. Anyone who knows your email could lock you out permanently
 *   by typing a wrong password five times, and an administrator could not tell
 *   that suspension apart from one they issued themselves. A lock that expires
 *   on its own stops the attack without handing anyone a weapon.
 *
 * WHY IT IS KEYED ON THE EMAIL
 *   Locking by IP address punishes everyone behind one office router, and does
 *   not stop an attacker with several addresses. Per-email is the thing being
 *   attacked.
 *
 * WHAT THIS DOES NOT DO
 *   The counters live in memory. They reset when the backend restarts, and two
 *   instances behind a load balancer would each keep their own. For a single
 *   deployment that is fine; a cluster would need this in Redis or the
 *   database. Saying so is better than implying a guarantee that is not there.
 */
@Service
public class LoginAttemptService {

    private static final Logger log = LoggerFactory.getLogger(LoginAttemptService.class);

    /** Failures allowed before the address is locked. */
    public static final int MAX_ATTEMPTS = 5;

    /** How long a lock lasts. Long enough to ruin a guessing run, short enough
     *  that a person who mistyped their password is not stuck for the day. */
    private static final Duration LOCK_FOR = Duration.ofMinutes(15);

    /** Failures older than this stop counting, so an occasional typo months
     *  apart never accumulates into a lock. */
    private static final Duration FORGET_AFTER = Duration.ofMinutes(30);

    private record Attempts(int count, Instant lastFailure, Instant lockedUntil) {}

    private final Map<String, Attempts> byEmail = new ConcurrentHashMap<>();

    /** Whether this address is currently locked out. */
    public boolean isLocked(String email) {
        Attempts state = byEmail.get(key(email));
        if (state == null || state.lockedUntil() == null) {
            return false;
        }
        if (Instant.now().isAfter(state.lockedUntil())) {
            byEmail.remove(key(email));
            return false;
        }
        return true;
    }

    /** Whole minutes left on the lock, at least 1 so it never reads "0 minutes". */
    public long minutesRemaining(String email) {
        Attempts state = byEmail.get(key(email));
        if (state == null || state.lockedUntil() == null) {
            return 0;
        }
        long seconds = Duration.between(Instant.now(), state.lockedUntil()).getSeconds();
        return Math.max(1, (seconds + 59) / 60);
    }

    /** How many tries are left before the lock. */
    public int attemptsRemaining(String email) {
        Attempts state = current(key(email));
        return Math.max(0, MAX_ATTEMPTS - (state == null ? 0 : state.count()));
    }

    /** Records a failure and locks the address once the limit is reached. */
    public void recordFailure(String email) {
        String k = key(email);
        Attempts previous = current(k);
        int count = (previous == null ? 0 : previous.count()) + 1;

        if (count >= MAX_ATTEMPTS) {
            Instant until = Instant.now().plus(LOCK_FOR);
            byEmail.put(k, new Attempts(count, Instant.now(), until));
            log.warn("Locked sign-in for {} after {} failed attempts. Unlocks at {}.",
                    k, count, until);
            return;
        }
        byEmail.put(k, new Attempts(count, Instant.now(), null));
    }

    /** Clears the count. Called on every successful sign-in. */
    public void recordSuccess(String email) {
        byEmail.remove(key(email));
    }

    /** An administrator releasing a lock on request. */
    public void unlock(String email) {
        if (byEmail.remove(key(email)) != null) {
            log.info("An administrator released the sign-in lock on {}", key(email));
        }
    }

    /** Drops a record that has aged out, so old failures never accumulate. */
    private Attempts current(String key) {
        Attempts state = byEmail.get(key);
        if (state == null) {
            return null;
        }
        if (state.lockedUntil() == null
                && Instant.now().isAfter(state.lastFailure().plus(FORGET_AFTER))) {
            byEmail.remove(key);
            return null;
        }
        return state;
    }

    private String key(String email) {
        return email == null ? "" : email.trim().toLowerCase(java.util.Locale.ROOT);
    }
}
