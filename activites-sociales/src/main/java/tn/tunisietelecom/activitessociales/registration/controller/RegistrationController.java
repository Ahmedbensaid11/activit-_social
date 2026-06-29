package tn.tunisietelecom.activitessociales.registration.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.*;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import tn.tunisietelecom.activitessociales.auth.dto.MessageResponse;
import tn.tunisietelecom.activitessociales.registration.dto.*;
import tn.tunisietelecom.activitessociales.registration.entity.Registration;
import tn.tunisietelecom.activitessociales.registration.service.RegistrationService;

import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Inscriptions", description = "Gestion des inscriptions aux activites et QR Codes")
public class RegistrationController {

    private final RegistrationService service;

    @PostMapping("/activities/{id}/register")
    @Operation(summary = "Inscription d'un employe a une activite")
    public ResponseEntity<RegistrationResponse> register(
            @PathVariable Long id,
            @RequestBody(required = false) RegistrationRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.register(id, userDetails.getUsername(), request));
    }

    @DeleteMapping("/activities/{id}/register")
    @Operation(summary = "Annulation d'une inscription")
    public ResponseEntity<MessageResponse> cancel(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        service.cancelRegistration(id, userDetails.getUsername());
        return ResponseEntity.ok(new MessageResponse("Inscription annulee avec succes."));
    }

    /**
     * Real-time available seats endpoint — used by the frontend to show accurate capacity.
     */
    @GetMapping("/activities/{id}/seats")
    @Operation(summary = "Places disponibles en temps reel pour une activite")
    public ResponseEntity<Map<String, Object>> availableSeats(@PathVariable Long id) {
        return ResponseEntity.ok(service.getAvailableSeats(id));
    }

    @GetMapping("/activities/{id}/registrations")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Liste paginee des inscrits d'une activite")
    public ResponseEntity<Page<RegistrationResponse>> registrationsForActivity(
            @PathVariable Long id,
            @RequestParam(required = false) Registration.RegistrationStatus status,
            @PageableDefault(size = 10, sort = "registeredAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(service.registrationsForActivity(id, status, pageable));
    }

    @GetMapping("/activities/registrations/me")
    @Operation(summary = "Mes inscriptions")
    public ResponseEntity<Page<RegistrationResponse>> myRegistrations(
            @AuthenticationPrincipal UserDetails userDetails,
            @PageableDefault(size = 10, sort = "registeredAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(service.myRegistrations(userDetails.getUsername(), pageable));
    }

    @GetMapping("/admin/registrations")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Gestion admin des inscriptions")
    public ResponseEntity<Page<RegistrationResponse>> adminSearch(
            @RequestParam(required = false) Long activityId,
            @RequestParam(required = false) Registration.RegistrationStatus status,
            @RequestParam(required = false) String employee,
            @PageableDefault(size = 20, sort = "registeredAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(service.adminSearch(activityId, status, employee, pageable));
    }

    @PatchMapping("/admin/registrations/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Approuver une inscription et generer le QR Code")
    public ResponseEntity<RegistrationResponse> approve(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(service.approve(id, userDetails.getUsername()));
    }

    @PatchMapping("/admin/registrations/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Rejeter une inscription avec motif")
    public ResponseEntity<RegistrationResponse> reject(
            @PathVariable Long id,
            @Valid @RequestBody RejectRegistrationRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(service.reject(id, request, userDetails.getUsername()));
    }

    @PostMapping("/admin/registrations/validate-qr")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Valider une presence via contenu QR")
    public ResponseEntity<RegistrationResponse> validateQr(
            @Valid @RequestBody QrValidationRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(service.validateQr(request, userDetails.getUsername()));
    }

    @GetMapping("/registrations/{id}/qrcode")
    @Operation(summary = "Retourner l'image QR Code PNG")
    public ResponseEntity<Resource> qrCode(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        Resource resource = service.getQrCode(id, userDetails.getUsername());
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"registration-" + id + "-qrcode.png\"")
                .body(resource);
    }

    @GetMapping("/registrations/{id}/ticket")
    @Operation(summary = "Retourner le ticket d'inscription PNG avec QR Code")
    public ResponseEntity<Resource> ticket(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        Resource resource = service.getTicket(id, userDetails.getUsername());
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"ticket-inscription-" + id + ".png\"")
                .body(resource);
    }
}