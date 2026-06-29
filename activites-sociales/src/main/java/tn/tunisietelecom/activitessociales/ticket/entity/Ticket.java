package tn.tunisietelecom.activitessociales.ticket.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import tn.tunisietelecom.activitessociales.auth.entity.User;

import java.time.LocalDateTime;

@Entity
@Table(name = "tickets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Ticket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** Auto-generated label, e.g. "RESTAURANT - Juin 2026" */
    @Column(nullable = false, length = 150)
    private String nom;

    @Column(name = "nb_tickets", nullable = false)
    private Integer nbTickets;

    @Enumerated(EnumType.STRING)
    @Column(name = "type_ticket", nullable = false, length = 30)
    private TicketType typeTicket;

    /** true when the ticket is a Pluxee restaurant card reload */
    @Column(nullable = false)
    @Builder.Default
    private boolean restauration = true;

    /** Daily meal value agreed by company, e.g. "8 DT/jour" */
    @Column(length = 100)
    private String offre;

    /** Path/URL to the attendance justification document */
    @Column(name = "document_path", length = 1000)
    private String documentPath;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private TicketStatus status = TicketStatus.PENDING;

    @Column(name = "motif_rejet", length = 500)
    private String motifRejet;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // ── Enums ──────────────────────────────────────────────────────────────

    public enum TicketType {
        RESTAURANT, CARBURANT, CADEAU
    }

    public enum TicketStatus {
        PENDING, APPROVED, REJECTED
    }
}
