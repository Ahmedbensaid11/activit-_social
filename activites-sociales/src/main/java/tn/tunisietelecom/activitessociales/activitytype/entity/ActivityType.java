package tn.tunisietelecom.activitessociales.activitytype.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "activity_types")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityType {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80)
    private String name;

    @Column(nullable = false, unique = true, length = 40)
    private String code;

    @Column(length = 500)
    private String description;

    @Column(length = 60)
    private String icon;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    @Lob
    @Column(name = "custom_fields_schema", nullable = false)
    private String customFieldsSchema;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
