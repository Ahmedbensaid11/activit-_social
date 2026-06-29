package tn.tunisietelecom.activitessociales.ticket.service;

import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.tunisietelecom.activitessociales.audit.service.AuditService;
import tn.tunisietelecom.activitessociales.auth.entity.User;
import tn.tunisietelecom.activitessociales.auth.repository.UserRepository;
import tn.tunisietelecom.activitessociales.auth.service.EmailService;
import tn.tunisietelecom.activitessociales.common.exception.BadRequestException;
import tn.tunisietelecom.activitessociales.common.exception.ResourceNotFoundException;
import tn.tunisietelecom.activitessociales.ticket.dto.*;
import tn.tunisietelecom.activitessociales.ticket.entity.Ticket;
import tn.tunisietelecom.activitessociales.ticket.repository.TicketRepository;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class PluxeeTicketService {

    private final TicketRepository ticketRepository;
    private final UserRepository   userRepository;
    private final EmailService     emailService;
    private final AuditService     auditService;
    private final EntityManager    entityManager;
    private final tn.tunisietelecom.activitessociales.notification.service.NotificationService notificationService;

    // ── Create ────────────────────────────────────────────────────────────

    @Transactional
    @tn.tunisietelecom.activitessociales.audit.annotation.Auditable(action = "TICKET_CREATE")
    public TicketResponse create(TicketRequest request, String email) {
        User user = findUser(email);

        // Monthly quota check: only one active ticket per employee per month
        LocalDateTime startOfMonth = LocalDateTime.now()
                .withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime startOfNextMonth = startOfMonth.plusMonths(1);

        if (ticketRepository.existsByUserIdAndStatusInAndCreatedAtBetween(
                user.getId(),
                List.of(Ticket.TicketStatus.PENDING, Ticket.TicketStatus.APPROVED),
                startOfMonth, startOfNextMonth)) {
            throw new BadRequestException(
                    "Vous avez déjà une demande de ticket en cours pour ce mois.");
        }

        // Auto-generate a human-readable label
        String monthLabel = LocalDateTime.now()
                .format(DateTimeFormatter.ofPattern("MMMM yyyy", Locale.FRENCH));
        String nom = request.getTypeTicket().name() + " - " + monthLabel;

        boolean isRestaurant = request.getTypeTicket() == Ticket.TicketType.RESTAURANT;

        Ticket ticket = Ticket.builder()
                .user(user)
                .nom(nom)
                .nbTickets(request.getNbTickets())
                .typeTicket(request.getTypeTicket())
                .restauration(isRestaurant)
                .offre(request.getOffre())
                .documentPath(request.getDocumentPath())
                .status(Ticket.TicketStatus.PENDING)
                .build();

        Ticket saved = ticketRepository.save(ticket);
        auditService.log("TICKET_CREATED", "Ticket", saved.getId(), email, null,
                "Demande de ticket créée : " + nom);
        return toResponse(saved);
    }

    // ── Employee: my tickets ──────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<TicketResponse> myTickets(String email, Pageable pageable) {
        User user = findUser(email);
        return ticketRepository.findByUserIdOrderByCreatedAtDesc(user.getId(), pageable)
                .map(this::toResponse);
    }

    /** Used by the frontend to know if the employee already submitted this month */
    @Transactional(readOnly = true)
    public boolean hasActiveTicketThisMonth(String email) {
        User user = findUser(email);
        LocalDateTime startOfMonth = LocalDateTime.now()
                .withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
        return ticketRepository.existsByUserIdAndStatusInAndCreatedAtBetween(
                user.getId(),
                List.of(Ticket.TicketStatus.PENDING, Ticket.TicketStatus.APPROVED),
                startOfMonth, startOfMonth.plusMonths(1));
    }

    // ── Admin: search ─────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<TicketResponse> adminSearch(
            Ticket.TicketStatus status,
            Integer month,
            Integer year,
            String employee,
            Pageable pageable) {

        StringBuilder jpql = new StringBuilder("select t from Ticket t join fetch t.user u where 1=1");
        Map<String, Object> params = new HashMap<>();

        if (status != null) {
            jpql.append(" and t.status = :status");
            params.put("status", status);
        }

        if (month != null && year != null) {
            LocalDateTime start = LocalDateTime.of(year, month, 1, 0, 0);
            LocalDateTime end   = start.plusMonths(1);
            jpql.append(" and t.createdAt >= :start and t.createdAt < :end");
            params.put("start", start);
            params.put("end", end);
        }

        String employeeFilter = (employee != null && !employee.isBlank()) ? employee.trim() : null;
        if (employeeFilter != null) {
            jpql.append("""
                 and (lower(u.email)      like lower(:employeePattern)
                  or lower(u.nom)        like lower(:employeePattern)
                  or lower(u.prenom)     like lower(:employeePattern)
                  or lower(u.matricule)  like lower(:employeePattern))
                """);
            params.put("employeePattern", "%" + employeeFilter + "%");
        }

        // Count query for pagination (without fetch join because count query doesn't support it)
        String countJpql = jpql.toString()
                .replace("select t from Ticket t join fetch t.user u", "select count(t) from Ticket t join t.user u");

        // Add sorting to main query
        jpql.append(" order by t.createdAt desc");

        // Create JPA Queries
        TypedQuery<Ticket> query = entityManager.createQuery(jpql.toString(), Ticket.class);
        TypedQuery<Long> countQuery = entityManager.createQuery(countJpql, Long.class);

        // Bind parameters
        for (Map.Entry<String, Object> entry : params.entrySet()) {
            query.setParameter(entry.getKey(), entry.getValue());
            countQuery.setParameter(entry.getKey(), entry.getValue());
        }

        // Apply pagination
        query.setFirstResult((int) pageable.getOffset());
        query.setMaxResults(pageable.getPageSize());

        List<Ticket> list = query.getResultList();
        long total = countQuery.getSingleResult();

        List<TicketResponse> dtoList = list.stream().map(this::toResponse).toList();
        return new PageImpl<>(dtoList, pageable, total);
    }

    @Transactional(readOnly = true)
    public long countPending() {
        return ticketRepository.countByStatus(Ticket.TicketStatus.PENDING);
    }

    // ── Admin: approve ────────────────────────────────────────────────────

    @Transactional
    @tn.tunisietelecom.activitessociales.audit.annotation.Auditable(action = "TICKET_APPROVE")
    public TicketResponse approve(Long id, String adminEmail) {
        Ticket ticket = findTicket(id);
        ticket.setStatus(Ticket.TicketStatus.APPROVED);
        Ticket saved = ticketRepository.save(ticket);

        auditService.log("TICKET_APPROVED", "Ticket", id, adminEmail, null,
                "Ticket approuvé : " + ticket.getNom());

        emailService.sendTicketStatusEmail(
                ticket.getUser().getEmail(),
                ticket.getUser().getPrenom() + " " + ticket.getUser().getNom(),
                ticket.getNom(),
                "APPROVED",
                null);

        notificationService.notifyUser(
                ticket.getUser().getId(),
                "Demande de Ticket Pluxee Approuvée",
                "Votre demande de recharge ticket " + ticket.getNom() + " a été approuvée.",
                tn.tunisietelecom.activitessociales.notification.entity.Notification.NotificationType.SUCCESS
        );

        return toResponse(saved);
    }

    // ── Admin: reject ─────────────────────────────────────────────────────

    @Transactional
    @tn.tunisietelecom.activitessociales.audit.annotation.Auditable(action = "TICKET_REJECT")
    public TicketResponse reject(Long id, RejectTicketRequest request, String adminEmail) {
        Ticket ticket = findTicket(id);
        ticket.setStatus(Ticket.TicketStatus.REJECTED);
        ticket.setMotifRejet(request.getMotifRejet());
        Ticket saved = ticketRepository.save(ticket);

        auditService.log("TICKET_REJECTED", "Ticket", id, adminEmail, null,
                "Ticket rejeté : " + ticket.getNom() + " | Motif : " + request.getMotifRejet());

        emailService.sendTicketStatusEmail(
                ticket.getUser().getEmail(),
                ticket.getUser().getPrenom() + " " + ticket.getUser().getNom(),
                ticket.getNom(),
                "REJECTED",
                request.getMotifRejet());

        notificationService.notifyUser(
                ticket.getUser().getId(),
                "Demande de Ticket Pluxee Rejetée",
                "Votre demande de recharge ticket " + ticket.getNom() + " a été rejetée. Motif : " + request.getMotifRejet(),
                tn.tunisietelecom.activitessociales.notification.entity.Notification.NotificationType.ERROR
        );

        return toResponse(saved);
    }

    // ── Admin: delete ─────────────────────────────────────────────────────

    @Transactional
    @tn.tunisietelecom.activitessociales.audit.annotation.Auditable(action = "TICKET_DELETE")
    public void delete(Long id, String adminEmail) {
        Ticket ticket = findTicket(id);
        ticketRepository.delete(ticket);
        auditService.log("TICKET_DELETED", "Ticket", id, adminEmail, null,
                "Ticket supprimé : " + ticket.getNom());
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private Ticket findTicket(Long id) {
        return ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket introuvable : " + id));
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable : " + email));
    }

    private TicketResponse toResponse(Ticket t) {
        return TicketResponse.builder()
                .id(t.getId())
                .userId(t.getUser().getId())
                .userFullName(t.getUser().getPrenom() + " " + t.getUser().getNom())
                .userEmail(t.getUser().getEmail())
                .userMatricule(t.getUser().getMatricule())
                .nom(t.getNom())
                .nbTickets(t.getNbTickets())
                .typeTicket(t.getTypeTicket())
                .restauration(t.isRestauration())
                .offre(t.getOffre())
                .documentPath(t.getDocumentPath())
                .status(t.getStatus())
                .motifRejet(t.getMotifRejet())
                .createdAt(t.getCreatedAt())
                .updatedAt(t.getUpdatedAt())
                .build();
    }
}
