package com.internshipjp.backend.repository;

import com.internshipjp.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.internshipjp.backend.entity.AccountStatus;
import com.internshipjp.backend.entity.Role;
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
    Page<User> findByRole(Role role, Pageable pageable);
    Page<User> findByAccountStatus(AccountStatus status, Pageable pageable);
    Page<User> findByEmailContainingIgnoreCaseOrFullNameContainingIgnoreCase(String email, String fullName, Pageable pageable);

}
