package tn.tunisietelecom.activitessociales.registration.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import tn.tunisietelecom.activitessociales.activity.entity.Activity;
import tn.tunisietelecom.activitessociales.activity.repository.ActivityRepository;
import tn.tunisietelecom.activitessociales.audit.service.AuditService;
import tn.tunisietelecom.activitessociales.auth.entity.User;
import tn.tunisietelecom.activitessociales.auth.repository.UserRepository;
import tn.tunisietelecom.activitessociales.auth.service.EmailService;
import tn.tunisietelecom.activitessociales.common.exception.BadRequestException;
import tn.tunisietelecom.activitessociales.notification.service.NotificationService;
import tn.tunisietelecom.activitessociales.registration.dto.*;
import tn.tunisietelecom.activitessociales.registration.entity.Registration;
import tn.tunisietelecom.activitessociales.registration.repository.RegistrationRepository;

import org.springframework.core.io.ByteArrayResource;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class RegistrationServiceTest {

    @Mock private RegistrationRepository registrationRepository;
    @Mock private ActivityRepository activityRepository;
    @Mock private UserRepository userRepository;
    @Mock private QrCodeService qrCodeService;
    @Mock private TicketService ticketService;
    @Mock private ObjectMapper objectMapper;
    @Mock private AuditService auditService;
    @Mock private EmailService emailService;
    @Mock private NotificationService notificationService;

    @InjectMocks
    private RegistrationService registrationService;

    @Test
    public void register_success() {
        // Arrange
        User user = new User();
        user.setId(1L);
        user.setEmail("employee@tt.tn");

        Activity activity = new Activity();
        activity.setId(5L);
        activity.setTitle("Excursion Djerba");
        activity.setCapacityMax(50);
        activity.setStatus(Activity.ActivityStatus.PUBLISHED);
        activity.setRegistrationDeadline(LocalDateTime.now().plusDays(5));

        RegistrationRequest request = new RegistrationRequest();

        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(user));
        when(activityRepository.findById(5L)).thenReturn(Optional.of(activity));
        when(registrationRepository.existsByUserAndActivity(user, activity)).thenReturn(false);

        // Capacity mock: 10 approved + pending
        when(registrationRepository.countByActivityAndStatusIn(eq(activity), anyList())).thenReturn(10L);

        Registration saved = new Registration();
        saved.setId(100L);
        saved.setUser(user);
        saved.setActivity(activity);
        saved.setStatus(Registration.RegistrationStatus.PENDING);

        when(registrationRepository.save(any(Registration.class))).thenReturn(saved);

        // Act
        RegistrationResponse response = registrationService.register(5L, "employee@tt.tn", request);

        // Assert
        assertNotNull(response);
        assertEquals(100L, response.getId());
        assertEquals("PENDING", response.getStatus());
        verify(registrationRepository, times(1)).save(any(Registration.class));
    }

    @Test
    public void register_capacityFull() {
        // Arrange
        User user = new User();
        user.setId(1L);
        user.setEmail("employee@tt.tn");

        Activity activity = new Activity();
        activity.setId(5L);
        activity.setTitle("Excursion Djerba");
        activity.setCapacityMax(10); // low capacity
        activity.setStatus(Activity.ActivityStatus.PUBLISHED);
        activity.setRegistrationDeadline(LocalDateTime.now().plusDays(5));

        RegistrationRequest request = new RegistrationRequest();

        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(user));
        when(activityRepository.findById(5L)).thenReturn(Optional.of(activity));
        when(registrationRepository.existsByUserAndActivity(user, activity)).thenReturn(false);

        // Capacity full mock: 10 approved + pending
        when(registrationRepository.countByActivityAndStatusIn(eq(activity), anyList())).thenReturn(10L);

        // Act & Assert
        assertThrows(BadRequestException.class, () -> {
            registrationService.register(5L, "employee@tt.tn", request);
        });
        verify(registrationRepository, never()).save(any(Registration.class));
    }

    @Test
    public void approve_success() {
        // Arrange
        User user = new User();
        user.setId(1L);
        user.setEmail("employee@tt.tn");

        Activity activity = new Activity();
        activity.setId(5L);
        activity.setTitle("Excursion Djerba");
        activity.setCapacityMax(50);

        Registration registration = new Registration();
        registration.setId(100L);
        registration.setUser(user);
        registration.setActivity(activity);
        registration.setStatus(Registration.RegistrationStatus.PENDING);

        when(registrationRepository.findById(100L)).thenReturn(Optional.of(registration));
        when(registrationRepository.countByActivityAndStatusIn(eq(activity), anyList())).thenReturn(5L);
        when(registrationRepository.save(any(Registration.class))).thenAnswer(i -> i.getArguments()[0]);
        when(qrCodeService.generateQrCode(any())).thenReturn("/uploads/qrcodes/registration-100.png");
        when(registrationRepository.findByIdWithDetails(100L)).thenReturn(Optional.of(registration));
        when(ticketService.generateTicket(any())).thenReturn(new ByteArrayResource(new byte[]{1, 2, 3}));

        // Act
        RegistrationResponse response = registrationService.approve(100L, "admin@tt.tn");

        // Assert
        assertNotNull(response);
        assertEquals("APPROVED", response.getStatus());
        verify(qrCodeService, times(1)).generateQrCode(any(Registration.class));
        verify(ticketService, times(1)).generateTicket(any(Registration.class));
        verify(emailService, times(1)).sendStatusNotificationEmail(
                eq("employee@tt.tn"), any(), eq("Excursion Djerba"), eq("APPROVED"), isNull(), any(), eq(100L));
        verify(notificationService, times(1)).notifyUser(eq(1L), anyString(), anyString(), any());
    }

    @Test
    public void reject_success() {
        // Arrange
        User user = new User();
        user.setId(1L);
        user.setEmail("employee@tt.tn");

        Activity activity = new Activity();
        activity.setId(5L);
        activity.setTitle("Excursion Djerba");

        Registration registration = new Registration();
        registration.setId(100L);
        registration.setUser(user);
        registration.setActivity(activity);
        registration.setStatus(Registration.RegistrationStatus.PENDING);

        RejectRegistrationRequest rejectReq = new RejectRegistrationRequest();
        rejectReq.setMotifRejet("Pas éligible");

        when(registrationRepository.findById(100L)).thenReturn(Optional.of(registration));
        when(registrationRepository.save(any(Registration.class))).thenAnswer(i -> i.getArguments()[0]);

        // Act
        RegistrationResponse response = registrationService.reject(100L, rejectReq, "admin@tt.tn");

        // Assert
        assertNotNull(response);
        assertEquals("REJECTED", response.getStatus());
        assertEquals("Pas éligible", registration.getMotifRejet());
        verify(emailService, times(1)).sendStatusNotificationEmail(
                eq("employee@tt.tn"), any(), eq("Excursion Djerba"), eq("REJECTED"), eq("Pas éligible"), isNull(), isNull());
        verify(notificationService, times(1)).notifyUser(eq(1L), anyString(), anyString(), any());
    }
}
