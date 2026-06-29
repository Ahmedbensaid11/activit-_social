package tn.tunisietelecom.activitessociales.auth.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import tn.tunisietelecom.activitessociales.audit.service.AuditService;
import tn.tunisietelecom.activitessociales.auth.dto.UpdateProfileRequest;
import tn.tunisietelecom.activitessociales.auth.dto.UserProfileResponse;
import tn.tunisietelecom.activitessociales.auth.entity.User;
import tn.tunisietelecom.activitessociales.auth.repository.UserRepository;
import tn.tunisietelecom.activitessociales.file.FileStorageService;
import tn.tunisietelecom.activitessociales.file.FileUploadResponse;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final AuditService auditService;

    public UserProfileResponse getProfile(String email) {
        User user = findByEmail(email);
        return toProfileResponse(user);
    }

    @Transactional
    public UserProfileResponse updateProfile(String email, UpdateProfileRequest request) {
        User user = findByEmail(email);
        user.setNom(request.getNom());
        user.setPrenom(request.getPrenom());
        user.setTelephone(request.getTelephone());
        userRepository.save(user);
        auditService.log("UPDATE_PROFILE", "User", user.getId(), email, null, "Profil mis à jour");
        return toProfileResponse(user);
    }

    @Transactional
    public UserProfileResponse uploadPhoto(String email, MultipartFile file) {
        User user = findByEmail(email);
        FileUploadResponse upload = fileStorageService.saveProfilePhoto(file);

        if (user.getPhotoUrl() != null) {
            fileStorageService.deleteByUrl(user.getPhotoUrl());
        }

        user.setPhotoUrl(upload.url());
        userRepository.save(user);
        auditService.log("UPDATE_PROFILE_PHOTO", "User", user.getId(), email, null, "Photo de profil mise à jour");
        return toProfileResponse(user);
    }

    @Transactional
    public UserProfileResponse deletePhoto(String email) {
        User user = findByEmail(email);
        if (user.getPhotoUrl() != null) {
            fileStorageService.deleteByUrl(user.getPhotoUrl());
            user.setPhotoUrl(null);
            userRepository.save(user);
            auditService.log("DELETE_PROFILE_PHOTO", "User", user.getId(), email, null, "Photo de profil supprimée");
        }
        return toProfileResponse(user);
    }

    private User findByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Utilisateur introuvable."));
    }

    public static UserProfileResponse toProfileResponse(User user) {
        return UserProfileResponse.builder()
                .id(user.getId())
                .matricule(user.getMatricule())
                .nom(user.getNom())
                .prenom(user.getPrenom())
                .email(user.getEmail())
                .telephone(user.getTelephone())
                .role(user.getRole().name())
                .photoUrl(user.getPhotoUrl())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
