package tn.tunisietelecom.activitessociales.rbac.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import java.util.Set;

@Data
public class CustomRoleRequest {
    @NotBlank @Size(max = 80)
    private String name;

    @Size(max = 300)
    private String description;

    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Couleur hex invalide")
    private String color = "#6366f1";

    private boolean active = true;

    private Set<Long> permissionIds;
}