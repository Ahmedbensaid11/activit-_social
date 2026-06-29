package tn.tunisietelecom.activitessociales.ticket.dto;

import lombok.*;
import tn.tunisietelecom.activitessociales.ticket.entity.Ticket;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketResponse {

    private Long id;

    // ── Employee info ───────────────────────────────────────────────────────
    private Long   userId;
    private String userFullName;
    private String userEmail;
    private String userMatricule;

    // ── Ticket fields ───────────────────────────────────────────────────────
    private String            nom;
    private Integer           nbTickets;
    private Ticket.TicketType typeTicket;
    private boolean           restauration;
    private String            offre;
    private String            documentPath;
    private Ticket.TicketStatus status;
    private String            motifRejet;

    // ── Timestamps ──────────────────────────────────────────────────────────
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
