package tn.tunisietelecom.activitessociales.audit.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import tn.tunisietelecom.activitessociales.audit.entity.AuditLog;
import tn.tunisietelecom.activitessociales.audit.service.AuditService;

import java.time.LocalDate;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/audit")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Audit Logs", description = "Consultation du journal d'audit (MongoDB)")
public class AuditController {

    private final AuditService auditService;

    @GetMapping
    @Operation(summary = "Consulter le journal d'audit paginé avec filtres")
    public ResponseEntity<Page<AuditLog>> searchLogs(
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String performedBy,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateDebut,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFin,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size) {

        LocalDateTime start = dateDebut != null ? dateDebut.atStartOfDay() : null;
        LocalDateTime end   = dateFin != null ? dateFin.plusDays(1).atStartOfDay() : null;

        Pageable pageable = PageRequest.of(page, size, Sort.by("timestamp").descending());
        return ResponseEntity.ok(auditService.searchLogs(action, performedBy, start, end, pageable));
    }
}
