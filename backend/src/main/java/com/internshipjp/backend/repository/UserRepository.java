package com.internshipjp.backend.repository;

import com.internshipjp.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.internshipjp.backend.entity.AccountStatus;
import com.internshipjp.backend.entity.Role;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Accounts. Owner: Member 2.
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

    /** Used by the demo-data seeder to find and remove only its own rows. */
    List<User> findByEmailEndingWith(String suffix);

    long countByRole(Role role);

    long countByAccountStatus(AccountStatus status);
    Page<User> findByRole(Role role, Pageable pageable);
    Page<User> findByAccountStatus(AccountStatus status, Pageable pageable);
    Page<User> findByEmailContainingIgnoreCaseOrFullNameContainingIgnoreCase(String email, String fullName, Pageable pageable);

}
