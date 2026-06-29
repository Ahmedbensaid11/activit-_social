package tn.tunisietelecom.activitessociales.activity.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tn.tunisietelecom.activitessociales.activity.dto.*;
import tn.tunisietelecom.activitessociales.activity.entity.Activity;
import tn.tunisietelecom.activitessociales.activity.service.ActivityService;
import tn.tunisietelecom.activitessociales.auth.dto.MessageResponse;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Activites", description = "Gestion generique des activites et galeries photos")
public class ActivityController {

    private final ActivityService service;

    @GetMapping("/activities")
    @Operation(summary = "Lister les activites")
    public ResponseEntity<List<ActivityResponse>> findAll(
            @RequestParam(required = false) Long typeId,
            @RequestParam(required = false) Activity.ActivityStatus status) {
        return ResponseEntity.ok(service.findAll(typeId, status));
    }

    @GetMapping("/activities/{id}")
    @Operation(summary = "Consulter une activite")
    public ResponseEntity<ActivityResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping("/admin/activities")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Creer une activite")
    public ResponseEntity<ActivityResponse> create(@Valid @RequestBody ActivityRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/admin/activities/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Modifier une activite")
    public ResponseEntity<ActivityResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody ActivityRequest request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @PatchMapping("/admin/activities/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Modifier le statut d'une activite")
    public ResponseEntity<ActivityResponse> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody ActivityStatusRequest request) {
        return ResponseEntity.ok(service.updateStatus(id, request.getStatus()));
    }

    @DeleteMapping("/admin/activities/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Supprimer une activite")
    public ResponseEntity<MessageResponse> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(new MessageResponse("Activite supprimee avec succes."));
    }
}
