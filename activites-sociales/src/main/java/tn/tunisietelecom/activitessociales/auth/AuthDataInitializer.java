package tn.tunisietelecom.activitessociales.auth;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import tn.tunisietelecom.activitessociales.auth.entity.User;
import tn.tunisietelecom.activitessociales.auth.repository.UserRepository;

@Component
@RequiredArgsConstructor
public class AuthDataInitializer implements CommandLineRunner {

    private static final String DEFAULT_PASSWORD = "Password123!";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        createUserIfMissing(
                "ADM001",
                "Admin",
                "System",
                "admin@tunisietelecom.tn",
                "+21600000000",
                User.Role.ADMIN
        );

        createUserIfMissing(
                "EMP001",
                "Personnel",
                "Demo",
                "personnel@tunisietelecom.tn",
                "+21611111111",
                User.Role.PERSONNEL
        );
    }

    private void createUserIfMissing(
            String matricule,
            String nom,
            String prenom,
            String email,
            String telephone,
            User.Role role
    ) {
        if (userRepository.existsByEmail(email) || userRepository.existsByMatricule(matricule)) {
            return;
        }

        userRepository.save(User.builder()
                .matricule(matricule)
                .nom(nom)
                .prenom(prenom)
                .email(email)
                .telephone(telephone)
                .password(passwordEncoder.encode(DEFAULT_PASSWORD))
                .role(role)
                .isActive(true)
                .build());
    }
}
