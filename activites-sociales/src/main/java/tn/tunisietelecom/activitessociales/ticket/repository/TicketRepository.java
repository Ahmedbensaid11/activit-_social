package tn.tunisietelecom.activitessociales.ticket.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import tn.tunisietelecom.activitessociales.ticket.entity.Ticket;

import java.time.LocalDateTime;
import java.util.List;

public interface TicketRepository extends JpaRepository<Ticket, Long> {

    /** Monthly quota check — is there already an active ticket for this user in the given period? */
    boolean existsByUserIdAndStatusInAndCreatedAtBetween(
            Long userId,
            List<Ticket.TicketStatus> statuses,
            LocalDateTime start,
            LocalDateTime end
    );

    /** Employee: their own tickets, newest first */
    Page<Ticket> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    /** Count pending tickets — used for admin badge */
    long countByStatus(Ticket.TicketStatus status);
}
