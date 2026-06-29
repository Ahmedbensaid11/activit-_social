package tn.tunisietelecom.activitessociales.auth.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {
    private Long id;
    private String matricule;
    private String nom;
    private String prenom;
    private String email;
    private String telephone;
    private String role;
    private String photoUrl;
    private LocalDateTime createdAt;
}
