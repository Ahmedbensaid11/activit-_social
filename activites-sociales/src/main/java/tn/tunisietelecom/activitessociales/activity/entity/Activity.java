package tn.tunisietelecom.activitessociales.activity.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import tn.tunisietelecom.activitessociales.activitytype.entity.ActivityType;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "activities")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Activity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "activity_type_id", nullable = false)
    private ActivityType activityType;

    @Column(nullable = false, length = 120)
    private String title;

    @Column(length = 800)
    private String description;

    @Column(length = 160)
    private String location;

    @Column(name = "starts_at")
    private LocalDateTime startsAt;

    @Column(name = "ends_at")
    private LocalDateTime endsAt;

    @Column(name = "registration_deadline")
    private LocalDateTime registrationDeadline;

    @Column(name = "capacity_max")
    private Integer capacityMax;

    @Column(name = "cover_photo_url", length = 1000)
    private String coverPhotoUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private ActivityStatus status = ActivityStatus.DRAFT;

    @Lob
    @Column(name = "custom_field_values", nullable = false)
    private String customFieldValues;

    @ElementCollection
    @CollectionTable(name = "activity_gallery_photos", joinColumns = @JoinColumn(name = "activity_id"))
    @Column(name = "photo_url", length = 1000)
    @OrderColumn(name = "sort_order")
    @Builder.Default
    private List<String> galleryPhotoUrls = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum ActivityStatus {
        DRAFT, OPEN, CLOSED, CANCELLED
    }
}
