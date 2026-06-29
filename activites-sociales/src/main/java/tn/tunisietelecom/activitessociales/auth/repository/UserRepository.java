package tn.tunisietelecom.activitessociales.auth.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import tn.tunisietelecom.activitessociales.auth.entity.User;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByMatricule(String matricule);
    Optional<User> findByActivationToken(String token);
    Optional<User> findByResetPasswordToken(String token);
    boolean existsByEmail(String email);
    boolean existsByMatricule(String matricule);
    java.util.List<User> findByIsActiveTrue();
}
