package tn.tunisietelecom.activitessociales.rbac.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tn.tunisietelecom.activitessociales.auth.dto.MessageResponse;
import tn.tunisietelecom.activitessociales.rbac.dto.*;
import tn.tunisietelecom.activitessociales.rbac.service.CustomRoleService;

import java.util.List;

@RestController
@RequestMapping("/api/admin/roles")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Rôles personnalisés", description = "CRUD rôles et assignation de permissions")
public class CustomRoleController {

    private final CustomRoleService service;

    @GetMapping
    @Operation(summary = "Lister tous les rôles personnalisés")
    public ResponseEntity<List<CustomRoleResponse>> findAll() {
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CustomRoleResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @GetMapping("/permissions")
    @Operation(summary = "Lister toutes les permissions disponibles")
    public ResponseEntity<List<PermissionDto>> permissions() {
        return ResponseEntity.ok(service.allPermissions());
    }

    @PostMapping
    public ResponseEntity<CustomRoleResponse> create(@Valid @RequestBody CustomRoleRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CustomRoleResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody CustomRoleRequest req) {
        return ResponseEntity.ok(service.update(id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<MessageResponse> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(new MessageResponse("Rôle supprimé."));
    }
}