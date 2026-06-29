package tn.tunisietelecom.activitessociales.activitytype.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tn.tunisietelecom.activitessociales.activitytype.dto.*;
import tn.tunisietelecom.activitessociales.activitytype.service.ActivityTypeService;
import tn.tunisietelecom.activitessociales.auth.dto.MessageResponse;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Tag(name = "Types d'activites", description = "Configuration des types d'activites et formulaires dynamiques")
public class ActivityTypeController {

    private final ActivityTypeService service;

    @GetMapping("/activity-types")
    @Operation(summary = "Lister les types d'activites")
    public ResponseEntity<List<ActivityTypeResponse>> findAll() {
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/activity-types/{id}")
    @Operation(summary = "Consulter un type d'activite")
    public ResponseEntity<ActivityTypeResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PostMapping("/admin/activity-types")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Creer un type d'activite")
    public ResponseEntity<ActivityTypeResponse> create(@Valid @RequestBody ActivityTypeRequest request) {
        service.validateCode(request.getCode());
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }

    @PutMapping("/admin/activity-types/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Modifier un type d'activite")
    public ResponseEntity<ActivityTypeResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody ActivityTypeRequest request) {
        service.validateCode(request.getCode());
        return ResponseEntity.ok(service.update(id, request));
    }

    @PatchMapping("/admin/activity-types/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Activer ou desactiver un type d'activite")
    public ResponseEntity<ActivityTypeResponse> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody ActivityTypeStatusRequest request) {
        return ResponseEntity.ok(service.updateStatus(id, request.getActive()));
    }

    @DeleteMapping("/admin/activity-types/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Supprimer un type d'activite")
    public ResponseEntity<MessageResponse> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(new MessageResponse("Type d'activite supprime avec succes."));
    }
}
