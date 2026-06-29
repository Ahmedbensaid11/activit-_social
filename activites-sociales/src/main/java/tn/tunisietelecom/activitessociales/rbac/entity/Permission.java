package tn.tunisietelecom.activitessociales.rbac.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "permissions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Permission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 80)
    private String code; // e.g. "MANAGE_ACTIVITIES"

    @Column(nullable = false, length = 120)
    private String label; // e.g. "Gérer les activités"

    @Column(length = 300)
    private String description;

    @Column(nullable = false, length = 60)
    private String category; // e.g. "Activités", "Tickets", "Inscriptions"
}