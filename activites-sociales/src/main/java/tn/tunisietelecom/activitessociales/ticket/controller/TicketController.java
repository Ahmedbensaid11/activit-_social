package tn.tunisietelecom.activitessociales.ticket.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import tn.tunisietelecom.activitessociales.ticket.dto.*;
import tn.tunisietelecom.activitessociales.ticket.entity.Ticket;
import tn.tunisietelecom.activitessociales.ticket.service.PluxeeTicketService;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@Tag(name = "Tickets", description = "Gestion des demandes de tickets Pluxee")
public class TicketController {

    private final PluxeeTicketService ticketService;

    // ── Employee endpoints ────────────────────────────────────────────────

    /** 5.3 – Submit a ticket request */
    @PostMapping("/api/tickets")
    @Operation(summary = "Soumettre une demande de ticket")
    public ResponseEntity<TicketResponse> create(
            @Valid @RequestBody TicketRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ticketService.create(request, userDetails.getUsername()));
    }

    /** 5.4 – Employee: my paginated tickets */
    @GetMapping("/api/tickets/me")
    @Operation(summary = "Mes demandes de tickets")
    public ResponseEntity<Page<TicketResponse>> myTickets(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size,
            @AuthenticationPrincipal UserDetails userDetails) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(ticketService.myTickets(userDetails.getUsername(), pageable));
    }

    /** Check if the employee already has an active ticket this month (for the form UI) */
    @GetMapping("/api/tickets/me/quota")
    @Operation(summary = "Vérifier le quota mensuel")
    public ResponseEntity<Map<String, Boolean>> checkQuota(
            @AuthenticationPrincipal UserDetails userDetails) {
        boolean used = ticketService.hasActiveTicketThisMonth(userDetails.getUsername());
        return ResponseEntity.ok(Map.of("quotaUsed", used));
    }

    // ── Admin endpoints ───────────────────────────────────────────────────

    /** 5.5 – Admin: all tickets with filters */
    @GetMapping("/api/tickets")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Tous les tickets (admin) filtrables")
    public ResponseEntity<Page<TicketResponse>> adminList(
            @RequestParam(required = false) Ticket.TicketStatus status,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) String  employee,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(
                ticketService.adminSearch(status, month, year, employee, pageable));
    }

    /** Badge: count of pending tickets */
    @GetMapping("/api/tickets/pending-count")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Nombre de tickets en attente")
    public ResponseEntity<Map<String, Long>> pendingCount() {
        return ResponseEntity.ok(Map.of("count", ticketService.countPending()));
    }

    /** 5.6 – Approve */
    @PatchMapping("/api/tickets/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Approuver un ticket")
    public ResponseEntity<TicketResponse> approve(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ticketService.approve(id, userDetails.getUsername()));
    }

    /** 5.7 – Reject with mandatory reason */
    @PatchMapping("/api/tickets/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Rejeter un ticket (motif obligatoire)")
    public ResponseEntity<TicketResponse> reject(
            @PathVariable Long id,
            @Valid @RequestBody RejectTicketRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(ticketService.reject(id, request, userDetails.getUsername()));
    }

    /** 5.8 – Delete (admin only) */
    @DeleteMapping("/api/tickets/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Supprimer un ticket")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        ticketService.delete(id, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }
}
