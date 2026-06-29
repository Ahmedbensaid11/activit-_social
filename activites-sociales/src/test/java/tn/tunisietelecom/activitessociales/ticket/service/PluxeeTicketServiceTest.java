package tn.tunisietelecom.activitessociales.ticket.service;

import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import tn.tunisietelecom.activitessociales.audit.service.AuditService;
import tn.tunisietelecom.activitessociales.auth.entity.User;
import tn.tunisietelecom.activitessociales.auth.repository.UserRepository;
import tn.tunisietelecom.activitessociales.auth.service.EmailService;
import tn.tunisietelecom.activitessociales.common.exception.BadRequestException;
import tn.tunisietelecom.activitessociales.common.exception.ResourceNotFoundException;
import tn.tunisietelecom.activitessociales.notification.service.NotificationService;
import tn.tunisietelecom.activitessociales.ticket.dto.*;
import tn.tunisietelecom.activitessociales.ticket.entity.Ticket;
import tn.tunisietelecom.activitessociales.ticket.repository.TicketRepository;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class PluxeeTicketServiceTest {

    @Mock private TicketRepository ticketRepository;
    @Mock private UserRepository userRepository;
    @Mock private EmailService emailService;
    @Mock private AuditService auditService;
    @Mock private EntityManager entityManager;
    @Mock private NotificationService notificationService;

    @InjectMocks
    private PluxeeTicketService pluxeeTicketService;

    @Test
    public void createTicket_success() {
        // Arrange
        TicketRequest request = new TicketRequest();
        request.setTypeTicket(Ticket.TicketType.RESTAURANT);
        request.setNbTickets(15);
        request.setOffre("8 DT/jour");

        User user = new User();
        user.setId(1L);
        user.setEmail("employee@tt.tn");

        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(user));

        // Mock monthly check
        TypedQuery<Long> query = mock(TypedQuery.class);
        when(entityManager.createQuery(anyString(), eq(Long.class))).thenReturn(query);
        when(query.setParameter(anyString(), any())).thenReturn(query);
        when(query.getSingleResult()).thenReturn(0L); // 0 tickets this month

        Ticket savedTicket = new Ticket();
        savedTicket.setId(10L);
        savedTicket.setUser(user);
        savedTicket.setTypeTicket(Ticket.TicketType.RESTAURANT);
        savedTicket.setStatus(Ticket.TicketStatus.PENDING);

        when(ticketRepository.save(any(Ticket.class))).thenReturn(savedTicket);

        // Act
        TicketResponse response = pluxeeTicketService.create(request, "employee@tt.tn");

        // Assert
        assertNotNull(response);
        assertEquals(10L, response.getId());
        assertEquals("PENDING", response.getStatus());
        verify(ticketRepository, times(1)).save(any(Ticket.class));
    }

    @Test
    public void createTicket_monthlyQuotaExceeded() {
        // Arrange
        TicketRequest request = new TicketRequest();
        request.setTypeTicket(Ticket.TicketType.RESTAURANT);

        User user = new User();
        user.setId(1L);
        user.setEmail("employee@tt.tn");

        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(user));

        // Mock monthly check to return 1 (already has ticket this month)
        TypedQuery<Long> query = mock(TypedQuery.class);
        when(entityManager.createQuery(anyString(), eq(Long.class))).thenReturn(query);
        when(query.setParameter(anyString(), any())).thenReturn(query);
        when(query.getSingleResult()).thenReturn(1L);

        // Act & Assert
        assertThrows(BadRequestException.class, () -> {
            pluxeeTicketService.create(request, "employee@tt.tn");
        });
        verify(ticketRepository, never()).save(any(Ticket.class));
    }

    @Test
    public void approveTicket_success() {
        // Arrange
        User user = new User();
        user.setId(1L);
        user.setEmail("employee@tt.tn");
        user.setNom("Nom");
        user.setPrenom("Prenom");

        Ticket ticket = new Ticket();
        ticket.setId(10L);
        ticket.setUser(user);
        ticket.setNom("Ticket Janvier");
        ticket.setStatus(Ticket.TicketStatus.PENDING);

        when(ticketRepository.findById(10L)).thenReturn(Optional.of(ticket));
        when(ticketRepository.save(any(Ticket.class))).thenAnswer(i -> i.getArguments()[0]);

        // Act
        TicketResponse response = pluxeeTicketService.approve(10L, "admin@tt.tn");

        // Assert
        assertNotNull(response);
        assertEquals("APPROVED", response.getStatus());
        verify(emailService, times(1)).sendTicketStatusEmail(eq("employee@tt.tn"), anyString(), eq("Ticket Janvier"), eq("APPROVED"), any());
        verify(notificationService, times(1)).notifyUser(eq(1L), anyString(), anyString(), any());
    }

    @Test
    public void rejectTicket_success() {
        // Arrange
        User user = new User();
        user.setId(1L);
        user.setEmail("employee@tt.tn");
        user.setNom("Nom");
        user.setPrenom("Prenom");

        Ticket ticket = new Ticket();
        ticket.setId(10L);
        ticket.setUser(user);
        ticket.setNom("Ticket Janvier");
        ticket.setStatus(Ticket.TicketStatus.PENDING);

        RejectTicketRequest rejectReq = new RejectTicketRequest();
        rejectReq.setMotifRejet("Dossier incomplet");

        when(ticketRepository.findById(10L)).thenReturn(Optional.of(ticket));
        when(ticketRepository.save(any(Ticket.class))).thenAnswer(i -> i.getArguments()[0]);

        // Act
        TicketResponse response = pluxeeTicketService.reject(10L, rejectReq, "admin@tt.tn");

        // Assert
        assertNotNull(response);
        assertEquals("REJECTED", response.getStatus());
        assertEquals("Dossier incomplet", ticket.getMotifRejet());
        verify(emailService, times(1)).sendTicketStatusEmail(eq("employee@tt.tn"), anyString(), eq("Ticket Janvier"), eq("REJECTED"), eq("Dossier incomplet"));
        verify(notificationService, times(1)).notifyUser(eq(1L), anyString(), anyString(), any());
    }
}
