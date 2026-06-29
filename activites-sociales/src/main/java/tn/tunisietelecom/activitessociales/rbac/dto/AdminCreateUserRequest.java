package tn.tunisietelecom.activitessociales.rbac.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import tn.tunisietelecom.activitessociales.auth.entity.User;
import java.util.Set;

@Data
public class AdminCreateUserRequest {
    @NotBlank @Size(min = 4, max = 20)
    private String matricule;

    @NotBlank @Size(max = 50)
    private String nom;

    @NotBlank @Size(max = 50)
    private String prenom;

    @NotBlank @Email
    private String email;

    @Pattern(regexp = "^[0-9]{8}$", message = "Téléphone doit contenir 8 chiffres")
    private String telephone;

    @NotBlank @Size(min = 8)
    private String password;

    @NotNull
    private User.Role role; // ADMIN or PERSONNEL

    private Set<Long> customRoleIds;

    private boolean sendActivationEmail = true;
}