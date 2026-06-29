package tn.tunisietelecom.activitessociales.registration.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.*;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tn.tunisietelecom.activitessociales.activity.dto.ActivityResponse;
import tn.tunisietelecom.activitessociales.activity.entity.Activity;
import tn.tunisietelecom.activitessociales.activity.repository.ActivityRepository;
import tn.tunisietelecom.activitessociales.activitytype.dto.*;
import tn.tunisietelecom.activitessociales.activitytype.entity.ActivityType;
import tn.tunisietelecom.activitessociales.audit.service.AuditService;
import tn.tunisietelecom.activitessociales.auth.entity.User;
import tn.tunisietelecom.activitessociales.auth.repository.UserRepository;
import tn.tunisietelecom.activitessociales.common.exception.*;
import tn.tunisietelecom.activitessociales.auth.service.EmailService;
import tn.tunisietelecom.activitessociales.registration.dto.*;
import tn.tunisietelecom.activitessociales.registration.entity.Registration;
import tn.tunisietelecom.activitessociales.registration.repository.RegistrationRepository;

import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class RegistrationService {

    private final RegistrationRepository registrationRepository;
    private final ActivityRepository activityRepository;
    private final UserRepository userRepository;
    private final QrCodeService qrCodeService;
    private final TicketService ticketService;
    private final ObjectMapper objectMapper;
    private final AuditService     auditService;
    private final EmailService     emailService;
    private final tn.tunisietelecom.activitessociales.notification.service.NotificationService notificationService;

    // ── Public: seats remaining ───────────────────────────────────────────

    @Transactional(readOnly = true)
    public Map<String, Object> getAvailableSeats(Long activityId) {
        Activity activity = getActivity(activityId);
        long reserved = registrationRepository.sumReservedSeats(activityId);
        Integer cap = activity.getCapacityMax();
        long available = cap == null ? -1L : Math.max(0, cap - reserved);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("capacityMax", cap);
        result.put("reservedSeats", reserved);
        result.put("availableSeats", available);
        result.put("unlimited", cap == null);
        return result;
    }

    // ── Register ──────────────────────────────────────────────────────────

    @Transactional
    @tn.tunisietelecom.activitessociales.audit.annotation.Auditable(action = "REGISTRATION_CREATE")
    public RegistrationResponse register(Long activityId, String email, RegistrationRequest request) {
        User user = getUser(email);
        Activity activity = getActivity(activityId);

        int seats = (request != null && request.getSeatCount() != null && request.getSeatCount() > 0)
                ? request.getSeatCount() : 1;

        validateCanRegister(user, activity, seats);

        Registration registration = Registration.builder()
                .user(user)
                .activity(activity)
                .status(Registration.RegistrationStatus.PENDING)
                .registeredAt(LocalDateTime.now())
                .seatCount(seats)
                .extraData(writeExtraData(request == null ? null : request.getExtraData()))
                .build();

        Registration saved = registrationRepository.save(registration);
        auditService.log("REGISTRATION_CREATED", "Registration", saved.getId(), email, null,
                "Inscription creee pour activite " + activity.getId() + " (" + seats + " place(s))");
        return toResponse(saved);
    }

    // ── Cancel ────────────────────────────────────────────────────────────

    @Transactional
    @tn.tunisietelecom.activitessociales.audit.annotation.Auditable(action = "REGISTRATION_CANCEL")
    public void cancelRegistration(Long activityId, String email) {
        User user = getUser(email);
        Activity activity = getActivity(activityId);
        Registration registration = registrationRepository.findByUserIdAndActivityId(user.getId(), activity.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Inscription introuvable."));

        if (activity.getRegistrationDeadline() != null && activity.getRegistrationDeadline().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("La date limite d'annulation est depassee.");
        }
        if (registration.getStatus() == Registration.RegistrationStatus.APPROVED) {
            throw new BadRequestException("Une inscription approuvee ne peut plus etre supprimee.");
        }

        registrationRepository.delete(registration);
        auditService.log("REGISTRATION_CANCELLED", "Registration", registration.getId(), email, null,
                "Inscription supprimee par employe");
    }

    @Transactional(readOnly = true)
    public Page<RegistrationResponse> myRegistrations(String email, Pageable pageable) {
        User user = getUser(email);
        return registrationRepository.findByUserId(user.getId(), pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<RegistrationResponse> registrationsForActivity(Long activityId, Registration.RegistrationStatus status, Pageable pageable) {
        getActivity(activityId);
        if (status == null) {
            return registrationRepository.findByActivityId(activityId, pageable).map(this::toResponse);
        }
        return registrationRepository.findByActivityIdAndStatus(activityId, status, pageable).map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<RegistrationResponse> adminSearch(Long activityId, Registration.RegistrationStatus status, String employee, Pageable pageable) {
        String normalizedEmployee = normalizeSearch(employee);
        if (normalizedEmployee == null) {
            if (activityId != null && status != null) {
                return registrationRepository.findByActivityIdAndStatus(activityId, status, pageable).map(this::toResponse);
            }
            if (activityId != null) {
                return registrationRepository.findByActivityId(activityId, pageable).map(this::toResponse);
            }
            if (status != null) {
                return registrationRepository.findByStatus(status, pageable).map(this::toResponse);
            }
            return registrationRepository.findAll(pageable).map(this::toResponse);
        }
        return registrationRepository.searchAdmin(activityId, status, normalizedEmployee, pageable).map(this::toResponse);
    }

    @Transactional
    @tn.tunisietelecom.activitessociales.audit.annotation.Auditable(action = "REGISTRATION_APPROVE")
    public RegistrationResponse approve(Long id, String adminEmail) {
        Registration registration = getRegistration(id);
        if (registration.getStatus() != Registration.RegistrationStatus.PENDING) {
            throw new BadRequestException("Seules les inscriptions en attente peuvent etre approuvees.");
        }
        ensureCapacityForApprove(registration.getActivity(), registration.getSeatCount());

        registration.setStatus(Registration.RegistrationStatus.APPROVED);
        registration.setMotifRejet(null);
        Registration saved = registrationRepository.save(registration);
        saved.setQrCodePath(qrCodeService.generateQrCode(saved));
        saved = registrationRepository.save(saved);

        Registration savedWithDetails = registrationRepository.findByIdWithDetails(saved.getId())
                .orElse(saved);
        byte[] ticketPng = ticketService.generateTicket(savedWithDetails).getByteArray();

        emailService.sendStatusNotificationEmail(
                saved.getUser().getEmail(),
                saved.getUser().getFullName(),
                saved.getActivity().getTitle(),
                saved.getStatus().name(),
                null,
                ticketPng,
                saved.getId()
        );

        notificationService.notifyUser(
                saved.getUser().getId(),
                "Inscription Approuvée",
                "Votre inscription à l'activité \"" + saved.getActivity().getTitle() + "\" a été approuvée. Votre ticket d'inscription vous a été envoyé par email.",
                tn.tunisietelecom.activitessociales.notification.entity.Notification.NotificationType.SUCCESS
        );

        auditService.log("REGISTRATION_APPROVED", "Registration", saved.getId(), adminEmail, null,
                "Inscription approuvee pour " + saved.getUser().getEmail());
        return toResponse(saved);
    }

    @Transactional
    @tn.tunisietelecom.activitessociales.audit.annotation.Auditable(action = "REGISTRATION_REJECT")
    public RegistrationResponse reject(Long id, RejectRegistrationRequest request, String adminEmail) {
        Registration registration = getRegistration(id);
        if (registration.getStatus() != Registration.RegistrationStatus.PENDING) {
            throw new BadRequestException("Seules les inscriptions en attente peuvent etre rejetees.");
        }

        registration.setStatus(Registration.RegistrationStatus.REJECTED);
        registration.setMotifRejet(request.getMotifRejet().trim());
        registration.setQrCodePath(null);
        Registration saved = registrationRepository.save(registration);

        emailService.sendStatusNotificationEmail(
                saved.getUser().getEmail(),
                saved.getUser().getFullName(),
                saved.getActivity().getTitle(),
                saved.getStatus().name(),
                saved.getMotifRejet(),
                null,
                null
        );

        notificationService.notifyUser(
                saved.getUser().getId(),
                "Inscription Rejetée",
                "Votre inscription à l'activité \"" + saved.getActivity().getTitle() + "\" a été rejetée. Motif : " + saved.getMotifRejet(),
                tn.tunisietelecom.activitessociales.notification.entity.Notification.NotificationType.ERROR
        );

        auditService.log("REGISTRATION_REJECTED", "Registration", saved.getId(), adminEmail, null,
                "Motif: " + saved.getMotifRejet());
        return toResponse(saved);
    }

    @Transactional
    @tn.tunisietelecom.activitessociales.audit.annotation.Auditable(action = "REGISTRATION_VALIDATE_QR")
    public RegistrationResponse validateQr(QrValidationRequest request, String adminEmail) {
        Long registrationId = qrCodeService.extractRegistrationId(request.getQrContent());
        Registration registration = getRegistration(registrationId);
        if (registration.getStatus() != Registration.RegistrationStatus.APPROVED) {
            throw new BadRequestException("QR Code non valide: inscription non approuvee.");
        }
        if (registration.getValidatedAt() != null) {
            throw new BadRequestException("Cette inscription a deja ete validee.");
        }
        registration.setValidatedAt(LocalDateTime.now());
        Registration saved = registrationRepository.save(registration);
        auditService.log("REGISTRATION_QR_VALIDATED", "Registration", saved.getId(), adminEmail, null,
                "Presence validee par QR Code");
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public Resource getQrCode(Long id, String email) {
        Registration registration = getOwnedOrAdminRegistration(id, email);
        if (registration.getStatus() != Registration.RegistrationStatus.APPROVED || registration.getQrCodePath() == null) {
            throw new BadRequestException("QR Code disponible uniquement apres approbation.");
        }

        Path path = Paths.get(registration.getQrCodePath().replaceFirst("^/uploads/", "uploads/")).toAbsolutePath().normalize();
        Resource resource = new FileSystemResource(path);
        if (!resource.exists()) {
            throw new ResourceNotFoundException("QR Code introuvable.");
        }
        return resource;
    }

    @Transactional(readOnly = true)
    public Resource getTicket(Long id, String email) {
        User user = getUser(email);
        Registration registration = registrationRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inscription introuvable."));
        if (!Objects.equals(registration.getUser().getId(), user.getId()) && user.getRole() != User.Role.ADMIN) {
            throw new BadRequestException("Document accessible uniquement par le proprietaire ou un admin.");
        }
        if (registration.getStatus() != Registration.RegistrationStatus.APPROVED || registration.getQrCodePath() == null) {
            throw new BadRequestException("Ticket disponible uniquement apres approbation.");
        }
        return ticketService.generateTicket(registration);
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private Registration getOwnedOrAdminRegistration(Long id, String email) {
        User user = getUser(email);
        Registration registration = getRegistration(id);
        if (!Objects.equals(registration.getUser().getId(), user.getId()) && user.getRole() != User.Role.ADMIN) {
            throw new BadRequestException("Document accessible uniquement par le proprietaire ou un admin.");
        }
        return registration;
    }

    private void validateCanRegister(User user, Activity activity, int seats) {
        if (activity.getStatus() != Activity.ActivityStatus.OPEN) {
            throw new BadRequestException("Cette activite n'est pas ouverte aux inscriptions.");
        }
        if (activity.getRegistrationDeadline() != null && activity.getRegistrationDeadline().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("La date limite d'inscription est depassee.");
        }
        if (registrationRepository.existsByUserIdAndActivityId(user.getId(), activity.getId())) {
            throw new BadRequestException("Vous etes deja inscrit a cette activite.");
        }
        if (seats < 1) {
            throw new BadRequestException("Le nombre de places doit etre au moins 1.");
        }
        ensureCapacityForApply(activity, seats);
    }

    private void ensureCapacityForApply(Activity activity, int requestedSeats) {
        if (activity.getCapacityMax() == null) return;
        long reserved = registrationRepository.sumReservedSeats(activity.getId());
        if (reserved + requestedSeats > activity.getCapacityMax()) {
            long available = Math.max(0, activity.getCapacityMax() - reserved);
            throw new BadRequestException(
                    available == 0
                            ? "Capacite maximale atteinte. Aucune place disponible."
                            : "Seulement " + available + " place(s) disponible(s). Vous ne pouvez pas reserver " + requestedSeats + " place(s)."
            );
        }
    }

    private void ensureCapacityForApprove(Activity activity, int seatCount) {
        if (activity.getCapacityMax() == null) return;
        long approvedSeats = registrationRepository.sumSeatsByActivityIdAndStatus(activity.getId(), Registration.RegistrationStatus.APPROVED);
        if (approvedSeats + seatCount > activity.getCapacityMax()) {
            throw new BadRequestException("Capacite maximale de l'activite deja atteinte par les inscriptions approuvees.");
        }
    }

    private Registration getRegistration(Long id) {
        return registrationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Inscription introuvable."));
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable."));
    }

    private Activity getActivity(Long id) {
        return activityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Activite introuvable."));
    }

    private String writeExtraData(Map<String, Object> extraData) {
        try {
            return objectMapper.writeValueAsString(extraData == null ? Map.of() : extraData);
        } catch (JsonProcessingException e) {
            throw new BadRequestException("Donnees supplementaires invalides.");
        }
    }

    private Map<String, Object> readExtraData(String extraData) {
        try {
            return objectMapper.readValue(extraData == null ? "{}" : extraData, new TypeReference<>() {});
        } catch (JsonProcessingException e) {
            return Map.of();
        }
    }

    private String normalizeSearch(String value) {
        if (value == null || value.trim().isEmpty()) return null;
        return value.trim();
    }

    private RegistrationResponse toResponse(Registration registration) {
        Activity activity = registration.getActivity();
        ActivityType type = activity.getActivityType();
        User user = registration.getUser();

        ActivityResponse activityResponse = ActivityResponse.builder()
                .id(activity.getId())
                .title(activity.getTitle())
                .description(activity.getDescription())
                .location(activity.getLocation())
                .startsAt(activity.getStartsAt())
                .endsAt(activity.getEndsAt())
                .registrationDeadline(activity.getRegistrationDeadline())
                .capacityMax(activity.getCapacityMax())
                .coverPhotoUrl(activity.getCoverPhotoUrl())
                .status(activity.getStatus())
                .galleryPhotoUrls(activity.getGalleryPhotoUrls())
                .customFieldValues(readJsonMap(activity.getCustomFieldValues()))
                .activityType(ActivityTypeResponse.builder()
                        .id(type.getId())
                        .name(type.getName())
                        .code(type.getCode())
                        .description(type.getDescription())
                        .icon(type.getIcon())
                        .active(type.isActive())
                        .customFieldsSchema(readSchema(type.getCustomFieldsSchema()))
                        .createdAt(type.getCreatedAt())
                        .updatedAt(type.getUpdatedAt())
                        .build())
                .createdAt(activity.getCreatedAt())
                .updatedAt(activity.getUpdatedAt())
                .build();

        return RegistrationResponse.builder()
                .id(registration.getId())
                .activity(activityResponse)
                .userId(user.getId())
                .userFullName(user.getFullName())
                .userEmail(user.getEmail())
                .userMatricule(user.getMatricule())
                .status(registration.getStatus())
                .motifRejet(registration.getMotifRejet())
                .qrCodePath(registration.getQrCodePath())
                .extraData(readExtraData(registration.getExtraData()))
                .seatCount(registration.getSeatCount())
                .registeredAt(registration.getRegisteredAt())
                .updatedAt(registration.getUpdatedAt())
                .validatedAt(registration.getValidatedAt())
                .build();
    }

    private Map<String, Object> readJsonMap(String json) {
        try {
            return objectMapper.readValue(json == null ? "{}" : json, new TypeReference<>() {});
        } catch (JsonProcessingException e) {
            return Map.of();
        }
    }

    private Map<String, ActivityTypeRequest.FieldSchema> readSchema(String schema) {
        try {
            return objectMapper.readValue(schema, new TypeReference<>() {});
        } catch (JsonProcessingException e) {
            return Map.of();
        }
    }
}