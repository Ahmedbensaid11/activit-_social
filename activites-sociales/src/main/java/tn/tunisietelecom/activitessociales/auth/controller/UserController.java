package tn.tunisietelecom.activitessociales.auth.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import tn.tunisietelecom.activitessociales.auth.dto.UpdateProfileRequest;
import tn.tunisietelecom.activitessociales.auth.dto.UserProfileResponse;
import tn.tunisietelecom.activitessociales.auth.service.UserService;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "Profil utilisateur", description = "Consultation et mise à jour du profil")
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    @Operation(summary = "Récupérer le profil de l'utilisateur connecté")
    public ResponseEntity<UserProfileResponse> getMyProfile(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(userService.getProfile(userDetails.getUsername()));
    }

    @PatchMapping("/me")
    @Operation(summary = "Mettre à jour les informations du profil")
    public ResponseEntity<UserProfileResponse> updateMyProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(userService.updateProfile(userDetails.getUsername(), request));
    }

    @PostMapping("/me/photo")
    @Operation(summary = "Uploader ou remplacer la photo de profil")
    public ResponseEntity<UserProfileResponse> uploadPhoto(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(userService.uploadPhoto(userDetails.getUsername(), file));
    }

    @DeleteMapping("/me/photo")
    @Operation(summary = "Supprimer la photo de profil")
    public ResponseEntity<UserProfileResponse> deletePhoto(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(userService.deletePhoto(userDetails.getUsername()));
    }
}
