package tn.tunisietelecom.activitessociales.rbac.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.Set;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CustomRoleResponse {
    private Long id;
    private String name;
    private String description;
    private String color;
    private boolean active;
    private Set<PermissionDto> permissions;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}