package tn.tunisietelecom.activitessociales.rbac.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.Set;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class AdminUserResponse {
    private Long id;
    private String matricule;
    private String nom;
    private String prenom;
    private String email;
    private String telephone;
    private String role;
    private boolean active;
    private String photoUrl;
    private Set<CustomRoleResponse> customRoles;
    private Set<String> allPermissions; // merged from all custom roles
    private LocalDateTime createdAt;
}