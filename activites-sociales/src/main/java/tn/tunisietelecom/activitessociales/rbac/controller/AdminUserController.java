package tn.tunisietelecom.activitessociales.rbac.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tn.tunisietelecom.activitessociales.auth.dto.MessageResponse;
import tn.tunisietelecom.activitessociales.rbac.dto.*;
import tn.tunisietelecom.activitessociales.rbac.service.AdminUserService;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Gestion utilisateurs", description = "CRUD complet des comptes par l'administrateur")
public class AdminUserController {

    private final AdminUserService service;

    @GetMapping
    @Operation(summary = "Lister tous les utilisateurs")
    public ResponseEntity<Page<AdminUserResponse>> list(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(service.list(search, pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Détail d'un utilisateur")
    public ResponseEntity<AdminUserResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PostMapping
    @Operation(summary = "Créer un compte utilisateur")
    public ResponseEntity<AdminUserResponse> create(@Valid @RequestBody AdminCreateUserRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(req));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Modifier un utilisateur")
    public ResponseEntity<AdminUserResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody AdminUpdateUserRequest req) {
        return ResponseEntity.ok(service.update(id, req));
    }

    @PatchMapping("/{id}/toggle-active")
    @Operation(summary = "Activer ou désactiver un compte")
    public ResponseEntity<MessageResponse> toggleActive(
            @PathVariable Long id,
            @RequestBody Map<String, Boolean> body) {
        service.toggleActive(id, Boolean.TRUE.equals(body.get("active")));
        return ResponseEntity.ok(new MessageResponse("Statut mis à jour."));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Supprimer un utilisateur")
    public ResponseEntity<MessageResponse> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(new MessageResponse("Utilisateur supprimé."));
    }
}