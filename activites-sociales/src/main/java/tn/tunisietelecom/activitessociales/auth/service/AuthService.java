package tn.tunisietelecom.activitessociales.auth.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.*;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.tunisietelecom.activitessociales.audit.service.AuditService;
import tn.tunisietelecom.activitessociales.auth.dto.*;
import tn.tunisietelecom.activitessociales.auth.entity.*;
import tn.tunisietelecom.activitessociales.auth.repository.*;
import tn.tunisietelecom.activitessociales.common.exception.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final TokenBlacklistRepository tokenBlacklistRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailService emailService;
    private final AuthenticationManager authenticationManager;
    private final AuditService auditService;

    // ── Register ─────────────────────────────────────────────────────────────
    @Transactional
    public MessageResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Un compte avec cet email existe déjà.");
        }
        if (userRepository.existsByMatricule(request.getMatricule())) {
            throw new BadRequestException("Ce matricule est déjà utilisé.");
        }

        String activationToken = UUID.randomUUID().toString();

        User user = User.builder()
                .matricule(request.getMatricule())
                .nom(request.getNom())
                .prenom(request.getPrenom())
                .email(request.getEmail())
                .telephone(request.getTelephone())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(User.Role.PERSONNEL)
                .isActive(false)
                .activationToken(activationToken)
                .activationTokenExpiry(LocalDateTime.now().plusHours(24))
                .build();

        userRepository.save(user);
        emailService.sendActivationEmail(user.getEmail(), user.getFullName(), activationToken);
        auditService.log("REGISTER", "User", user.getId(), user.getEmail(), null, "Nouveau compte créé");

        return new MessageResponse("Compte créé avec succès. Veuillez vérifier votre email pour l'activer.");
    }

    // ── Activate ─────────────────────────────────────────────────────────────
    @Transactional
    public MessageResponse activateAccount(String token) {
        User user = userRepository.findByActivationToken(token)
                .orElseThrow(() -> new BadRequestException("Token d'activation invalide."));

        if (user.getActivationTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Le token d'activation a expiré.");
        }

        user.setActive(true);
        user.setActivationToken(null);
        user.setActivationTokenExpiry(null);
        userRepository.save(user);
        auditService.log("ACTIVATE_ACCOUNT", "User", user.getId(), user.getEmail(), null, "Compte activé");

        return new MessageResponse("Compte activé avec succès. Vous pouvez maintenant vous connecter.");
    }

    // ── Login ─────────────────────────────────────────────────────────────────
    public AuthResponse login(LoginRequest request, String ipAddress) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );
        } catch (BadCredentialsException e) {
            auditService.log("LOGIN_FAILED", "User", null, request.getEmail(), ipAddress, "Identifiants incorrects");
            throw new BadRequestException("Email ou mot de passe incorrect.");
        } catch (DisabledException e) {
            throw new BadRequestException("Compte non activé. Veuillez vérifier votre email.");
        }

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UsernameNotFoundException("Utilisateur introuvable."));

        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);
        auditService.log("LOGIN", "User", user.getId(), user.getEmail(), ipAddress, "Connexion réussie");

        return buildAuthResponse(user, accessToken, refreshToken);
    }

    // ── Refresh Token ─────────────────────────────────────────────────────────
    public AuthResponse refreshToken(String refreshToken) {
        if (tokenBlacklistRepository.existsByToken(refreshToken)) {
            throw new BadRequestException("Token invalide.");
        }
        String email = jwtService.extractEmail(refreshToken);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Utilisateur introuvable."));

        if (jwtService.isTokenExpired(refreshToken)) {
            throw new BadRequestException("Refresh token expiré. Veuillez vous reconnecter.");
        }

        String newAccessToken = jwtService.generateAccessToken(user);
        String newRefreshToken = jwtService.generateRefreshToken(user);

        return buildAuthResponse(user, newAccessToken, newRefreshToken);
    }

    // ── Change Password ───────────────────────────────────────────────────────
    @Transactional
    public MessageResponse changePassword(String email, ChangePasswordRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Utilisateur introuvable."));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BadRequestException("Mot de passe actuel incorrect.");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        auditService.log("CHANGE_PASSWORD", "User", user.getId(), email, null, "Mot de passe modifié");

        return new MessageResponse("Mot de passe modifié avec succès.");
    }

    // ── Logout ────────────────────────────────────────────────────────────────
    @Transactional
    public MessageResponse logout(String token, String email) {
        tokenBlacklistRepository.save(TokenBlacklist.builder().token(token).build());
        auditService.log("LOGOUT", "User", null, email, null, "Déconnexion");
        return new MessageResponse("Déconnexion réussie.");
    }

    // ── Forgot Password ───────────────────────────────────────────────────────
    @Transactional
    public MessageResponse forgotPassword(String email) {
        userRepository.findByEmail(email).ifPresent(user -> {
            String token = UUID.randomUUID().toString();
            user.setResetPasswordToken(token);
            user.setResetPasswordTokenExpiry(LocalDateTime.now().plusMinutes(15));
            userRepository.save(user);
            emailService.sendResetPasswordEmail(user.getEmail(), user.getFullName(), token);
            auditService.log("FORGOT_PASSWORD", "User", user.getId(), email, null, "Demande de reset password");
        });
        return new MessageResponse("Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.");
    }

    // ── Reset Password ────────────────────────────────────────────────────────
    @Transactional
    public MessageResponse resetPassword(ResetPasswordRequest request) {
        User user = userRepository.findByResetPasswordToken(request.getToken())
                .orElseThrow(() -> new BadRequestException("Token de réinitialisation invalide."));

        if (user.getResetPasswordTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Le token de réinitialisation a expiré.");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        user.setResetPasswordToken(null);
        user.setResetPasswordTokenExpiry(null);
        userRepository.save(user);
        auditService.log("RESET_PASSWORD", "User", user.getId(), user.getEmail(), null, "Mot de passe réinitialisé");

        return new MessageResponse("Mot de passe réinitialisé avec succès.");
    }

    private AuthResponse buildAuthResponse(User user, String accessToken, String refreshToken) {
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .id(user.getId())
                .matricule(user.getMatricule())
                .nom(user.getNom())
                .prenom(user.getPrenom())
                .email(user.getEmail())
                .telephone(user.getTelephone())
                .role(user.getRole().name())
                .photoUrl(user.getPhotoUrl())
                .build();
    }
}
