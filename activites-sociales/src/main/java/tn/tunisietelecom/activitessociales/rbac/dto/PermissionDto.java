package tn.tunisietelecom.activitessociales.rbac.dto;

import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class PermissionDto {
    private Long id;
    private String code;
    private String label;
    private String description;
    private String category;
}