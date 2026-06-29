package tn.tunisietelecom.activitessociales.rbac.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import tn.tunisietelecom.activitessociales.auth.entity.User;
import java.util.Set;

@Data
public class AdminUpdateUserRequest {
    @NotBlank @Size(max = 50)
    private String nom;

    @NotBlank @Size(max = 50)
    private String prenom;

    @Size(max = 20)
    private String telephone;

    @NotNull
    private User.Role role;

    private boolean active;

    private Set<Long> customRoleIds;
}