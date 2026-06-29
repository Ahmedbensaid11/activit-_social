package tn.tunisietelecom.activitessociales.registration.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import tn.tunisietelecom.activitessociales.activity.entity.Activity;
import tn.tunisietelecom.activitessociales.auth.entity.User;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "registrations",
        uniqueConstraints = @UniqueConstraint(name = "uk_registration_user_activity", columnNames = {"user_id", "activity_id"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Registration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "activity_id", nullable = false)
    private Activity activity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private RegistrationStatus status = RegistrationStatus.PENDING;

    @Column(name = "motif_rejet", length = 500)
    private String motifRejet;

    @Column(name = "qr_code_path", length = 1000)
    private String qrCodePath;

    @Lob
    @Column(name = "extra_data", nullable = false)
    @Builder.Default
    private String extraData = "{}";

    /**
     * Number of seats reserved (1 = employee only, >1 = employee + family members).
     */
    @Column(name = "seat_count", nullable = false)
    @Builder.Default
    private Integer seatCount = 1;

    @Column(name = "registered_at", nullable = false)
    private LocalDateTime registeredAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "validated_at")
    private LocalDateTime validatedAt;

    public enum RegistrationStatus {
        PENDING, APPROVED, REJECTED
    }
}